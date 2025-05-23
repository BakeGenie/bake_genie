import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Direct import endpoint specifically for order items CSV format
router.post('/api/order-items/import', async (req, res) => {
  try {
    // Pre-process the request body to handle potential HTML content or malformed JSON
    let parsedBody;
    let items;
    
    try {
      // Check if the body is already parsed as JSON
      if (typeof req.body === 'object') {
        parsedBody = req.body;
      } 
      // If it's a string (possibly containing HTML), clean it and parse it
      else if (typeof req.body === 'string') {
        // Remove any HTML or DOCTYPE declarations
        const cleanedBody = req.body.replace(/<[^>]*>|<!DOCTYPE[^>]*>/g, '');
        parsedBody = JSON.parse(cleanedBody);
      } else {
        throw new Error("Invalid request body format");
      }
      
      items = parsedBody.items;
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return res.status(400).json({
        success: false,
        error: `Failed to parse request data: ${parseError.message}`
      });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid order item data provided'
      });
    }
    
    console.log(`ORDER ITEMS IMPORT: Received ${items.length} order items for import`);
    
    // Import each order item directly using SQL to avoid ORM issues
    let successCount = 0;
    let errorCount = 0;
    const successes = [];
    const errors = [];
    
    // Use a transaction for all inserts
    try {
      // Start transaction
      await db.execute('BEGIN');
      
      const userId = req.session?.userId || 1; // Default to 1 for development
      
      console.log("Processing items with format:", items[0]);
      
      for (const item of items) {
        try {
          // Get item fields using snake_case (from frontend transformation) or camelCase (from original CSV)
          // CSV column → Database field mappings
          const createdAt = item.created_at || item.createdAt || item['Date Created'] || new Date().toISOString();
          const orderId = item.order_id || item.orderId || item['Order Number'] || '';
          const contactItem = item.contact_item || item.contactItem || item['Contact Item'] || null;
          const description = item.description || item.Description || item.Details || '';
          const serving = item.serving || item.Serving || item.Servings || 0;
          const labour = item.labour || item.Labour || 0;
          const hours = item.hours || item.Hours || 0;
          const overhead = item.overhead || item.Overhead || 0;
          const recipes = item.recipes || item.Recipes || null;
          const costPrice = item.cost_price || item.costPrice || item['Cost Price'] || 0;
          const sellPrice = item.sell_price || item.sellPrice || item['Sell Price (excl VAT)'] || 0;
          
          // For TEXT fields (monetary values that need to be stored as string in the database)
          const cleanTextNumber = (val) => {
            if (val === null || val === undefined) return "0.00";
            const str = val.toString().replace(/[^0-9.-]/g, '');
            const number = parseFloat(str) || 0;
            return number.toString();
          };
          
          // For NUMERIC(2,0) fields (must be integers less than 100)
          const cleanNumericField = (val) => {
            if (val === null || val === undefined) return 0;
            const str = val.toString().replace(/[^0-9.-]/g, '');
            return Math.min(99, Math.floor(parseFloat(str) || 0)); // Cap at 99 and ensure it's an integer
          };
          
          // First, make sure we have a valid order_id reference
          if (!orderId) {
            throw new Error("Order ID is required for order items");
          }
          
          // Check if the referenced order exists
          const findOrderQuery = `SELECT id FROM orders WHERE order_number = '${orderId}'`;
          const orderResult = await db.execute(findOrderQuery);
          
          let orderDbId;
          if (orderResult && orderResult[0] && orderResult[0].rows && orderResult[0].rows.length > 0) {
            orderDbId = orderResult[0].rows[0].id;
            console.log(`Found order ID ${orderDbId} for order number ${orderId}`);
          } else {
            console.warn(`Order with number ${orderId} not found, skipping item`);
            errors.push({
              item,
              error: `Order number ${orderId} not found in the database`
            });
            errorCount++;
            continue;
          }
          
          // Process date
          let processedCreatedAt;
          try {
            if (typeof createdAt === 'string' && createdAt.includes('/')) {
              // Handle MM/DD/YYYY or DD/MM/YYYY format
              const parts = createdAt.split('/');
              if (parts.length === 3) {
                // Assume MM/DD/YYYY format
                processedCreatedAt = new Date(
                  parseInt(parts[2]),
                  parseInt(parts[0]) - 1,
                  parseInt(parts[1])
                ).toISOString();
              }
            } else {
              processedCreatedAt = new Date(createdAt).toISOString();
            }
          } catch (dateError) {
            console.error(`Failed to parse created at date: ${createdAt}`, dateError);
            processedCreatedAt = new Date().toISOString();
          }
          
          // Process numeric values
          const cleanedCostPrice = cleanTextNumber(costPrice);
          const cleanedSellPrice = cleanTextNumber(sellPrice);
          const cleanedServing = cleanNumericField(serving);
          const cleanedLabour = cleanNumericField(labour);
          const cleanedHours = cleanNumericField(hours);
          const cleanedOverhead = cleanNumericField(overhead);
          
          console.log(`Inserting order item for order ${orderId} (DB ID: ${orderDbId}): ${description}`);
          
          const insertQuery = `
            INSERT INTO order_items (
              order_id, description, quantity, price, notes, 
              created_at, updated_at, serving, labour, hours, 
              overhead, cost_price, sell_price, contact_item, recipes
            ) VALUES (
              ${orderDbId},
              '${description.replace(/'/g, "''")}',
              1,
              '${cleanedSellPrice}',
              NULL,
              '${processedCreatedAt}',
              '${new Date().toISOString()}',
              ${cleanedServing},
              ${cleanedLabour},
              ${cleanedHours},
              ${cleanedOverhead},
              '${cleanedCostPrice}',
              '${cleanedSellPrice}',
              ${contactItem ? `'${contactItem.replace(/'/g, "''")}'` : 'NULL'},
              ${recipes ? `'${recipes.replace(/'/g, "''")}'` : 'NULL'}
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
          console.error(`ORDER ITEMS IMPORT: Failed to insert order item:`, err);
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
      message: `Successfully imported ${successCount} order items. ${errorCount > 0 ? `Failed to import ${errorCount} order items.` : ''}`
    };
    
    console.log("Order items import complete with result:", result);
    
    // Respond with a plain text message to avoid JSON parsing issues
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(result));
  } catch (error) {
    console.error('ORDER ITEMS IMPORT: Error importing order items:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to import order items: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

export default router;