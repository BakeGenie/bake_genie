import { Router } from "express";
import { db } from "../db";
import { orderLogs, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

/**
 * Get logs for a specific order
 */
router.get("/api/orders/:orderId/logs", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get user ID from session for security
    const userId = req.session?.userId || 1;
    
    // Fetch logs with creator info and order details
    const logs = await db
      .select({
        id: orderLogs.id,
        orderId: orderLogs.orderId,
        action: orderLogs.action,
        details: orderLogs.details,
        createdAt: orderLogs.createdAt,
        createdBy: orderLogs.createdBy,
        creatorName: db.raw(`concat(u.first_name, ' ', u.last_name)`),
      })
      .from(orderLogs)
      .leftJoin(users.as('u'), eq(orderLogs.createdBy, users.as('u').id))
      .where(eq(orderLogs.orderId, orderId))
      .orderBy(db.desc(orderLogs.createdAt));
    
    res.json(logs);
  } catch (error) {
    console.error("Error fetching order logs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch order logs" });
  }
});

/**
 * Create a new log entry for an order
 */
router.post("/api/orders/:orderId/logs", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Create the log entry
    const logEntry = {
      orderId,
      action: req.body.action,
      details: req.body.details || null,
      createdBy: userId,
    };
    
    const [newLog] = await db.insert(orderLogs).values(logEntry).returning();
    
    res.status(201).json({
      success: true,
      log: newLog,
    });
  } catch (error) {
    console.error("Error creating order log:", error);
    res.status(500).json({ success: false, error: "Failed to create order log" });
  }
});

export default router;