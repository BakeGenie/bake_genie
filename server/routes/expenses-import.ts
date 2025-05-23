import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { isAuthenticated } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Make sure the uploads directory exists
    if (!fs.existsSync('uploads/')) {
      fs.mkdirSync('uploads/', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });
const router = Router();

// Route to handle expense CSV import - simplified version
router.post('/api/expenses-import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log("=== EXPENSE IMPORT STARTED ===");
    
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log(`File uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    
    const userId = req.session.user?.id;
    if (!userId) {
      console.error("User not authenticated");
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    const filePath = req.file.path;
    
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log(`File content length: ${fileContent.length} characters`);
    
    // -------------------- SIMPLE CSV PARSING --------------------
    
    // Split content into lines and remove empty lines
    const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row");
    }
    
    console.log(`CSV has ${lines.length} non-empty lines`);
    
    // Assume first line contains headers
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());
    
    console.log("Headers:", headers);
    
    // Process data rows (skip header)
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      // Skip rows that don't have enough values
      if (values.length < headers.length / 2) {
        console.log(`Skipping row ${i+1}: not enough values`);
        continue;
      }
      
      const row = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          row[header] = values[index];
        } else {
          row[header] = ''; // Set empty value for missing columns
        }
      });
      
      rows.push(row);
    }
    
    console.log(`Processed ${rows.length} data rows`);
    
    if (rows.length === 0) {
      throw new Error("No valid data rows found in CSV");
    }
    
    console.log("First data row:", rows[0]);
    
    // -------------------- DATABASE INSERTION --------------------
    
    // Map CSV headers to database fields
    const fieldMappings = {
      'Date': 'date',
      'Description': 'description',
      'Category': 'category', 
      'Amount': 'amount',
      'Amount (Incl VAT)': 'amount',  // Special mapping for BakeDiary format
      'Vendor': 'supplier',
      'Supplier': 'supplier',
      'Payment': 'payment_source',
      'Payment Source': 'payment_source',
      'VAT': 'vat',
      'Total Inc Tax': 'total_inc_tax',
      'Is Recurring': 'is_recurring',
      'Tax Deductible': 'tax_deductible'
    };
    
    // Insert expenses into database
    const results = [];
    
    for (const row of rows) {
      // Create expense object with user ID
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
      
      // Special case for Amount (Incl VAT) -> amount field
      if (row['Amount (Incl VAT)'] !== undefined) {
        let amountValue = row['Amount (Incl VAT)'].replace(/[$£€]/g, '').trim();
        const numValue = parseFloat(amountValue) || 0;
        expense.amount = numValue.toString();
      }

      // Map data from CSV row to database fields
      for (const [csvHeader, dbField] of Object.entries(fieldMappings)) {
        // Check if this CSV header exists in the current row
        if (row[csvHeader] !== undefined) {
          let value = row[csvHeader];
          
          // Skip amount field if we've already processed Amount (Incl VAT)
          if (dbField === 'amount' && row['Amount (Incl VAT)'] !== undefined) {
            continue;
          }
          
          // Special handling for amount fields
          if (dbField === 'amount' || dbField === 'vat' || dbField === 'total_inc_tax') {
            // Remove currency symbols and extract values in parentheses if needed
            value = value.replace(/[$£€]/g, '').trim();
            if (value.includes('(')) {
              const match = value.match(/\(([^)]+)\)/);
              if (match) {
                value = match[1].replace(/[$£€]/g, '').trim();
              }
            }
            // Convert to number then back to string to ensure valid format
            const numValue = parseFloat(value) || 0;
            value = numValue.toString();
          }
          
          // Special handling for boolean fields
          else if (dbField === 'is_recurring' || dbField === 'tax_deductible') {
            value = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
          }
          
          // Update expense object
          expense[dbField] = value;
        }
      }
      
      // Log the processed expense record for debugging
      console.log("Processed row data:", expense);
      
      try {
        // Insert expense using direct SQL query
        console.log("Original date value:", row['Date']);
        
        // Parse and format the date properly
        let dateValue = expense.date;
        if (row['Date']) {
          try {
            // Try to parse the date in format "DD MMM YYYY"
            const dateParts = row['Date'].match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
            if (dateParts) {
              const day = dateParts[1].padStart(2, '0');
              const month = dateParts[2];
              const year = dateParts[3];
              
              // Convert month name to month number
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.toLowerCase());
              
              if (monthIndex !== -1) {
                const monthNum = (monthIndex + 1).toString().padStart(2, '0');
                dateValue = `${year}-${monthNum}-${day}`;
                console.log("Parsed date as:", dateValue);
              }
            }
          } catch (err) {
            console.error("Error parsing date:", err);
          }
        }
        
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
          dateValue,
          expense.description,
          expense.category,
          expense.amount,
          expense.supplier,
          expense.payment_source,
          expense.vat || '0',
          expense.total_inc_tax || '0',
          expense.tax_deductible || false,
          expense.is_recurring || false
        ];
        
        console.log("Inserting expense:", expense);
        
        const result = await db.query(query, values);
        results.push(result.rows[0]);
        
      } catch (err) {
        console.error(`Error inserting expense: ${err.message}`);
      }
    }
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
      console.log("Temporary file deleted");
    } catch (err) {
      console.error("Error deleting temporary file:", err.message);
    }
    
    console.log(`Import completed: ${results.length} expenses imported`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${results.length} expenses`,
      expenses: results
    });
    
  } catch (error) {
    console.error("Import error:", error.message);
    console.error("Stack trace:", error.stack);
    
    return res.status(500).json({
      success: false,
      message: `Error importing expenses: ${error.message}`,
      error: String(error)
    });
  }
});

export default router;