import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Direct import endpoint specifically for ingredients CSV format
router.post('/api/ingredients/import', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid ingredient items provided'
      });
    }
    
    console.log(`INGREDIENTS IMPORT: Received ${items.length} ingredients for import`);
    
    // Import each ingredient directly using SQL to avoid ORM issues
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
          const name = (item.name || '').replace(/"/g, '');
          const supplier = item.supplier ? item.supplier.replace(/"/g, '') : null;
          
          // For numeric fields, convert to floats and handle any format issues
          const costPerUnit = parseFloat(item.costPerUnit?.toString().replace(/"/g, '') || '0') || 0;
          const packCost = parseFloat(item.packCost?.toString().replace(/"/g, '') || '0') || 0;
          
          // Additional fields that might be useful
          const category = (item.category || 'General').replace(/"/g, '');
          const unit = (item.unit || '').replace(/"/g, '');
          const createdAt = new Date().toISOString();
          
          console.log(`Inserting ingredient: ${name}, Supplier: ${supplier}, Cost Per Unit: ${costPerUnit}, Pack Cost: ${packCost}`);
          
          // Use direct SQL insert approach with properly escaped strings
          // Adjust column names to match your ingredients table structure
          const insertQuery = `
            INSERT INTO ingredients (
              user_id, name, supplier, cost_per_unit, pack_cost, 
              category, unit, created_at, updated_at
            ) VALUES (
              ${userId}, 
              '${name.replace(/'/g, "''")}', 
              ${supplier ? `'${supplier.replace(/'/g, "''")}'` : 'NULL'},
              ${costPerUnit},
              ${packCost},
              '${category.replace(/'/g, "''")}',
              '${unit.replace(/'/g, "''")}',
              '${createdAt}',
              '${createdAt}'
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
          console.error(`INGREDIENTS IMPORT: Failed to insert ingredient:`, err);
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
      message: `Successfully imported ${successCount} ingredients. ${errorCount > 0 ? `Failed to import ${errorCount} ingredients.` : ''}`
    };
    
    console.log("Ingredients import complete with result:", result);
    
    // Respond with a plain text message to avoid JSON parsing issues
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(result));
  } catch (error) {
    console.error('INGREDIENTS IMPORT: Error importing ingredients:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to import ingredients: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

export default router;