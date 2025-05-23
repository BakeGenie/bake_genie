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
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV content - for BakeDiary files, headers are at row 3, data starts at row 4
    const parsedData = parse(fileContent, {
      skip_empty_lines: true,
      from_line: 4, // Start reading from line 4 (1-based)
      columns: (header) => {
        return header.map((column: string) => column.trim());
      }
    });

    const headerLine = fileContent.split('\n')[2]; // Get the header line (row 3)
    const headers = parse(headerLine, { 
      skip_empty_lines: true,
      columns: false 
    })[0].map((header: string) => header.trim());

    // Process and map headers to database fields
    const mappings = {
      'Date': 'date',
      'Description': 'description',
      'Category': 'category',
      'Amount': 'amount',
      'Supplier': 'supplier',
      'Payment Source': 'payment_source',
      'VAT': 'vat',
      'Total Inc Tax': 'total_inc_tax',
      'Is Recurring': 'is_recurring',
      'Tax Deductible': 'tax_deductible'
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