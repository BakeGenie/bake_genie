import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// Direct import endpoint specifically for Bake Diary format
router.post('/api/expenses/bake-diary/import', async (req, res) => {
  // Get a client from the pool
  const client = await pool.connect();
  
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid expense items provided'
      });
    }
    
    // Use a transaction for atomicity
    await client.query('BEGIN');
    
    const successes = [];
    const errors = [];
    
    // Process each item individually for better error handling
    for (const item of items) {
      try {
        // Format the item for insertion with exact column names from database
        const query = `
          INSERT INTO expenses (
            user_id, date, category, description, amount, 
            tax_deductible, receipt_url, created_at,
            supplier, payment_source, vat, total_inc_tax, is_recurring
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id;
        `;
        
        const values = [
          req.user?.id || 1, // user_id
          item.date || new Date().toISOString().split('T')[0], // date
          item.category || 'Other', // category
          item.description || '', // description
          item.amount || '0', // amount
          true, // tax_deductible (default true)
          null, // receipt_url
          new Date().toISOString(), // created_at
          item.supplier || null, // supplier
          item.paymentSource || null, // payment_source
          item.vat || null, // vat
          item.totalIncTax || item.amount || '0', // total_inc_tax
          false // is_recurring (default false)
        ];
        
        // Log what we're trying to insert
        console.log('Inserting Bake Diary expense:', {
          query,
          values
        });
        
        const result = await client.query(query, values);
        successes.push({
          ...item,
          id: result.rows[0]?.id,
          success: true
        });
      } catch (err: any) {
        console.error('Error inserting expense:', err);
        errors.push({
          item,
          error: err.message,
          stack: err.stack
        });
      }
    }
    
    // Commit the transaction if we got this far
    await client.query('COMMIT');
    
    return res.status(200).json({
      success: true,
      inserted: successes.length,
      errors: errors.length,
      errorDetails: errors,
      successDetails: successes
    });
  } catch (err: any) {
    // If an error occurred, roll back the transaction
    await client.query('ROLLBACK');
    
    console.error('Bake Diary import error:', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'An unexpected error occurred' 
    });
  } finally {
    // Release the client back to the pool
    client.release();
  }
});

export default router;