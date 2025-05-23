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
 * Create a new expense - super simple implementation
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    console.log("Super simple expenses handler received:", req.body);
    
    // Ensure required fields are present
    if (!req.body.category || !req.body.amount || !req.body.date) {
      return res.status(400).json({ 
        success: false, 
        error: "Category, amount, and date are required" 
      });
    }
    
    // Create database entry via direct SQL
    const query = `
      INSERT INTO expenses (
        user_id, category, amount, date, description,
        supplier, payment_source, vat, total_inc_tax,
        tax_deductible, is_recurring, receipt_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;
    
    // Create parameters array with explicit values
    const params = [
      userId,
      req.body.category,
      req.body.amount,
      new Date(req.body.date),
      req.body.description || null,
      req.body.supplier || '', // TEXT type
      req.body.paymentSource || 'Cash', // TEXT type
      req.body.vat ? parseFloat(req.body.vat) : 0, // NUMERIC type
      req.body.totalIncTax ? parseFloat(req.body.totalIncTax) : 0, // NUMERIC type
      req.body.taxDeductible === true, // BOOLEAN type
      req.body.isRecurring === true, // BOOLEAN type
      req.body.receiptUrl || null // TEXT type, nullable
    ];
    
    // Log what we're sending to database
    console.log("FINAL DATABASE PARAMS:");
    console.log("- supplier:", params[5]);
    console.log("- paymentSource:", params[6]);
    console.log("- vat:", params[7]);
    console.log("- totalIncTax:", params[8]);
    
    // Execute query with explicit parameters
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error("Failed to create expense record");
    }
    
    // Return the newly created expense
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error in simple expense creation:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create expense" 
    });
  }
});

// List all expenses
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    const result = await pool.query(
      "SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC",
      [userId]
    );
    
    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

export default router;