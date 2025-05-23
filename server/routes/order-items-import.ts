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
    
    // Create a lookup table for contacts to avoid duplicate queries
    let defaultContactId = null;
    try {
      // Try to get a default contact ID first
      const contactResult = await db.execute('SELECT id FROM contacts LIMIT 1');
      if (contactResult?.[0]?.rows?.length > 0) {
        defaultContactId = contactResult[0].rows[0].id;
        console.log(`Using default contact ID: ${defaultContactId}`);
      } else {
        // If no contacts exist, create a placeholder contact
        try {
          const createContactResult = await db.execute(`
            INSERT INTO contacts (
              user_id, first_name, last_name, email, created_at, type
            ) VALUES (
              ${userId}, 'Default', 'Contact', 'placeholder@example.com', NOW(), 'customer'
            ) RETURNING id
          `);
          
          if (createContactResult?.[0]?.rows?.length > 0) {
            defaultContactId = createContactResult[0].rows[0].id;
            console.log(`Created placeholder contact with ID: ${defaultContactId}`);
          }
        } catch (contactErr) {
          console.error("Failed to create default contact:", contactErr);
          defaultContactId = 1; // Last resort fallback
        }
      }
    } catch (contactErr) {
      console.error('Error getting/creating default contact:', contactErr);
      defaultContactId = 1; // Fallback
    }
    
    // Use a transaction for all inserts
    try {
      // Start transaction
      await db.execute('BEGIN');
      
      const userId = req.session?.userId || 1; // Default to 1 for development
      
      console.log("Processing items with format:", items[0]);
      
      // Create a lookup for order IDs to avoid repeated queries
      const orderCache = {};
      
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
            return number.toFixed(2).toString();
          };
          
          // For NUMERIC(2,0) fields (must be integers less than 100)
          const cleanNumericField = (val) => {
            if (val === null || val === undefined) return 0;
            const str = val.toString().replace(/[^0-9.-]/g, '');
            return Math.min(99, Math.floor(parseFloat(str) || 0)); // Cap at 99 and ensure it's an integer
          };
          
          // For order numbers - make sure they're valid
          // For order numbers - make sure they're valid, clean any special characters  
          const safeOrderId = orderId ? String(orderId).trim().replace(/[^\w\d-]/g, '') : null;
          
          // If we don't have an order ID, create a placeholder with a timestamp-based ID
          if (!safeOrderId) {
            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 10000);
            const placeholderId = `AUTO-${timestamp}-${randomSuffix}`;
            console.log(`No order ID provided, creating placeholder: ${placeholderId}`);
            item.order_id = placeholderId;
          }
          
          // Check if we've already processed this order number in this session
          let orderDbId = orderCache[safeOrderId];
          
          // If not in cache, look it up in the database
          if (!orderDbId) {
            // First try with order_number field
            let findOrderQuery = `SELECT id FROM orders WHERE order_number = '${safeOrderId}'`;
            let orderResult = await db.execute(findOrderQuery);
            
            // If still not found, try with the id field (if numeric)
            if (!orderResult?.[0]?.rows?.length && !isNaN(Number(safeOrderId))) {
              findOrderQuery = `SELECT id FROM orders WHERE id = ${Number(safeOrderId)}`;
              orderResult = await db.execute(findOrderQuery);
            }
            
            if (orderResult?.[0]?.rows?.length > 0) {
              orderDbId = orderResult[0].rows[0].id;
              orderCache[safeOrderId] = orderDbId; // Cache it
              console.log(`Found order ID ${orderDbId} for order number ${safeOrderId}`);
            } else {
              // Create a placeholder order if not found
              try {
                console.log(`Order ${safeOrderId} not found, creating placeholder`);
                
                // Default the order date to the item created_at date if possible
                let orderDate;
                try {
                  // Try to parse the createdAt date
                  orderDate = new Date(createdAt).toISOString();
                } catch (dateErr) {
                  orderDate = new Date().toISOString();
                }
                
                // Check the orders table schema first to ensure we're using the right columns
                try {
                  const orderTableInfo = await db.execute(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders'
                  `);
                  
                  // Create a set of available columns for faster lookup
                  const orderColumns = new Set();
                  if (orderTableInfo?.[0]?.rows) {
                    orderTableInfo[0].rows.forEach(row => {
                      orderColumns.add(row.column_name);
                    });
                  }
                  
                  console.log("Available order columns:", Array.from(orderColumns));
                  
                  // Build a safe order creation query with only available columns
                  const columnNames = [];
                  const columnValues = [];
                  
                  if (orderColumns.has('user_id')) {
                    columnNames.push('user_id');
                    columnValues.push(userId);
                  }
                  
                  if (orderColumns.has('contact_id')) {
                    columnNames.push('contact_id');
                    columnValues.push(defaultContactId || 'NULL');
                  }
                  
                  if (orderColumns.has('order_number')) {
                    columnNames.push('order_number');
                    columnValues.push(`'${safeOrderId.replace(/'/g, "''")}'`);
                  }
                  
                  if (orderColumns.has('status')) {
                    columnNames.push('status');
                    columnValues.push(`'pending'`);
                  }
                  
                  if (orderColumns.has('event_date')) {
                    columnNames.push('event_date');
                    columnValues.push(`'${orderDate}'`);
                  }
                  
                  if (orderColumns.has('total_amount')) {
                    columnNames.push('total_amount');
                    columnValues.push(`'0.00'`);
                  }
                  
                  if (orderColumns.has('sub_total_amount')) {
                    columnNames.push('sub_total_amount');
                    columnValues.push(`'0.00'`);
                  }
                  
                  if (orderColumns.has('delivery_amount')) {
                    columnNames.push('delivery_amount');
                    columnValues.push(`'0.00'`);
                  }
                  
                  if (orderColumns.has('discount_amount')) {
                    columnNames.push('discount_amount');
                    columnValues.push(`'0.00'`);
                  }
                  
                  if (orderColumns.has('special_instructions')) {
                    columnNames.push('special_instructions');
                    columnValues.push(`'Auto-created from order items import'`);
                  }
                  
                  if (orderColumns.has('event_type')) {
                    columnNames.push('event_type');
                    columnValues.push(`'Other'`);
                  }
                  
                  if (orderColumns.has('created_at')) {
                    columnNames.push('created_at');
                    columnValues.push(`'${orderDate}'`);
                  }
                  
                  if (orderColumns.has('title')) {
                    columnNames.push('title');
                    columnValues.push(`'Order Item Import - ${safeOrderId.replace(/'/g, "''")}'`);
                  }
                  
                  const createOrderQuery = `
                    INSERT INTO orders (
                      ${columnNames.join(', ')}
                    ) VALUES (
                      ${columnValues.join(', ')}
                    )
                    RETURNING id
                  `;
                
                console.log("Order creation SQL:", createOrderQuery);
                const createResult = await db.execute(createOrderQuery);
                if (createResult?.[0]?.rows?.[0]?.id) {
                  orderDbId = createResult[0].rows[0].id;
                  orderCache[safeOrderId] = orderDbId; // Cache it
                  console.log(`Created placeholder order ${orderDbId} for number ${safeOrderId}`);
                } else {
                  throw new Error(`Failed to create placeholder order for ${safeOrderId}`);
                }
              } catch (createErr) {
                console.error(`Failed to create order for ${safeOrderId}:`, createErr);
                errors.push({
                  item,
                  error: `Could not create placeholder order: ${createErr.message}`
                });
                errorCount++;
                continue;
              }
            }
          }
          
          // Process date
          let processedCreatedAt;
          try {
            if (typeof createdAt === 'string') {
              if (createdAt.includes('/')) {
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
              } 
              // Handle format like "19 May 2025"
              else if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(createdAt)) {
                processedCreatedAt = new Date(createdAt).toISOString();
              }
              // Default format
              else {
                processedCreatedAt = new Date(createdAt).toISOString();
              }
            } else {
              processedCreatedAt = new Date().toISOString();
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
              order_id, description, quantity, price, 
              created_at, serving, labour, hours, 
              overhead, cost_price, sell_price, contact_item, recipes, number
            ) VALUES (
              ${orderDbId},
              '${description.replace(/'/g, "''")}',
              1,
              '${cleanedSellPrice}',
              '${processedCreatedAt}',
              '${cleanedServing}',
              ${cleanedLabour || 0},
              ${cleanedHours || 0},
              ${cleanedOverhead || 0},
              '${cleanedCostPrice}',
              '${cleanedSellPrice}',
              ${contactItem ? `'${contactItem.replace(/'/g, "''")}'` : 'NULL'},
              ${recipes ? `'${recipes.replace(/'/g, "''")}'` : 'NULL'},
              '${safeOrderId}'
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