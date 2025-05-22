import { Router } from "express";
import { db } from "../db";
import { scheduledPayments } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

/**
 * Get scheduled payments for a specific order
 */
router.get("/api/orders/:orderId/scheduled-payments", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get the order's scheduled payments
    const payments = await db
      .select()
      .from(scheduledPayments)
      .where(eq(scheduledPayments.orderId, orderId))
      .orderBy(asc(scheduledPayments.dueDate));
    
    res.json(payments);
  } catch (error) {
    console.error("Error fetching scheduled payments:", error);
    res.status(500).json({ error: "Failed to fetch scheduled payments" });
  }
});

/**
 * Create a new scheduled payment for an order
 */
router.post("/api/orders/:orderId/scheduled-payments", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Create the payment with the order ID
    const paymentData = {
      ...req.body,
      orderId,
    };
    
    // Insert the payment
    const [newPayment] = await db.insert(scheduledPayments).values(paymentData).returning();
    
    console.log("Scheduled payment created:", newPayment);
    
    res.status(201).json({
      success: true,
      payment: newPayment,
    });
  } catch (error) {
    console.error("Error creating scheduled payment:", error);
    res.status(500).json({ error: "Failed to create scheduled payment" });
  }
});

/**
 * Update a scheduled payment
 */
router.patch("/api/scheduled-payments/:paymentId", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    
    // Update the payment
    const [updatedPayment] = await db
      .update(scheduledPayments)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(scheduledPayments.id, paymentId))
      .returning();
    
    if (!updatedPayment) {
      return res.status(404).json({ error: "Scheduled payment not found" });
    }
    
    res.json({
      success: true,
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("Error updating scheduled payment:", error);
    res.status(500).json({ error: "Failed to update scheduled payment" });
  }
});

/**
 * Delete a scheduled payment
 */
router.delete("/api/scheduled-payments/:paymentId", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);
    
    // Delete the payment
    await db.delete(scheduledPayments).where(eq(scheduledPayments.id, paymentId));
    
    res.json({
      success: true,
      message: "Scheduled payment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled payment:", error);
    res.status(500).json({ error: "Failed to delete scheduled payment" });
  }
});

export default router;