import { Router } from 'express';
import multer from 'multer';
import { db } from '../db';
import { expenses } from '../../shared/schema';
import { isAuthenticated } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import path from 'path';
import fs from 'fs';

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

// Route to handle expense csv import
router.post('/api/expenses-import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log("Expense import API called");
    
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log("File uploaded:", req.file.originalname);
    
    const userId = req.session.user?.id;
    if (!userId) {
      console.error("User not authenticated");
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    console.log("User ID:", userId);

    const filePath = req.file.path;
    console.log("Reading file:", filePath);
    
    // Make sure the uploads directory exists
    if (!fs.existsSync('uploads/')) {
      fs.mkdirSync('uploads/', { recursive: true });
      console.log("Created uploads directory");
    }
    
    // Check if file exists and is readable
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      console.log("File exists and is readable");
    } catch (error) {
      console.error("File access error:", error);
      return res.status(500).json({ 
        success: false, 
        message: 'Could not access uploaded file', 
        error: String(error) 
      });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log("File content length:", fileContent.length);
    console.log("First 200 chars of file:", fileContent.substring(0, 200));
    
    // Handle both standard CSV and the BakeDiary format
    let parsedData;
    let headers = [];
    
    // Using a very simple approach that should work with any CSV format
    try {
      console.log("Starting CSV import process");
      console.log("File path:", filePath);
      
      // Get basic info about the file
      const lines = fileContent.split('\n').filter(line => line.trim());
      console.log(`Found ${lines.length} non-empty lines in the file`);
      
      if (lines.length < 2) {
        throw new Error("CSV file does not have enough lines (need at least headers and one data row)");
      }
      
      // Detect format: Basic check if this looks like BakeDiary format by examining first few lines
      const firstLine = lines[0];
      console.log("First line:", firstLine);
      
      // Determine if this is a standard CSV or BakeDiary format
      let headerLineIndex = 0; // Default to first line for headers
      
      // Check for BakeDiary format by looking for common header columns
      // Assume first line contains columns like Date, Vendor, Category, etc.
      const possibleHeaders = firstLine.split(',').map(h => h.trim());
      const hasCommonHeaderNames = possibleHeaders.some(h => 
        ['Date', 'Vendor', 'Category', 'Amount', 'Payment', 'Description'].includes(h)
      );
      
      console.log("Possible headers:", possibleHeaders);
      console.log("Has common header names:", hasCommonHeaderNames);
      
      if (hasCommonHeaderNames) {
        console.log("Detected standard CSV format with headers in first line");
        headers = possibleHeaders;
      } else {
        // Try to find headers based on content patterns
        console.log("Did not detect standard headers, checking other lines");
        
        // Check each line for common header patterns
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          const lineParts = lines[i].split(',').map(h => h.trim());
          const mightBeHeaders = lineParts.some(h => 
            ['Date', 'Vendor', 'Category', 'Amount', 'Payment', 'Description'].includes(h)
          );
          
          if (mightBeHeaders) {
            console.log(`Found potential headers on line ${i+1}:`, lineParts);
            headers = lineParts;
            headerLineIndex = i;
            break;
          }
        }
        
        if (headers.length === 0) {
          console.log("Could not detect headers, using first line as default");
          headers = possibleHeaders;
        }
      }
      
      console.log("Using headers:", headers);
      
      // Parse data starting from the line after headers
      parsedData = [];
      for (let i = headerLineIndex + 1; i < lines.length; i++) {
        const dataLine = lines[i];
        const values = dataLine.split(',');
        
        // Handle case where the row has more or fewer columns than headers
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index]?.trim() || '';
        });
        
        parsedData.push(rowData);
        
        // Log first row for debugging
        if (i === headerLineIndex + 1) {
          console.log("First data row:", rowData);
        }
      }
      
      console.log(`Successfully parsed ${parsedData.length} data rows`);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      throw new Error(`Failed to parse CSV: ${error.message}`);
    }

    // Process and map headers to database fields - handle both standard and BakeDiary formats
    const mappings = {
      // Standard format
      'Date': 'date',
      'Description': 'description',
      'Category': 'category',
      'Amount': 'amount',
      'Supplier': 'supplier',
      'Payment Source': 'payment_source',
      'Payment': 'payment_source',
      'VAT': 'vat',
      'Total Inc Tax': 'total_inc_tax',
      'Is Recurring': 'is_recurring',
      'Tax Deductible': 'tax_deductible',
      
      // BakeDiary format mappings
      'Vendor': 'supplier',
      'Amount (Incl VAT)': 'amount'
    };

    // Insert expenses into database
    const results = [];
    
    for (const row of parsedData) {
      const expenseData: any = {
        user_id: Number(userId)
      };
      
      // Map each column based on the mappings
      for (const [csvHeader, dbField] of Object.entries(mappings)) {
        if (row[csvHeader] !== undefined) {
          let value = row[csvHeader];
          
          // For amount field, remove currency symbols and parse as number
          if (dbField === 'amount' && value) {
            value = value.replace(/[$£€]/g, '').trim();
            if (value.includes('(')) {
              // Extract value in parentheses if present
              const match = value.match(/\(([^)]+)\)/);
              if (match) {
                value = match[1].replace(/[$£€]/g, '').trim();
              }
            }
          }
          
          // For boolean fields, convert to true/false
          if (dbField === 'is_recurring' || dbField === 'tax_deductible') {
            if (typeof value === 'string') {
              value = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
            } else {
              value = Boolean(value);
            }
          }
          
          expenseData[dbField.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()] = value;
        } else {
          // Set default values for missing fields
          if (dbField === 'is_recurring' || dbField === 'tax_deductible') {
            expenseData[dbField] = false;
          } else if (dbField === 'amount' || dbField === 'vat' || dbField === 'total_inc_tax') {
            expenseData[dbField] = '0';
          } else if (dbField === 'supplier' || dbField === 'payment_source') {
            expenseData[dbField] = '';
          }
        }
      }
      
      // Ensure we have a date
      if (!expenseData.date) {
        expenseData.date = new Date().toISOString().split('T')[0];
      }
      
      // Insert expense into database
      try {
        // Use direct SQL query to bypass Drizzle ORM issues with field naming
        const query = `
          INSERT INTO expenses (
            user_id, date, description, category, amount, supplier, 
            payment_source, vat, total_inc_tax, tax_deductible, is_recurring
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          ) RETURNING *
        `;
        
        const values = [
          expenseData.user_id,
          expenseData.date,
          expenseData.description || '',
          expenseData.category || '',
          expenseData.amount || '0',
          expenseData.supplier || '',
          expenseData.payment_source || '',
          expenseData.vat || '0',
          expenseData.total_inc_tax || '0',
          expenseData.tax_deductible || false,
          expenseData.is_recurring || false
        ];
        
        const result = await db.query(query, values);
        results.push(result.rows[0]);
      } catch (err) {
        console.error('Error inserting expense:', err);
        console.error('Failed data:', expenseData);
      }
    }
    
    // Clean up temporary upload file
    fs.unlinkSync(filePath);
    
    return res.status(200).json({ 
      success: true, 
      message: `Successfully imported ${results.length} expenses`, 
      expenses: results 
    });
    
  } catch (error) {
    console.error('Error importing expenses:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error importing expenses', 
      error: String(error) 
    });
  }
});

export default router;