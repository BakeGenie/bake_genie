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
    console.log("Creating new task with data:", JSON.stringify(req.body, null, 2));
    
    // Simple query to check if the tasks table exists
    try {
      const checkTable = await db.$client.query("SELECT * FROM tasks LIMIT 1");
      console.log("Tasks table check result:", checkTable.rowCount);
    } catch (tableError) {
      console.error("Error checking tasks table:", tableError);
    }
    
    const userId = 1; // Default user ID for development
    const { title, description, dueDate, priority, relatedOrderId, completed } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }
    
    // Use super simple insert statement for highest compatibility
    try {
      // First try - simple direct insert
      const insertQuery = `
        INSERT INTO tasks (
          user_id, title, description, due_date, priority, completed
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING *
      `;
      
      const insertValues = [
        userId,
        title,
        description || null,
        dueDate ? new Date(dueDate) : null,
        priority || "Medium",
        completed || false
      ];
      
      console.log("Executing insert query with values:", insertValues);
      
      // Use the query client directly for better error handling
      const result = await db.$client.query(insertQuery, insertValues);
      
      console.log("Task created successfully:", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (insertError) {
      console.error("First insert attempt failed:", insertError);
      
      // If first attempt failed, try alternative approach 
      try {
        const rawInsert = `
          INSERT INTO tasks (user_id, title, description, priority, completed)
          VALUES (1, '${title.replace("'", "''")}', '${(description || "").replace("'", "''")}', '${priority || "Medium"}', ${completed || false})
          RETURNING *
        `;
        
        console.log("Trying raw insert:", rawInsert);
        const rawResult = await db.$client.query(rawInsert);
        console.log("Raw insert succeeded:", rawResult.rows[0]);
        res.status(201).json(rawResult.rows[0]);
      } catch (rawError) {
        console.error("Raw insert also failed:", rawError);
        throw rawError; // re-throw to be caught by outer catch
      }
    }
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({ error: "Failed to create task", details: error instanceof Error ? error.message : 'Unknown error' });
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