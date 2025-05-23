import { Router, Request, Response } from "express";
import { pool } from "../db";

export const router = Router();

/**
 * Get user ID from session
 */
function getUserId(req: Request): number {
  return req.session?.userId || 1;
}

/**
 * Create a new expense with direct SQL
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    // Log the request body for debugging
    console.log("NEW DIRECT EXPENSE REQUEST:", JSON.stringify(req.body, null, 2));
    
    // Basic validation
    if (!req.body.category || !req.body.amount || !req.body.date) {
      return res.status(400).json({ 
        success: false, 
        error: "Category, amount, and date are required" 
      });
    }
    
    // SIMPLE DIRECT APPROACH - Minimal code, everything explicit
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    // Parse numeric values safely
    const vatValue = req.body.vat ? parseFloat(req.body.vat) : 0;
    const totalIncTaxValue = req.body.totalIncTax ? parseFloat(req.body.totalIncTax) : 0;
    
    console.log("PRE-EXECUTION VALUES:");
    console.log("Supplier:", req.body.supplier);
    console.log("VAT:", vatValue, "from original:", req.body.vat);
    console.log("Total Inc Tax:", totalIncTaxValue, "from original:", req.body.totalIncTax);
    
    const values = [
      userId,
      req.body.category,
      req.body.amount,
      new Date(req.body.date),
      req.body.description || null,
      req.body.supplier || "",
      req.body.paymentSource || "Cash",
      vatValue,
      totalIncTaxValue,
      req.body.taxDeductible ? true : false,
      req.body.isRecurring ? true : false,
      req.body.receiptUrl || null
    ];
    
    // Execute query
    const result = await pool.query(sql, values);
    const newExpense = result.rows[0];
    
    // Log the result for debugging
    console.log("SAVED EXPENSE:", JSON.stringify(newExpense, null, 2));
    
    return res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ message: "Failed to create expense" });
  }
});

/**
 * Get all expenses
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const sql = `
      SELECT * FROM expenses 
      WHERE user_id = $1
      ORDER BY date DESC
    `;
    
    const result = await pool.query(sql, [userId]);
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

/**
 * Get expense by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const expenseId = parseInt(req.params.id);
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }
    
    const sql = `
      SELECT * FROM expenses 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(sql, [expenseId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return res.status(500).json({ message: "Failed to fetch expense" });
  }
});

/**
 * Update expense
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const expenseId = parseInt(req.params.id);
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }
    
    // Build SET clause dynamically
    const updates: string[] = [];
    const values: any[] = [expenseId, userId];
    let paramIndex = 3;
    
    // Helper function to add an update field
    const addUpdate = (field: string, value: any) => {
      if (value !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    };
    
    // Add update fields if they exist in the request
    addUpdate("category", req.body.category);
    addUpdate("amount", req.body.amount);
    
    if (req.body.date) {
      addUpdate("date", new Date(req.body.date));
    }
    
    addUpdate("description", req.body.description);
    addUpdate("supplier", req.body.supplier);
    addUpdate("payment_source", req.body.paymentSource);
    
    // Parse numeric values
    if (req.body.vat !== undefined) {
      const vatValue = req.body.vat ? parseFloat(req.body.vat) : 0;
      addUpdate("vat", vatValue);
    }
    
    if (req.body.totalIncTax !== undefined) {
      const totalIncTaxValue = req.body.totalIncTax ? parseFloat(req.body.totalIncTax) : 0;
      addUpdate("total_inc_tax", totalIncTaxValue);
    }
    
    if (req.body.taxDeductible !== undefined) {
      addUpdate("tax_deductible", Boolean(req.body.taxDeductible));
    }
    
    if (req.body.isRecurring !== undefined) {
      addUpdate("is_recurring", Boolean(req.body.isRecurring));
    }
    
    addUpdate("receipt_url", req.body.receiptUrl);
    
    // If no updates, just return the current expense
    if (updates.length === 0) {
      const result = await pool.query(
        "SELECT * FROM expenses WHERE id = $1 AND user_id = $2",
        [expenseId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      return res.json(result.rows[0]);
    }
    
    // Build and execute update query
    const sql = `
      UPDATE expenses 
      SET ${updates.join(", ")}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    console.log("UPDATE SQL:", sql);
    console.log("UPDATE VALUES:", values);
    
    const result = await pool.query(sql, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    return res.status(500).json({ message: "Failed to update expense" });
  }
});

/**
 * Delete expense
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const expenseId = parseInt(req.params.id);
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }
    
    const sql = `
      DELETE FROM expenses 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(sql, [expenseId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return res.status(500).json({ message: "Failed to delete expense" });
  }
});

export default router;