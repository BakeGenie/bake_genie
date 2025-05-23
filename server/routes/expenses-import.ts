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

// Log all database errors helper
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// SIMPLIFIED IMPORT ROUTE - SPECIFICALLY FOR BAKE DIARY FORMAT
router.post('/api/expenses-import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log("=== BAKE DIARY EXPENSE IMPORT STARTED ===");
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const filePath = req.file.path;
    
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(`File loaded, ${fileContent.length} characters`);
    
    // Split into lines - filter out empty lines
    const lines = fileContent.split('\n').filter(line => line.trim());
    console.log(`File has ${lines.length} non-empty lines`);
    
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header line and one data line");
    }
    
    // Determine header line - typically first line
    // But for Bake Diary exports, it might be line 3 after title and blank line
    let headerLineIndex = 0;
    
    // Parse headers
    const headerLine = lines[headerLineIndex];
    const headers = parseCSVLine(headerLine);
    console.log("Headers:", headers);
    
    // Process data rows (starting from line after header)
    const expenses = [];
    
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      // Parse CSV line
      const values = parseCSVLine(lines[i]);
      
      // Skip rows with too few values
      if (values.length < 3) {
        console.log(`Skipping line ${i+1}: insufficient values`);
        continue;
      }
      
      // Create expense object with defaults
      const expense = {
        user_id: userId,
        date: new Date().toISOString().split('T')[0], // Default to today
        description: '',
        category: '',
        amount: '0',
        supplier: '',
        payment_source: '',
        vat: '0',
        total_inc_tax: '0',
        tax_deductible: false,
        is_recurring: false
      };
      
      // Map CSV values to expense fields
      headers.forEach((header, index) => {
        if (index < values.length) {
          let value = values[index];
          
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          
          // Map fields appropriately based on column header
          const cleanHeader = header.trim();
          
          if (cleanHeader === 'Date') {
            // Handle date format "DD MMM YYYY" (e.g., "11 Jan 2025")
            const dateParts = value.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
            if (dateParts) {
              const day = dateParts[1].padStart(2, '0');
              const month = dateParts[2];
              const year = dateParts[3];
              
              // Map month name to number
              const monthMap = {
                'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
                'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
              };
              
              const monthNum = monthMap[month.toLowerCase()];
              if (monthNum) {
                expense.date = `${year}-${monthNum}-${day}`;
                console.log(`Parsed date "${value}" to "${expense.date}"`);
              } else {
                console.log(`Could not parse month in date: ${value}, using default`);
              }
            } else {
              console.log(`Date format not recognized: ${value}, using default`);
            }
          } 
          else if (cleanHeader === 'Description') {
            expense.description = value;
          }
          else if (cleanHeader === 'Category') {
            expense.category = value;
          }
          else if (cleanHeader === 'Amount (Incl VAT)' || cleanHeader === 'Amount') {
            // Clean up amount: remove currency symbols and convert to number
            const cleanAmount = value.replace(/[^0-9.]/g, '').trim();
            expense.amount = cleanAmount || '0';
            expense.total_inc_tax = cleanAmount || '0';
          }
          else if (cleanHeader === 'Vendor') {
            expense.supplier = value;
          }
          else if (cleanHeader === 'Payment') {
            expense.payment_source = value;
          }
          else if (cleanHeader === 'VAT') {
            // Clean up VAT value - keep only numbers and decimal point
            const cleanVat = value.replace(/[^0-9.]/g, '').trim();
            expense.vat = cleanVat || '0';
          }
        }
      });
      
      // If amount is not set but total_inc_tax is, use that value
      if (expense.amount === '0' && expense.total_inc_tax !== '0') {
        expense.amount = expense.total_inc_tax;
      }
      
      // If total_inc_tax is not set but amount is, use that value
      if (expense.total_inc_tax === '0' && expense.amount !== '0') {
        expense.total_inc_tax = expense.amount;
      }
      
      expenses.push(expense);
    }
    
    // Check if we found any valid expenses
    if (expenses.length === 0) {
      throw new Error("No valid expense data found in the CSV file");
    }
    
    console.log(`Found ${expenses.length} valid expenses to import`);
    
    // Insert expenses into database
    const results = [];
    
    // Make sure the expenses table exists with the correct schema
    try {
      await db.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM pg_type WHERE typname = 'expenses_tax_deductible_check'
          ) THEN
            ALTER TABLE expenses ALTER COLUMN tax_deductible SET DEFAULT false;
            ALTER TABLE expenses ALTER COLUMN is_recurring SET DEFAULT false;
            ALTER TABLE expenses ALTER COLUMN vat SET DEFAULT '0';
            ALTER TABLE expenses ALTER COLUMN total_inc_tax SET DEFAULT '0';
          END IF;
        END
        $$;
      `);
      console.log("Database schema check/update successful");
    } catch (err) {
      console.warn("Error checking/updating database schema:", err);
    }
    
    for (const expense of expenses) {
      try {
        // Insert using direct SQL query
        const query = `
          INSERT INTO expenses (
            user_id, date, description, category, amount, supplier, 
            payment_source, vat, total_inc_tax, tax_deductible, is_recurring
          ) VALUES (
            $1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ) RETURNING *
        `;
        
        // Generate date in a format PostgreSQL can interpret
        let dateValue = expense.date;
        try {
          // If date is not in ISO format, make sure to explicitly cast it
          if (!/^\d{4}-\d{2}-\d{2}$/.test(expense.date)) {
            const parts = expense.date.split('-');
            if (parts.length === 3) {
              dateValue = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            }
          }
        } catch (err) {
          console.error("Date parsing error:", err);
          // Fall back to today's date
          dateValue = new Date().toISOString().split('T')[0];
        }
        
        const values = [
          expense.user_id,
          dateValue,
          expense.description || '', // Ensure no null values
          expense.category || '',
          expense.amount || '0',
          expense.supplier || '',
          expense.payment_source || '',
          expense.vat || '0',
          expense.total_inc_tax || '0',
          false, // Default tax_deductible to false
          false  // Default is_recurring to false
        ];
        
        console.log(`Inserting expense with values:`, values);
        
        try {
          const result = await db.query(query, values);
          console.log("Insert result:", result.rows[0]);
          results.push(result.rows[0]);
        } catch (err) {
          console.error(`Error executing query:`, err);
          // Try a different query with more explicit type casting
          try {
            const backupQuery = `
              INSERT INTO expenses (
                user_id, date, description, category, amount, supplier, 
                payment_source, vat, total_inc_tax, tax_deductible, is_recurring
              ) VALUES (
                $1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10, $11
              ) RETURNING *
            `;
            const backupResult = await db.query(backupQuery, values);
            console.log("Backup insert successful:", backupResult.rows[0]);
            results.push(backupResult.rows[0]);
          } catch (fallbackErr) {
            console.error(`Fallback insert also failed:`, fallbackErr);
          }
        }
      } catch (err) {
        console.error(`Error processing expense:`, err);
      }
    }
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
      console.log("Temporary file deleted:", filePath);
    } catch (err) {
      console.error("Error deleting temporary file:", err);
    }
    
    console.log(`Import completed: ${results.length} expenses imported`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${results.length} expenses`,
      expenses: results
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