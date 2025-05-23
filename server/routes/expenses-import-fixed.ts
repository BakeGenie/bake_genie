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

// Function to handle Bake Diary date format
function formatBakeDiaryDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Remove quotes if present
  dateStr = dateStr.replace(/^"|"$/g, '').trim();
  
  // Already in correct format?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Handle format "DD MMM YYYY" (like "11 Jan 2025")
  const dateParts = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
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
      return `${year}-${monthMap[month]}-${day}`;
    }
  }
  
  // Try direct Date object parsing as a fallback
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  console.log(`Could not parse date: ${dateStr}, using current date`);
  return new Date().toISOString().split('T')[0];
}

// FIXED IMPORT ROUTE WITH SPECIFIC FIELD MAPPINGS FOR BAKE DIARY
router.post('/api/expenses-import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log("=== BAKE DIARY EXPENSE IMPORT STARTED (FIXED MAPPING) ===");
    
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
    
    // SPECIFIC FIELD MAPPING based on user requirements:
    // CSV column: "Date" → Database field: "date"
    // CSV column: "Description" → Database field: "description"
    // CSV column: "Category" → Database field: "category"
    // CSV column: "Vendor" → Database field: "supplier"
    // CSV column: "Payment" → Database field: "payment_source"
    // CSV column: "VAT" → Database field: "vat"
    // CSV column: "Amount (Incl VAT)" → Database field: "amount"
    const columnMap = {
      date: headers.indexOf('Date'),
      description: headers.indexOf('Description'),
      supplier: headers.indexOf('Vendor'),
      category: headers.indexOf('Category'),
      payment_source: headers.indexOf('Payment'),
      vat: headers.indexOf('VAT'),
      amount: headers.indexOf('Amount (Incl VAT)')
    };
    
    // Validate required columns
    const missingColumns = [];
    for (const [field, index] of Object.entries(columnMap)) {
      if (index === -1) {
        missingColumns.push(field);
      }
    }
    
    if (missingColumns.length > 0) {
      throw new Error(`CSV is missing required columns: ${missingColumns.join(', ')}`);
    }
    
    // Process data rows
    const results = [];
    
    // Use a simple direct raw SQL query approach
    for (let i = 1; i < lines.length; i++) {
      try {
        const rowValues = parseCSVLine(lines[i]);
        
        // Skip rows that don't have enough values
        if (rowValues.length < 3) continue;
        
        // Extract values for each column using our column map
        const dateStr = rowValues[columnMap.date].replace(/^"|"$/g, '');
        const formattedDate = formatBakeDiaryDate(dateStr);
        
        const description = rowValues[columnMap.description].replace(/^"|"$/g, '');
        const supplier = columnMap.supplier !== -1 ? rowValues[columnMap.supplier].replace(/^"|"$/g, '') : '';
        const category = columnMap.category !== -1 ? rowValues[columnMap.category].replace(/^"|"$/g, '') : '';
        const paymentSource = columnMap.payment_source !== -1 ? rowValues[columnMap.payment_source].replace(/^"|"$/g, '') : '';
        const vat = columnMap.vat !== -1 ? rowValues[columnMap.vat].replace(/^"|"$/g, '').replace(/[^0-9.]/g, '') : '0';
        const amount = columnMap.amount !== -1 ? rowValues[columnMap.amount].replace(/^"|"$/g, '').replace(/[^0-9.]/g, '') : '0';
        
        console.log(`Processing expense: ${description} on ${formattedDate}, Amount: ${amount}`);
        
        // Execute a direct SQL query without using our ORM
        const query = `
          INSERT INTO expenses (
            user_id, date, description, category, supplier, amount, 
            payment_source, vat, total_inc_tax
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *
        `;
        
        const values = [
          userId,
          formattedDate, 
          description, 
          category, 
          supplier, 
          amount,
          paymentSource,
          vat,
          amount  // total_inc_tax = amount
        ];
        
        const result = await db.query(query, values);
        console.log(`Inserted expense ID: ${result.rows[0].id}`);
        
        results.push(result.rows[0]);
      } catch (err) {
        console.error(`Error processing row ${i}:`, err);
      }
    }
    
    // Clean up the temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error deleting temporary file:", err);
    }
    
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