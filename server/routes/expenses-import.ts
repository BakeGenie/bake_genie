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
    
    // Split into lines
    const lines = fileContent.split('\n');
    console.log(`File has ${lines.length} lines`);
    
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header line and one data line");
    }
    
    // Parse headers (first line)
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    console.log("Headers:", headers);
    
    // Process data rows (starting from line 2)
    const expenses = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) {
        continue; // Skip empty lines
      }
      
      // Parse CSV line
      const values = parseCSVLine(lines[i]);
      console.log(`Line ${i+1} has ${values.length} values:`, values);
      
      // Skip rows with too few values
      if (values.length < 3) {
        console.log(`Skipping line ${i+1}: insufficient values`);
        continue;
      }
      
      // Create expense object
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
          
          // Map fields appropriately
          switch(header.trim()) {
            case 'Date':
              // Handle date format "DD MMM YYYY" (e.g., "11 Jan 2025")
              const dateParts = value.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
              if (dateParts) {
                const day = dateParts[1].padStart(2, '0');
                const month = dateParts[2];
                const year = dateParts[3];
                
                // Map month name to number
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthIndex = monthNames.findIndex(m => 
                                  m.toLowerCase() === month.toLowerCase());
                
                if (monthIndex !== -1) {
                  const monthNum = (monthIndex + 1).toString().padStart(2, '0');
                  expense.date = `${year}-${monthNum}-${day}`;
                  console.log(`Parsed date "${value}" to "${expense.date}"`);
                }
              }
              break;
              
            case 'Description':
              expense.description = value;
              break;
              
            case 'Category':
              expense.category = value;
              break;
              
            case 'Amount (Incl VAT)': 
            case 'Amount':
              // Clean up amount: remove currency symbols and convert to number
              const cleanAmount = value.replace(/[$£€]/g, '').trim();
              expense.amount = (parseFloat(cleanAmount) || 0).toString();
              
              // If we have the "Amount (Incl VAT)", also set total_inc_tax to the same value
              if (header.trim() === 'Amount (Incl VAT)') {
                expense.total_inc_tax = expense.amount;
              }
              break;
              
            case 'Vendor':
              expense.supplier = value;
              break;
              
            case 'Payment':
              expense.payment_source = value;
              break;
              
            case 'VAT':
              // Clean up VAT value
              const cleanVat = value.replace(/[$£€]/g, '').trim();
              expense.vat = (parseFloat(cleanVat) || 0).toString();
              break;
          }
        }
      });
      
      console.log("Processed expense:", expense);
      expenses.push(expense);
    }
    
    // Check if we found any valid expenses
    if (expenses.length === 0) {
      throw new Error("No valid expense data found in the CSV file");
    }
    
    console.log(`Found ${expenses.length} valid expenses to import`);
    
    // Insert expenses into database
    const results = [];
    
    for (const expense of expenses) {
      try {
        // Insert using direct SQL query
        const query = `
          INSERT INTO expenses (
            user_id, date, description, category, amount, supplier, 
            payment_source, vat, total_inc_tax, tax_deductible, is_recurring
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ) RETURNING *
        `;
        
        const values = [
          expense.user_id,
          expense.date,
          expense.description || '', // Ensure no null values
          expense.category || '',
          expense.amount,
          expense.supplier || '',
          expense.payment_source || '',
          expense.vat,
          expense.total_inc_tax,
          expense.tax_deductible || false,
          expense.is_recurring || false
        ];
        
        console.log(`Inserting expense with values:`, values);
        
        const result = await db.query(query, values);
        console.log("Insert result:", result.rows[0]);
        results.push(result.rows[0]);
      } catch (err) {
        console.error(`Error inserting expense:`, err);
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