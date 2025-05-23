import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Direct import endpoint specifically for orders CSV format
router.post('/api/orders/import', async (req, res) => {
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
        error: 'No valid order items provided'
      });
    }
    
    console.log(`ORDERS IMPORT: Received ${items.length} orders for import`);
    
    // Import each order directly using SQL to avoid ORM issues
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
          const orderNumber = item.order_number || item.orderNumber || '';
          const eventType = item.event_type || item.eventType || '';
          const theme = item.theme || null;
          const status = item.status || 'Quote';
          const deliveryTime = item.delivery_time || item.deliveryTime || '';
          
          // For numeric fields, convert to floats reliably
          const cleanNumber = (val) => {
            if (val === null || val === undefined) return 0;
            const str = val.toString().replace(/[^0-9.-]/g, '');
            return parseFloat(str) || 0;
          };
          
          const totalAmount = cleanNumber(item.total_amount || item.totalAmount);
          const deliveryFee = cleanNumber(item.delivery_fee || item.deliveryFee);
          const profit = cleanNumber(item.profit);
          const subTotalAmount = cleanNumber(item.sub_total_amount || item.subTotalAmount);
          const discountAmount = cleanNumber(item.discount_amount || item.discountAmount);
          const taxRate = cleanNumber(item.tax_rate || item.taxRate);
          const deliveryAmount = cleanNumber(item.delivery_amount || item.deliveryAmount);
          
          // Handle dates - important to format correctly for the database
          let eventDate = null;
          const dateValue = item.event_date || item.eventDate;
          if (dateValue) {
            try {
              // Try to parse the date with extra quote removal for JSON escaped values
              const cleanDate = dateValue.toString()
                .replace(/^"\\+"|\\"|\\/g, '')
                .replace(/"/g, '')
                .trim();
              console.log(`Processing event date: ${cleanDate}`);
              
              // Try different date parsing methods
              let parsedDate;
              // Try ISO format
              if (cleanDate.match(/\d{4}-\d{2}-\d{2}/)) {
                parsedDate = new Date(cleanDate);
              } 
              // Try MM/DD/YYYY format
              else if (cleanDate.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const parts = cleanDate.split('/');
                parsedDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
              } 
              // Try DD/MM/YYYY format
              else if (cleanDate.match(/\d{1,2}\/\d{1,2}\/\d{4}/)) {
                const parts = cleanDate.split('/');
                parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              }
              // Try YYYY format alone
              else if (cleanDate.match(/\d{4}/)) {
                parsedDate = new Date(parseInt(cleanDate), 0, 1);
              }
              // Finally try any other format
              else {
                parsedDate = new Date(cleanDate);
              }
              
              // Check if date is valid
              if (!isNaN(parsedDate.getTime())) {
                eventDate = parsedDate.toISOString();
              } else {
                console.error(`ORDERS IMPORT: Invalid date format: ${cleanDate}`);
                eventDate = new Date().toISOString();
              }
            } catch (dateError) {
              console.error(`ORDERS IMPORT: Failed to parse event date: ${item.eventDate}`, dateError);
              // Use current date as fallback
              eventDate = new Date().toISOString();
            }
          }
          
          let createdAt = null;
          if (item.createdAt) {
            try {
              // Handle escaped quotes and formatting for the created at date
              const cleanDate = item.createdAt.toString()
                .replace(/^"\\+"|\\"|\\/g, '')
                .replace(/"/g, '')
                .trim();
              console.log(`Processing created at date: ${cleanDate}`);
              
              // Try to parse date with various formats
              let parsedDate;
              
              // Try parsing with standard date constructor
              parsedDate = new Date(cleanDate);
              
              // If that fails, try with other formats
              if (isNaN(parsedDate.getTime())) {
                // Try "YYYY-MM-DD HH:MM" format (common in exports)
                if (cleanDate.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
                  const [datePart, timePart] = cleanDate.split(' ');
                  const [year, month, day] = datePart.split('-').map(Number);
                  const [hour, minute] = timePart.split(':').map(Number);
                  parsedDate = new Date(year, month - 1, day, hour, minute);
                }
              }
              
              // Check if date is valid
              if (!isNaN(parsedDate.getTime())) {
                createdAt = parsedDate.toISOString();
              } else {
                console.error(`ORDERS IMPORT: Invalid created at date format: ${cleanDate}`);
                createdAt = new Date().toISOString();
              }
            } catch (dateError) {
              console.error(`ORDERS IMPORT: Failed to parse created at date: ${item.createdAt}`);
              createdAt = new Date().toISOString();
            }
          } else {
            createdAt = new Date().toISOString();
          }
          
          // For contact ID, we need to handle the relationship
          // For simplicity, we'll use a default contact ID (1) if not specified
          // In a real application, you might want to look up the contact by email/name
          const contactId = parseInt(
            (item.contact_id || item.contactId || '1')
              .toString()
              .replace(/"/g, '')
          ) || 1;
          
          console.log(`Using contact ID: ${contactId} for order ${orderNumber}`);
          
          console.log(`Inserting order: ${orderNumber}, Event Type: ${eventType}, Total Amount: ${totalAmount}`);
          
          // Make sure we have valid values for date field
          if (!eventDate) {
            // If no event date is provided, use a future date as fallback
            eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from now
          }
          
          console.log(`Using event date: ${eventDate} for order ${orderNumber}`);
          
          // CRITICAL FIX: Based on database schema inspection, all fields are actually nullable
          // This resolves the import issue since our SQL was adding required fields that don't match the schema
          const insertQuery = `
            INSERT INTO orders (
              user_id, contact_id, order_number, event_type, event_date, 
              status, delivery_type, delivery_fee, delivery_time, total_amount, 
              amount_paid, theme, profit, sub_total_amount, discount_amount, 
              tax_rate, delivery_amount
            ) VALUES (
              ${userId}, 
              ${contactId},
              '${orderNumber.replace(/'/g, "''")}',
              '${eventType ? eventType.replace(/'/g, "''") : "Other"}',
              ${eventDate ? `'${eventDate}'` : 'NULL'},
              '${status ? status.replace(/'/g, "''") : "Quote"}',
              'Pickup',
              '${deliveryFee || "0.00"}',
              '${deliveryTime ? deliveryTime.replace(/'/g, "''") : ""}',
              '${totalAmount || "0.00"}',
              '${totalAmount || "0.00"}',
              ${theme ? `'${theme.replace(/'/g, "''")}'` : 'NULL'},
              ${profit ? Math.min(99, Math.floor(parseFloat(profit.toString()))) : 'NULL'}, 
              ${subTotalAmount ? Math.min(99, Math.floor(parseFloat(subTotalAmount.toString()))) : 'NULL'}, 
              ${discountAmount ? Math.min(99, Math.floor(parseFloat(discountAmount.toString()))) : 'NULL'}, 
              '${taxRate || "0.00"}',
              ${deliveryAmount ? Math.min(99, Math.floor(parseFloat(deliveryAmount.toString()))) : 'NULL'}
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
          console.error(`ORDERS IMPORT: Failed to insert order:`, err);
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
      message: `Successfully imported ${successCount} orders. ${errorCount > 0 ? `Failed to import ${errorCount} orders.` : ''}`
    };
    
    console.log("Orders import complete with result:", result);
    
    // Respond with a plain text message to avoid JSON parsing issues
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(result));
  } catch (error) {
    console.error('ORDERS IMPORT: Error importing orders:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to import orders: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

export default router;