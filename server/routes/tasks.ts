import { Router, Request, Response } from "express";
import { db } from "../db";
import { tasks } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export const router = Router();

/**
 * Get all tasks for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Use user ID from session, fallback to 1 for development
    const userId = 1;
    
    // Fetch tasks for this user
    const result = await db.execute(
      sql`SELECT * FROM tasks WHERE user_id = ${userId} ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ 
      error: "Failed to fetch tasks" 
    });
  }
});

/**
 * Get count of incomplete tasks
 */
router.get("/count", async (req: Request, res: Response) => {
  try {
    // Use user ID from session, fallback to 1 for development
    const userId = 1;
    
    // Count incomplete tasks for this user
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM tasks WHERE user_id = ${userId} AND completed = false`
    );
    
    const count = Number(result.rows[0]?.count || 0);
    
    res.json({ count });
  } catch (error) {
    console.error("Error counting tasks:", error);
    res.status(500).json({ 
      error: "Failed to count tasks" 
    });
  }
});

/**
 * Get a specific task by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = 1;
    
    // Get task by ID
    const result = await db.execute(
      sql`SELECT * FROM tasks WHERE id = ${taskId} AND user_id = ${userId}`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

/**
 * Create a new task
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Creating new task with data:", req.body);
    
    const userId = 1; // Default user ID for development
    const { title, description, dueDate, priority, orderId, completed } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Use simpler query with parameterized values for better safety
    const query = `
      INSERT INTO tasks (
        user_id, title, description, due_date, priority, related_order_id, completed, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW()
      ) RETURNING *
    `;
    
    const values = [
      userId,
      title,
      description || null,
      dueDate ? new Date(dueDate) : null,
      priority || "Medium",
      orderId || null,
      completed || false
    ];
    
    console.log("Executing query with values:", values);
    
    // Use the query client directly for better error handling
    const result = await db.$client.query(query, values);
    
    console.log("Task created successfully:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    res.status(500).json({ error: "Failed to create task" });
  }
});

/**
 * Update a task
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = 1;
    const { title, description, dueDate, priority, orderId, completed } = req.body;
    
    // Build SET clause dynamically based on provided fields
    let setClauses = [];
    let setValues = [];
    
    if (title !== undefined) {
      setClauses.push("title = $1");
      setValues.push(title);
    }
    
    if (description !== undefined) {
      setClauses.push(`description = $${setValues.length + 1}`);
      setValues.push(description);
    }
    
    if (dueDate !== undefined) {
      setClauses.push(`due_date = $${setValues.length + 1}`);
      setValues.push(dueDate ? new Date(dueDate) : null);
    }
    
    if (priority !== undefined) {
      setClauses.push(`priority = $${setValues.length + 1}`);
      setValues.push(priority);
    }
    
    if (orderId !== undefined) {
      setClauses.push(`order_id = $${setValues.length + 1}`);
      setValues.push(orderId);
    }
    
    if (completed !== undefined) {
      setClauses.push(`completed = $${setValues.length + 1}`);
      setValues.push(completed);
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    // Add WHERE clause parameter values
    setValues.push(taskId);
    setValues.push(userId);
    
    // Execute update query
    const query = `
      UPDATE tasks 
      SET ${setClauses.join(", ")} 
      WHERE id = $${setValues.length - 1} AND user_id = $${setValues.length}
      RETURNING *
    `;
    
    const result = await db.$client.query(query, setValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

/**
 * Delete a task
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = 1;
    
    // Delete task
    const result = await db.execute(
      sql`DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${userId} RETURNING id`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;