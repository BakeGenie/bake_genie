import { Router } from "express";
import { pool } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * Get all orders for the current user
 */
router.get("/api/orders", async (req, res) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Use direct SQL query to avoid schema issues
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

/**
 * Get a specific order by ID
 */
router.get("/api/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Get the order
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    
    // Get order items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    
    res.json({ 
      ...orderResult.rows[0], 
      items: itemsResult.rows 
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});

/**
 * Create a new order
 */
router.post("/api/orders", async (req, res) => {
  try {
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get user ID from session
      const userId = req.session?.userId || 1;
      
      // Log entire request body for debugging
      console.log("Creating order with complete data:", JSON.stringify(req.body, null, 2));
      
      // Extract data from the request, mapping to our database column names
      const {
        contactId,
        eventDate,
        eventType,
        status,
        deliveryType,
        deliveryAddress = '',
        deliveryTime = '',
        notes = '',
        orderNumber,
        total, // We're getting this from client as 'total'
        deliveryFee = '0',
        amountPaid = '0',
        specialInstructions = '',
        taxRate = '0',
        items = []
      } = req.body;
      
      // Validate required fields
      if (!contactId) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required field: contactId" 
        });
      }
      
      // Generate order number if not provided
      const orderNum = orderNumber || `ORD-${Date.now().toString().substring(6)}`;
      
      // Convert total to string if needed
      const totalAmount = typeof total === 'number' ? total.toString() : (total || '0');
      
      // Parse event date from ISO string to Date object (if needed)
      const parsedEventDate = eventDate ? new Date(eventDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      console.log("Using orderNum:", orderNum);
      console.log("Using parsedEventDate:", parsedEventDate);
      console.log("Using totalAmount:", totalAmount);
      
      // Insert the order - using all required fields based on the actual database schema
      const insertOrderResult = await client.query(
        `INSERT INTO orders (
          user_id, contact_id, event_date, event_type, status, 
          delivery_type, delivery_address, delivery_time, total_amount, notes, order_number,
          title, delivery_fee, amount_paid, special_instructions, tax_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
        [
          userId, 
          contactId, 
          parsedEventDate,
          eventType || 'Birthday',
          status || 'Quote',
          deliveryType || 'Pickup',
          deliveryAddress || '',
          deliveryTime || '',
          totalAmount, // This is now using the 'total' field from request
          notes || '',
          orderNum,
          req.body.title || '', // Optional title field
          deliveryFee, // Use the extracted value
          amountPaid, // Use the extracted value
          specialInstructions, // Use the extracted value
          taxRate // Use the extracted value
        ]
      );
      
      const newOrder = insertOrderResult.rows[0];
      console.log("Order created:", newOrder);
      
      // Insert order items if provided
      if (items && Array.isArray(items)) {
        console.log("Processing order items:", JSON.stringify(items, null, 2));
        
        for (const item of items) {
          console.log("Processing item:", JSON.stringify(item, null, 2));
          
          try {
            // Format values to match database expectations
            const itemPrice = item.price ? item.price.toString() : '0';
            const itemQuantity = item.quantity || 1;
            const itemDescription = item.description || '';
            const itemName = item.name || item.description || 'Product';
            const itemType = item.type || 'Product';
            const itemUnitPrice = item.unitPrice ? item.unitPrice.toString() : itemPrice;
            
            console.log("Inserting order item with values:", {
              orderId: newOrder.id,
              productId: item.productId,
              description: itemDescription,
              quantity: itemQuantity,
              price: itemPrice,
              name: itemName,
              type: itemType,
              unitPrice: itemUnitPrice
            });
            
            await client.query(
              `INSERT INTO order_items (
                order_id, product_id, description, quantity, price, name, type, unit_price
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                newOrder.id,
                item.productId || null,
                itemDescription,
                itemQuantity,
                itemPrice,
                itemName,
                itemType,
                itemUnitPrice
              ]
            );
            
            console.log("Order item inserted successfully");
          } catch (itemError) {
            console.error("Error inserting order item:", itemError);
            console.error("Problem item data:", JSON.stringify(item, null, 2));
            throw itemError; // Re-throw to trigger transaction rollback
          }
        }
      }
      
      await client.query('COMMIT');
      
      console.log("Transaction committed successfully. Order created with ID:", newOrder.id);
      
      res.status(201).json({ 
        success: true, 
        message: "Order created successfully",
        order: newOrder,
        id: newOrder.id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Transaction error:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: "Failed to create order", details: error.message });
  }
});

/**
 * Update an existing order
 */
router.put("/api/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if order exists and belongs to the user
      const checkResult = await client.query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      // Update the order with only the fields that exist in the database
      const {
        contact_id,
        event_date,
        event_type,
        status,
        delivery_type,
        delivery_address,
        delivery_time,
        notes,
        title,
        total_amount
      } = req.body;
      
      const updateResult = await client.query(
        `UPDATE orders SET
          contact_id = COALESCE($1, contact_id),
          event_date = COALESCE($2, event_date),
          event_type = COALESCE($3, event_type),
          status = COALESCE($4, status),
          delivery_type = COALESCE($5, delivery_type),
          delivery_address = COALESCE($6, delivery_address),
          delivery_time = COALESCE($7, delivery_time),
          notes = COALESCE($8, notes),
          title = COALESCE($9, title),
          total_amount = COALESCE($10, total_amount),
          updated_at = NOW()
        WHERE id = $11 AND user_id = $12
        RETURNING *`,
        [
          contact_id,
          event_date,
          event_type,
          status,
          delivery_type,
          delivery_address,
          delivery_time,
          notes,
          title,
          total_amount,
          orderId,
          userId
        ]
      );
      
      const updatedOrder = updateResult.rows[0];
      
      // Update order items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        // Delete existing items
        await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
        
        // Insert new items
        for (const item of req.body.items) {
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, description, quantity, price
            ) VALUES ($1, $2, $3, $4, $5)`,
            [
              orderId,
              item.product_id || null,
              item.description || '',
              item.quantity || 1,
              item.price || '0'
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        order: updatedOrder 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ success: false, error: "Failed to update order" });
  }
});

/**
 * Delete an order
 */
router.delete("/api/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if order exists and belongs to the user
      const checkResult = await client.query(
        'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Order not found" });
      }
      
      // Delete order items first
      await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
      
      // Delete the order
      await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: "Order deleted successfully" 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, error: "Failed to delete order" });
  }
});

// Function to register routes
export function registerOrdersDirectRoutes(app: any) {
  app.use(router);
  console.log("Direct orders routes registered");
}

export default router;