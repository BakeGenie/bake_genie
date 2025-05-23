import { Router } from 'express';
import { db } from '../db';
import { orderItems, orders } from '@shared/schema';
import { eq, SQL, sql } from 'drizzle-orm';

const router = Router();

// Parse numeric values
const parseNumber = (value: string): number => {
  if (!value) return 0;
  
  // Remove non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

// Check if an order exists
const findOrder = async (orderId: string) => {
  try {
    // Try finding by ID first (if it's a number)
    if (!isNaN(parseInt(orderId))) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(orderId)));
      
      if (order) {
        return order.id;
      }
    }
    
    // Try finding by order number
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderId));
    
    if (order) {
      return order.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding order:', error);
    return null;
  }
};

// Create a placeholder order if needed
const createPlaceholderOrder = async (orderNumber: string, userId: number) => {
  try {
    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        status: 'Draft',
        description: `Placeholder order created during import for "${orderNumber}"`,
      })
      .returning({ id: orders.id });
    
    return newOrder.id;
  } catch (error) {
    console.error('Error creating placeholder order:', error);
    return null;
  }
};

// Process the CSV data and import it into the database
router.post('/import', async (req, res) => {
  try {
    const { records, columnMapping, userId } = req.body;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records provided for import',
      });
    }
    
    // Results tracking
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as { row: number; message: string }[],
      successDetails: [] as any[],
    };
    
    // Process each record
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      
      try {
        const rowNum = index + 1; // 1-based for error messages
        
        // Get the order ID/number from CSV - this is required
        if (!columnMapping.order_id || !record[columnMapping.order_id]) {
          throw new Error('Order ID/Number is required but not provided or mapped');
        }
        
        const orderIdStr = record[columnMapping.order_id].toString();
        
        // Find the associated order or create a placeholder
        let orderId = await findOrder(orderIdStr);
        
        if (!orderId) {
          // Create a placeholder order if the original doesn't exist
          orderId = await createPlaceholderOrder(orderIdStr, userId);
          
          if (!orderId) {
            throw new Error(`Could not find or create order "${orderIdStr}"`);
          }
        }
        
        // Map and prepare order item data
        const itemData = {
          orderId: orderId,
          description: columnMapping.description ? record[columnMapping.description] : null,
          serving: columnMapping.serving ? parseNumber(record[columnMapping.serving]) : null,
          labour: columnMapping.labour ? parseNumber(record[columnMapping.labour]) : null,
          hours: columnMapping.hours ? parseNumber(record[columnMapping.hours]) : null,
          overhead: columnMapping.overhead ? parseNumber(record[columnMapping.overhead]) : null,
          recipes: columnMapping.recipes ? record[columnMapping.recipes] : null,
          costPrice: columnMapping.cost_price ? parseNumber(record[columnMapping.cost_price]) : 0,
          sellPrice: columnMapping.sell_price ? parseNumber(record[columnMapping.sell_price]) : 0,
          quantity: columnMapping.quantity ? parseNumber(record[columnMapping.quantity]) : 1,
          notes: columnMapping.notes ? record[columnMapping.notes] : null,
        };
        
        // Insert the order item
        const [newOrderItem] = await db
          .insert(orderItems)
          .values(itemData)
          .returning();
        
        results.successCount++;
        results.successDetails.push({
          orderId: orderId,
          description: itemData.description,
          sellPrice: itemData.sellPrice,
          success: true
        });
      } catch (error: any) {
        console.error(`Error importing row ${index + 1}:`, error);
        results.errorCount++;
        results.errors.push({
          row: index + 1,
          message: error.message || 'Unknown error occurred while processing this row',
        });
      }
    }
    
    // Generate response message
    let message = '';
    if (results.successCount > 0) {
      message += `Successfully imported ${results.successCount} order items. `;
    }
    if (results.errorCount > 0) {
      message += `Failed to import ${results.errorCount} order items.`;
    }
    
    // Return the results
    return res.status(200).json({
      success: results.successCount > 0,
      ...results,
      message,
    });
  } catch (error: any) {
    console.error('Error in order items import:', error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message || 'Unknown error occurred'}`,
    });
  }
});

export default router;