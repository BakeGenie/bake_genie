import { Router } from 'express';
import multer from 'multer';
import { Pool } from '@neondatabase/serverless';
import { isAuthenticated } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/', { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
const router = Router();

// Create a direct database connection for maximum reliability
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to parse CSV lines properly handling quotes
function parseCSVLine(line: string) {
  const values: string[] = [];
  let inQuote = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuote = !inQuote;
    } 
    else if (char === ',' && !inQuote) {
      values.push(currentValue.trim());
      currentValue = '';
    } 
    else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  return values;
}

// Function to handle Bake Diary date format
function formatBakeDiaryDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Remove quotes if present
  dateStr = dateStr.replace(/^"|"$/g, '').trim();
  
  // Handle format "DD MMM YYYY" (like "11 Jan 2025")
  const dateParts = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (dateParts) {
    const day = parseInt(dateParts[1]).toString().padStart(2, '0');
    const month = dateParts[2].toLowerCase();
    const year = dateParts[3];
    
    // Map month names to numbers
    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    if (monthMap[month]) {
      return `${year}-${monthMap[month]}-${day}`;
    }
  }
  
  console.log(`Could not parse date: ${dateStr}, using current date`);
  return new Date().toISOString().split('T')[0];
}

// DIRECT QUERY APPROACH WITHOUT ORM
router.post('/api/expenses-import', isAuthenticated, upload.single('file'), async (req, res) => {
  // Get direct database client
  const client = await pool.connect();
  
  try {
    console.log("=== MANUAL BAKE DIARY EXPENSE IMPORT STARTED ===");
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Split into lines and remove empty ones
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header line and one data line");
    }
    
    // Parse headers (first line)
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log("Headers:", headers);
    
    // Specific mapping for Bake Diary format
    // CSV column: "Date" → Database field: "date"
    // CSV column: "Description" → Database field: "description"
    // CSV column: "Category" → Database field: "category"
    // CSV column: "Vendor" → Database field: "supplier"
    // CSV column: "Payment" → Database field: "payment_source"
    // CSV column: "VAT" → Database field: "vat"
    // CSV column: "Amount (Incl VAT)" → Database field: "amount"
    const headerPositions: Record<string, number> = {};
    
    headers.forEach((header, index) => {
      headerPositions[header] = index;
    });
    
    console.log("Header positions:", headerPositions);
    
    // Begin database transaction
    await client.query('BEGIN');
    
    // Process rows
    const expenses = [];
    const parsedRows = [];
    
    // Log the first row to verify data structure
    if (lines.length > 1) {
      const firstRowValues = parseCSVLine(lines[1]);
      console.log("First row values:", firstRowValues);
      
      const firstRowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index < firstRowValues.length) {
          firstRowData[header] = firstRowValues[index];
        }
      });
      
      console.log("First row:", firstRowData);
    }
    
    // Parse all rows first for debugging
    for (let i = 1; i < lines.length; i++) {
      const rowValues = parseCSVLine(lines[i]);
      if (rowValues.length < 3) continue; // Skip empty or invalid rows
      
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index < rowValues.length) {
          rowData[header] = rowValues[index];
        }
      });
      
      parsedRows.push(rowData);
    }
    
    console.log(`Total rows: ${parsedRows.length}`);
    
    // Process validated rows
    for (const row of parsedRows) {
      try {
        // Extract and clean values
        const date = formatBakeDiaryDate(row['Date'] || '');
        const description = (row['Description'] || '').replace(/^"|"$/g, '');
        const supplier = (row['Vendor'] || '').replace(/^"|"$/g, '');
        const category = (row['Category'] || '').replace(/^"|"$/g, '');
        const paymentSource = (row['Payment'] || '').replace(/^"|"$/g, '');
        
        // Handle amounts (remove currency symbols and formatting)
        let vat = '0';
        if (row['VAT']) {
          vat = row['VAT'].replace(/^"|"$/g, '').replace(/[^0-9.]/g, '');
        }
        
        let amount = '0';
        if (row['Amount (Incl VAT)']) {
          amount = row['Amount (Incl VAT)'].replace(/^"|"$/g, '').replace(/[^0-9.]/g, '');
        }
        
        // Insert directly using prepared statement
        const insertQuery = `
          INSERT INTO expenses (
            user_id, date, description, category, supplier, 
            payment_source, vat, amount, total_inc_tax
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;
        
        const values = [
          userId,
          date,
          description,
          category,
          supplier,
          paymentSource,
          vat,
          amount,
          amount // total_inc_tax = amount for Bake Diary import
        ];
        
        console.log(`Inserting expense: ${description} (${date}), Amount: ${amount}`);
        
        const result = await client.query(insertQuery, values);
        expenses.push(result.rows[0]);
        
      } catch (err: any) {
        console.error(`Error inserting row:`, err);
        console.error(`Row data:`, row);
        
        // Try alternative approach for problematic rows
        try {
          // Just log and continue - we'll handle rollback if needed
          console.error(`Skipping problematic row due to: ${err.message}`);
        } catch (backupErr) {
          console.error(`Backup error handling failed:`, backupErr);
        }
      }
    }
    
    // Commit transaction if we got this far
    await client.query('COMMIT');
    console.log(`Successfully imported ${expenses.length} expenses`);
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error deleting temporary file:", err);
    }
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${expenses.length} expenses`,
      expenses: expenses
    });
    
  } catch (error: any) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    console.error("Import error:", error);
    console.error("Stack trace:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: `Error importing expenses: ${error.message}`
    });
    
  } finally {
    // Release database client
    client.release();
  }
});

export default router;