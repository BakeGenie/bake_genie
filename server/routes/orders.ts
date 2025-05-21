import { Router } from "express";
import { db } from "../db";
import { orders, orderItems, contacts } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * Get all orders for the current user
 */
router.get("/api/orders", async (req, res) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;

    // Use Drizzle ORM to get orders
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    res.json(result);
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
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
      
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    
    // Get the contact information separately
    let contact = null;
    if (order.contactId) {
      const [contactResult] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, order.contactId));
      contact = contactResult;
    }

    // Get order items
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const orderWithItems = {
      ...order,
      contact,
      items,
    };

    console.log("Sending order details:", orderWithItems);

    res.json(orderWithItems);
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
    // Get user ID from session
    //const userId = req.session?.userId || 1;

    // Prepare order data with userId
    const orderData = {
      ...req.body,
      userId,
      // Convert numbers from strings if needed
      total:
        typeof req.body.total === "string"
          ? parseFloat(req.body.total)
          : req.body.total,
      discount:
        typeof req.body.discount === "string"
          ? parseFloat(req.body.discount)
          : req.body.discount || 0,
      setupFee:
        typeof req.body.setupFee === "string"
          ? parseFloat(req.body.setupFee)
          : req.body.setupFee || 0,
      taxRate:
        typeof req.body.taxRate === "string"
          ? parseFloat(req.body.taxRate)
          : req.body.taxRate || 0,
    };

    // Generate order number if not provided
    if (!orderData.orderNumber) {
      orderData.orderNumber = `ORD-${Date.now().toString().substring(6)}`;
    }

    console.log("Creating order with data:", orderData);

    // Insert the order into the database
    const [newOrder] = await db.insert(orders).values(orderData).returning();

    console.log("Order created:", newOrder);

    // Insert order items if provided
    if (req.body.items && Array.isArray(req.body.items)) {
      const itemsWithOrderId = req.body.items.map((item) => ({
        ...item,
        orderId: newOrder.id,
        // Convert numbers from strings if needed
        quantity:
          typeof item.quantity === "string"
            ? parseInt(item.quantity)
            : item.quantity,
        unitPrice:
          typeof item.unitPrice === "string"
            ? parseFloat(item.unitPrice)
            : item.unitPrice,
        price:
          typeof item.price === "string" ? parseFloat(item.price) : item.price,
      }));

      await db.insert(orderItems).values(itemsWithOrderId);
    }

    res.status(201).json({
      success: true,
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, error: "Failed to create order" });
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

    // Check if the order exists and belongs to the user
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!existingOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Update the order
    const updateData = {
      ...req.body,
      updatedAt: new Date(),
    };

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    // Update order items if provided
    if (req.body.items && Array.isArray(req.body.items)) {
      // Delete existing items for this order
      await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

      // Insert new items
      const itemsWithOrderId = req.body.items.map((item) => ({
        ...item,
        orderId,
        // Convert numbers from strings if needed
        quantity:
          typeof item.quantity === "string"
            ? parseInt(item.quantity)
            : item.quantity,
        unitPrice:
          typeof item.unitPrice === "string"
            ? parseFloat(item.unitPrice)
            : item.unitPrice,
        price:
          typeof item.price === "string" ? parseFloat(item.price) : item.price,
      }));

      await db.insert(orderItems).values(itemsWithOrderId);
    }

    res.json({
      success: true,
      order: updatedOrder,
    });
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

    // Check if the order exists and belongs to the user
    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

    if (!existingOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Delete order items first
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));

    // Delete the order
    await db.delete(orders).where(eq(orders.id, orderId));

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ success: false, error: "Failed to delete order" });
  }
});

export default router;
