import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Direct import endpoint specifically for Bake Diary format
router.post('/api/expenses/bake-diary/import', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid expense items provided'
      });
    }
    
    console.log(`BAKE DIARY IMPORT: Received ${items.length} expenses for import`);
    
    // Import each expense item directly using SQL to avoid ORM issues
    let successCount = 0;
    let errorCount = 0;
    const successes = [];
    const errors = [];
    
    // Use a transaction for all inserts
    try {
      // Start transaction
      await db.execute('BEGIN');
      
      const userId = req.session?.userId || 1; // Default to 1 for development
      
      for (const item of items) {
        try {
          // Ensure proper data types and handle escaping
          // Remove all quotes from string values
          const date = (item.date || new Date().toISOString().split('T')[0]).replace(/"/g, '');
          const category = (item.category || 'Other').replace(/"/g, '');
          const description = (item.description || '').replace(/"/g, '');
          
          // For numeric fields, remove quotes and ensure they're plain numbers
          let amount = item.amount || '0';
          amount = amount.replace(/"/g, '');
          
          const supplier = item.supplier ? item.supplier.replace(/"/g, '') : null;
          const paymentSource = item.paymentSource ? item.paymentSource.replace(/"/g, '') : null;
          
          // Clean the VAT and totalIncTax values
          let vat = item.vat || '0';
          vat = vat.replace(/"/g, '');
          
          let totalIncTax = item.totalIncTax || amount;
          totalIncTax = totalIncTax.replace(/"/g, '');
          const createdAt = new Date().toISOString();
          
          console.log(`Inserting expense: ${description}, Date: ${date}, Category: ${category}, Amount: ${amount}`);
          
          // Use a direct SQL insert approach with properly escaped strings
          // This bypasses parameter binding issues
          const insertQuery = `
            INSERT INTO expenses (
              user_id, date, category, description, amount, 
              tax_deductible, receipt_url, created_at,
              supplier, payment_source, vat, total_inc_tax, is_recurring
            ) VALUES (
              ${userId}, 
              '${date.replace(/'/g, "''")}', 
              '${category.replace(/'/g, "''")}', 
              '${description.replace(/'/g, "''")}',
              ${parseFloat(amount) || 0},
              TRUE,
              NULL,
              '${createdAt}',
              ${supplier ? `'${supplier.replace(/'/g, "''")}'` : 'NULL'},
              ${paymentSource ? `'${paymentSource.replace(/'/g, "''")}'` : 'NULL'},
              ${parseFloat(vat) || 0},
              ${parseFloat(totalIncTax) || 0},
              FALSE
            )
            RETURNING id
          `;
          
          const result = await db.execute(insertQuery);
          
          if (result && result[0] && result[0].rows && result[0].rows[0]) {
            const insertedId = result[0].rows[0].id;
            successes.push({
              ...item,
              id: insertedId,
              success: true
            });
            successCount++;
          } else {
            // Insert worked but didn't return ID
            successes.push({
              ...item,
              success: true
            });
            successCount++;
          }
        } catch (err) {
          console.error(`BAKE DIARY IMPORT: Failed to insert expense:`, err);
          errors.push({
            item,
            error: err instanceof Error ? err.message : String(err)
          });
          errorCount++;
        }
      }
      
      // Commit transaction
      await db.execute('COMMIT');
      
    } catch (txnError) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw txnError;
    }
    
    const result = {
      success: true,
      inserted: successCount,
      errors: errorCount,
      errorDetails: errors,
      successDetails: successes,
      message: `Successfully imported ${successCount} expenses. ${errorCount > 0 ? `Failed to import ${errorCount} expenses.` : ''}`
    };
    
    console.log("Bake Diary import complete with result:", result);
    
    // Respond with a plain text message to avoid JSON parsing issues
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(result));
  } catch (error) {
    console.error('BAKE DIARY IMPORT: Error importing expenses:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to import expenses: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

export default router;