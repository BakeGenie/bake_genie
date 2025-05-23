import { Router, Request, Response } from "express";
import { db } from "../db";
import { expenses, income, type InsertExpense, type InsertIncome } from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const router = Router();

/**
 * Get all expenses for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get user ID from session (fallback to 1 for development)
    const userId = req.session?.userId || 1;
    
    // Extract query parameters for filtering
    const { startDate, endDate, category } = req.query;
    
    // Build query filters
    let query = db.select().from(expenses).where(eq(expenses.userId, userId));
    
    // Add date range filters if provided
    if (startDate && typeof startDate === 'string') {
      query = query.where(gte(expenses.date, new Date(startDate)));
    }
    
    if (endDate && typeof endDate === 'string') {
      query = query.where(lte(expenses.date, new Date(endDate)));
    }
    
    // Add category filter if provided
    if (category && typeof category === 'string') {
      query = query.where(eq(expenses.category, category));
    }
    
    // Order by date descending (most recent first)
    query = query.orderBy(desc(expenses.date));
    
    // Execute the query
    const expensesList = await query;
    
    return res.json(expensesList);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch expenses" 
    });
  }
});

/**
 * Get a specific expense by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const expenseId = parseInt(req.params.id);
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid expense ID" 
      });
    }
    
    // Get the expense
    const [expense] = await db.select().from(expenses).where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId)
      )
    );
    
    if (!expense) {
      return res.status(404).json({ 
        success: false, 
        error: "Expense not found" 
      });
    }
    
    return res.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch expense" 
    });
  }
});

/**
 * Create a new expense
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Debug log to see what's coming in the request
    console.log("Expense data received:", JSON.stringify(req.body, null, 2));
    
    // Ensure required fields are present
    if (!req.body.category || !req.body.amount || !req.body.date) {
      return res.status(400).json({ 
        success: false, 
        error: "Category, amount, and date are required" 
      });
    }
    
    // Use direct SQL instead of Drizzle ORM to ensure all fields are properly saved
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    
    // Prepare SQL values properly to avoid any ORM translation issues
    const sql = `
      INSERT INTO expenses (
        user_id, 
        category, 
        amount, 
        date, 
        description, 
        supplier,
        payment_source, 
        vat, 
        total_inc_tax, 
        tax_deductible, 
        is_recurring, 
        receipt_url
      ) 
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `;
    
    const values = [
      userId,
      req.body.category,
      req.body.amount.toString(),
      new Date(req.body.date),
      req.body.description || null,
      req.body.supplier || "", // Empty string if not provided
      req.body.paymentSource || "Cash", // Default to 'Cash' if not provided
      req.body.vat ? req.body.vat.toString() : "0.00", // Default to 0 if not provided
      req.body.totalIncTax ? req.body.totalIncTax.toString() : "0.00", // Default to 0 if not provided
      req.body.taxDeductible || false,
      req.body.isRecurring || false,
      req.body.receiptUrl || null
    ];
    
    console.log("SQL Values:", JSON.stringify(values, null, 2));
    
    // Execute the SQL directly
    const result = await db.execute(sql, values);
    const newExpense = result.rows[0];
    
    return res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create expense" 
    });
  }
});

/**
 * Update an expense
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const expenseId = parseInt(req.params.id);
    
    console.log("Update expense data received:", JSON.stringify(req.body, null, 2));
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid expense ID" 
      });
    }
    
    // Check if expense exists and belongs to the user
    const checkSql = `
      SELECT * FROM expenses 
      WHERE id = $1 AND user_id = $2
    `;
    
    const checkResult = await db.execute(checkSql, [expenseId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Expense not found" 
      });
    }
    
    // Build the update SQL dynamically based on what fields were provided
    const updateFields = [];
    const values = [expenseId, userId]; // Start with id and userId
    let paramIndex = 3; // Start from $3 since we're using $1 and $2 above
    
    if (req.body.category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      values.push(req.body.category);
      paramIndex++;
    }
    
    if (req.body.amount !== undefined) {
      updateFields.push(`amount = $${paramIndex}`);
      values.push(req.body.amount.toString());
      paramIndex++;
    }
    
    if (req.body.date !== undefined) {
      updateFields.push(`date = $${paramIndex}`);
      values.push(new Date(req.body.date));
      paramIndex++;
    }
    
    if (req.body.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(req.body.description);
      paramIndex++;
    }
    
    if (req.body.supplier !== undefined) {
      updateFields.push(`supplier = $${paramIndex}`);
      values.push(req.body.supplier || "");
      paramIndex++;
    }
    
    if (req.body.paymentSource !== undefined) {
      updateFields.push(`payment_source = $${paramIndex}`);
      values.push(req.body.paymentSource || "Cash");
      paramIndex++;
    }
    
    if (req.body.vat !== undefined) {
      updateFields.push(`vat = $${paramIndex}`);
      values.push(req.body.vat ? req.body.vat.toString() : "0.00");
      paramIndex++;
    }
    
    if (req.body.totalIncTax !== undefined) {
      updateFields.push(`total_inc_tax = $${paramIndex}`);
      values.push(req.body.totalIncTax ? req.body.totalIncTax.toString() : "0.00");
      paramIndex++;
    }
    
    if (req.body.taxDeductible !== undefined) {
      updateFields.push(`tax_deductible = $${paramIndex}`);
      values.push(Boolean(req.body.taxDeductible));
      paramIndex++;
    }
    
    if (req.body.isRecurring !== undefined) {
      updateFields.push(`is_recurring = $${paramIndex}`);
      values.push(Boolean(req.body.isRecurring));
      paramIndex++;
    }
    
    if (req.body.receiptUrl !== undefined) {
      updateFields.push(`receipt_url = $${paramIndex}`);
      values.push(req.body.receiptUrl);
      paramIndex++;
    }
    
    // If no fields to update, return the existing expense
    if (updateFields.length === 0) {
      return res.json(checkResult.rows[0]);
    }
    
    // Build and execute the SQL
    const updateSql = `
      UPDATE expenses 
      SET ${updateFields.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    console.log("Update SQL:", updateSql);
    console.log("Update values:", JSON.stringify(values, null, 2));
    
    const result = await db.execute(updateSql, values);
    const updatedExpense = result.rows[0];
    
    return res.json(updatedExpense);
  } catch (error) {
    console.error("Error updating expense:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update expense" 
    });
  }
});

/**
 * Delete an expense
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const expenseId = parseInt(req.params.id);
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid expense ID" 
      });
    }
    
    // Delete the expense
    await db.delete(expenses).where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId)
      )
    );
    
    return res.json({ 
      success: true, 
      message: "Expense deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete expense" 
    });
  }
});

export default router;