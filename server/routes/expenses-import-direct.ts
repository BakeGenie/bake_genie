import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
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

// Helper function to parse CSV lines properly handling quotes
function parseCSVLine(line) {
  const values = [];
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

// DIRECT SQL APPROACH FOR BAKE DIARY EXPENSE IMPORT
router.post('/api/expenses-import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log("=== BAKE DIARY EXPENSE IMPORT STARTED (DIRECT SQL) ===");
    
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
    
    // Assume headers are on the first line
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log("Headers:", headers);
    
    // Column mappings for Bake Diary format
    const columnMap = {
      date: headers.indexOf('Date'),
      description: headers.indexOf('Description'),
      vendor: headers.indexOf('Vendor'),
      category: headers.indexOf('Category'),
      payment: headers.indexOf('Payment'),
      vat: headers.indexOf('VAT'),
      amount: headers.indexOf('Amount (Incl VAT)'),
    };
    
    // Check if all required columns exist
    if (columnMap.date === -1 || columnMap.description === -1 || columnMap.category === -1 || columnMap.amount === -1) {
      throw new Error("CSV is missing required columns: Date, Description, Category, Amount (Incl VAT)");
    }
    
    // Process data rows
    const expenses = [];
    
    // Create the SQL transaction to handle all inserts atomically
    await db.query('BEGIN');
    
    try {
      // Process each row of data after the header
      for (let i = 1; i < lines.length; i++) {
        const rowValues = parseCSVLine(lines[i]);
        
        // Skip rows that don't have enough values
        if (rowValues.length < 3) continue;
        
        // Extract values for each column using our column map
        const rawDate = rowValues[columnMap.date].replace(/^"|"$/g, '');
        const description = rowValues[columnMap.description].replace(/^"|"$/g, '');
        const category = rowValues[columnMap.category].replace(/^"|"$/g, '');
        const supplier = columnMap.vendor !== -1 ? rowValues[columnMap.vendor].replace(/^"|"$/g, '') : '';
        const payment = columnMap.payment !== -1 ? rowValues[columnMap.payment].replace(/^"|"$/g, '') : '';
        const vat = columnMap.vat !== -1 ? rowValues[columnMap.vat].replace(/^"|"$/g, '').replace(/[^0-9.]/g, '') : '0';
        const amount = rowValues[columnMap.amount].replace(/^"|"$/g, '').replace(/[^0-9.]/g, '');
        
        // Parse the Bake Diary date format "DD MMM YYYY" to PostgreSQL format
        let formattedDate;
        
        if (rawDate) {
          const dateParts = rawDate.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
          
          if (dateParts) {
            const day = parseInt(dateParts[1]).toString().padStart(2, '0');
            const month = dateParts[2].toLowerCase();
            const year = dateParts[3];
            
            // Map month names to numbers
            const monthMap = {
              'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 
              'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 
              'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
            };
            
            if (monthMap[month]) {
              formattedDate = `${year}-${monthMap[month]}-${day}`;
            } else {
              console.log(`Unrecognized month format: ${month}, using current date`);
              formattedDate = new Date().toISOString().split('T')[0];
            }
          } else {
            console.log(`Date format not recognized: ${rawDate}, using current date`);
            formattedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          formattedDate = new Date().toISOString().split('T')[0];
        }
        
        // Skip records with empty amount
        if (!amount) continue;
        
        // Use parameterized query to safely insert the data
        const insertQuery = `
          INSERT INTO expenses (
            user_id, date, description, category, amount, supplier, 
            payment_source, vat, total_inc_tax
          ) VALUES (
            $1, TO_DATE($2, 'YYYY-MM-DD'), $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *
        `;
        
        const values = [
          userId,
          formattedDate,
          description || '',
          category || '',
          amount || '0',
          supplier || '',
          payment || '',
          vat || '0',
          amount || '0'  // total_inc_tax = amount if not otherwise specified
        ];
        
        console.log(`Inserting expense: ${description} on ${formattedDate}, Amount: ${amount}`);
        
        const result = await db.query(insertQuery, values);
        console.log("Insert result ID:", result.rows[0].id);
        
        expenses.push(result.rows[0]);
      }
      
      // Commit the transaction if all went well
      await db.query('COMMIT');
      console.log(`Successfully imported ${expenses.length} expenses`);
      
    } catch (err) {
      // Rollback the transaction if anything failed
      await db.query('ROLLBACK');
      console.error("Transaction failed:", err);
      throw err;
    }
    
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
    
  } catch (error) {
    console.error("Import error:", error);
    
    return res.status(500).json({
      success: false,
      message: 'Error importing expenses: ' + error.message
    });
  }
});

export default router;