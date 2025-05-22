import { Router } from "express";
import { db } from "../db";
import { orderTasks } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Get tasks for a specific order
 */
router.get("/api/orders/:orderId/tasks", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get the order's tasks
    const tasks = await db
      .select()
      .from(orderTasks)
      .where(eq(orderTasks.orderId, orderId));
    
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching order tasks:", error);
    res.status(500).json({ error: "Failed to fetch order tasks" });
  }
});

/**
 * Create a new task for an order
 */
router.post("/api/orders/:orderId/tasks", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Create the task with the order ID
    const taskData = {
      ...req.body,
      orderId,
    };
    
    // Insert the task
    const [newTask] = await db.insert(orderTasks).values(taskData).returning();
    
    console.log("Task created:", newTask);
    
    res.status(201).json({
      success: true,
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

/**
 * Update a task
 */
router.patch("/api/tasks/:taskId", async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    
    // Update the task
    const [updatedTask] = await db
      .update(orderTasks)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(orderTasks.id, taskId))
      .returning();
    
    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

/**
 * Delete a task
 */
router.delete("/api/tasks/:taskId", async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    
    // Delete the task
    await db.delete(orderTasks).where(eq(orderTasks.id, taskId));
    
    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;