import { Router } from 'express';
import { db } from '../db';
import { expenses } from '@shared/schema';
import { pool } from '../db';
import { format } from 'date-fns';

const router = Router();

// Endpoint for batch inserting expenses from CSV
router.post('/api/expenses/batch', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid expense items provided'
      });
    }

    // We'll collect any errors that occur during processing
    const errors: any[] = [];
    const successes: any[] = [];
    
    // Create a connection for raw SQL execution
    const client = await pool.connect();
    
    try {
      // Process each expense item
      for (const item of items) {
        try {
          // Handle date format for VARCHAR field in database
          let formattedDate = item.date;
          
          // If the date is in DD/MM/YYYY format (common in Bake Diary exports)
          if (formattedDate && typeof formattedDate === 'string' && formattedDate.includes('/')) {
            const parts = formattedDate.split('/');
            if (parts.length === 3) {
              // Convert DD/MM/YYYY to YYYY-MM-DD for database storage
              const [day, month, year] = parts;
              formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } else if (formattedDate && typeof formattedDate === 'string' && formattedDate.includes(' ')) {
            // Handle date formats like "11 Jan 2025"
            try {
              const parsedDate = new Date(formattedDate);
              if (!isNaN(parsedDate.getTime())) {
                formattedDate = format(parsedDate, 'yyyy-MM-dd');
              }
            } catch (e) {
              // Keep original if parsing fails
              console.log(`Date parsing failed for: ${formattedDate}`);
            }
          }
          
          // Format expense item for database insertion
          const expenseItem = {
            user_id: req.user?.id || 1, // Default to user 1 if no user ID available
            category: item.category || 'Other',
            description: item.description || null,
            amount: item.amount?.toString() || '0',
            date: formattedDate || new Date().toISOString().split('T')[0],
            tax_deductible: item.taxDeductible || false,
            receipt_url: item.receiptUrl || null,
            created_at: new Date().toISOString(),
            // Additional fields from Bake Diary
            supplier: item.supplier || null,
            payment_source: item.paymentSource || null,
            vat: item.vat || null,
            total_inc_tax: item.totalIncTax || null,
            is_recurring: item.isRecurring || false
          };
          
          // Use direct SQL query to match the database schema exactly
          const query = `
            INSERT INTO expenses (
              user_id, category, description, amount, date, 
              tax_deductible, receipt_url, created_at,
              supplier, payment_source, vat, total_inc_tax, is_recurring
            ) 
            VALUES (
              $1, $2, $3, $4, $5, 
              $6, $7, $8, 
              $9, $10, $11, $12, $13
            )
            RETURNING id;
          `;
          
          const values = [
            expenseItem.user_id,
            expenseItem.category,
            expenseItem.description,
            expenseItem.amount,
            expenseItem.date,
            expenseItem.tax_deductible,
            expenseItem.receipt_url,
            expenseItem.created_at,
            expenseItem.supplier,
            expenseItem.payment_source,
            expenseItem.vat,
            expenseItem.total_inc_tax,
            expenseItem.is_recurring
          ];
          
          const result = await client.query(query, values);
          const newId = result.rows[0]?.id;
          
          successes.push({
            ...item,
            id: newId,
            success: true
          });
        } catch (err: any) {
          // Collect error information
          errors.push({
            item,
            error: err.message,
            details: err.stack
          });
          
          console.error('Error processing expense item:', err);
          console.error('Problematic item:', item);
        }
      }
      
      // Return success response with results
      return res.status(200).json({
        success: true,
        inserted: successes.length,
        errors: errors.length,
        errorDetails: errors,
        successDetails: successes
      });
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err: any) {
    console.error('Error in batch expense import:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'An unexpected error occurred' 
    });
  }
});

export default router;