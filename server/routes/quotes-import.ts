import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';
import { pool } from '../db';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = Router();

// Generate a new quote number with format "Q-YYYY-XXXXX"
function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `Q-${year}-${randomNum}`;
}

// Helper function to parse a date string in various formats
function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try to parse various date formats
  const parsedDate = new Date(dateString);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  
  // Try to parse "DD Month YYYY" format (e.g., "19 May 2025")
  const parts = dateString.split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
      .findIndex(m => parts[1].toLowerCase().startsWith(m));
    const year = parseInt(parts[2], 10);
    
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  
  return null;
}

// Upload route to import CSV and preview its content
router.post('/api/quotes-import/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileRows: any[] = [];
    const headers: string[] = [];
    let firstRow = true;

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(parse({ delimiter: ',' }))
      .on('data', (row) => {
        if (firstRow) {
          headers.push(...row);
          firstRow = false;
        } else {
          const rowData: any = {};
          row.forEach((value: string, index: number) => {
            rowData[headers[index]] = value;
          });
          fileRows.push(rowData);
        }
      })
      .on('end', () => {
        const previewData = fileRows.slice(0, 10); // First 10 rows for preview
        res.json({
          headers,
          preview: previewData,
          totalRows: fileRows.length,
          filePath: req.file!.path
        });
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        res.status(500).json({ error: 'Failed to parse CSV file' });
      });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).json({ error: 'Server error processing file' });
  }
});

// Route to import quotes with column mapping
router.post('/api/quotes-import/import', async (req, res) => {
  try {
    const { filePath, columnMapping, userId } = req.body;

    if (!filePath || !columnMapping) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const fileRows: any[] = [];
    const headers: string[] = [];
    let firstRow = true;
    let importedCount = 0;
    const errors: string[] = [];

    // Parse CSV file
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',' }))
      .on('data', async (row) => {
        if (firstRow) {
          headers.push(...row);
          firstRow = false;
        } else {
          const rowData: any = {};
          row.forEach((value: string, index: number) => {
            rowData[headers[index]] = value;
          });
          fileRows.push(rowData);
        }
      })
      .on('end', async () => {
        // Process each row and import to database
        for (const row of fileRows) {
          try {
            const quoteData: Record<string, any> = {
              user_id: userId || 1,
              quote_id: row[columnMapping.quote_id] || generateQuoteNumber(),
              status: 'active',
              created_at: new Date().toISOString()
            };

            // Map fields based on column mapping
            if (columnMapping.name && row[columnMapping.name]) {
              quoteData.name = row[columnMapping.name];
            }

            if (columnMapping.event_date && row[columnMapping.event_date]) {
              const eventDate = parseDate(row[columnMapping.event_date]);
              if (eventDate) {
                quoteData.event_date = eventDate.toISOString();
              }
            }

            if (columnMapping.description && row[columnMapping.description]) {
              quoteData.description = row[columnMapping.description];
            }

            if (columnMapping.event_type && row[columnMapping.event_type]) {
              quoteData.event_type = row[columnMapping.event_type];
            }

            if (columnMapping.price && row[columnMapping.price]) {
              // Remove currency symbols and convert to number
              const price = row[columnMapping.price].replace(/[^0-9.]/g, '');
              quoteData.price = parseFloat(price) || 0;
            }

            // Check if we need to create a contact first
            let contactId = null;
            if (columnMapping.name && row[columnMapping.name]) {
              // Try to find existing contact
              const contactResult = await pool.query(
                `SELECT id FROM contacts WHERE name = $1 AND user_id = $2 LIMIT 1`,
                [row[columnMapping.name], quoteData.user_id]
              );

              if (contactResult.rows.length > 0) {
                contactId = contactResult.rows[0].id;
              } else {
                // Create a new contact
                const newContactResult = await pool.query(
                  `INSERT INTO contacts (name, user_id, created_at) 
                   VALUES ($1, $2, $3) RETURNING id`,
                  [row[columnMapping.name], quoteData.user_id, new Date().toISOString()]
                );
                contactId = newContactResult.rows[0].id;
              }
              quoteData.contact_id = contactId;
            }

            // Insert the quote
            const columns = Object.keys(quoteData);
            const values = Object.values(quoteData);
            const placeholders = values.map((_, i) => `$${i+1}`).join(', ');
            
            await pool.query(
              `INSERT INTO quotes (${columns.join(', ')}) 
               VALUES (${placeholders})`,
              values
            );

            importedCount++;
          } catch (error) {
            console.error('Error importing quote:', error);
            errors.push(`Error importing row: ${JSON.stringify(row)}`);
          }
        }

        // Clean up the temporary file
        fs.unlinkSync(filePath);

        res.json({
          success: true,
          importedCount,
          errors,
          message: `Successfully imported ${importedCount} quotes with ${errors.length} errors.`
        });
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        res.status(500).json({ error: 'Failed to parse CSV file' });
      });
  } catch (error) {
    console.error('Error importing quotes:', error);
    res.status(500).json({ error: 'Server error processing import' });
  }
});

export const quotesImportRouter = router;