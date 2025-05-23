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
    
    // Ensure required fields are present
    if (!req.body.category || !req.body.amount || !req.body.date) {
      return res.status(400).json({ 
        success: false, 
        error: "Category, amount, and date are required" 
      });
    }
    
    // Prepare expense data
    const expenseData: InsertExpense = {
      userId,
      category: req.body.category,
      amount: req.body.amount.toString(),
      date: new Date(req.body.date),
      description: req.body.description || null,
      supplier: req.body.supplier || null,
      paymentSource: req.body.paymentSource || "Cash",
      vat: req.body.vat ? parseFloat(req.body.vat) : null,
      totalIncTax: req.body.totalIncTax ? parseFloat(req.body.totalIncTax) : null,
      taxDeductible: req.body.taxDeductible || false,
      isRecurring: req.body.isRecurring || false,
      receiptUrl: req.body.receiptUrl || null
    };
    
    // Insert the expense
    const [newExpense] = await db.insert(expenses)
      .values(expenseData)
      .returning();
    
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
    
    if (isNaN(expenseId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid expense ID" 
      });
    }
    
    // Check if expense exists and belongs to the user
    const [existingExpense] = await db.select().from(expenses).where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId)
      )
    );
    
    if (!existingExpense) {
      return res.status(404).json({ 
        success: false, 
        error: "Expense not found" 
      });
    }
    
    // Prepare update data
    const updateData: Partial<InsertExpense> = {};
    
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.amount !== undefined) updateData.amount = req.body.amount.toString();
    if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.supplier !== undefined) updateData.supplier = req.body.supplier;
    if (req.body.paymentSource !== undefined) updateData.paymentSource = req.body.paymentSource;
    if (req.body.vat !== undefined) updateData.vat = req.body.vat ? parseFloat(req.body.vat) : null;
    if (req.body.totalIncTax !== undefined) updateData.totalIncTax = req.body.totalIncTax ? parseFloat(req.body.totalIncTax) : null;
    if (req.body.taxDeductible !== undefined) updateData.taxDeductible = req.body.taxDeductible;
    if (req.body.isRecurring !== undefined) updateData.isRecurring = req.body.isRecurring;
    if (req.body.receiptUrl !== undefined) updateData.receiptUrl = req.body.receiptUrl;
    
    // Update the expense
    const [updatedExpense] = await db.update(expenses)
      .set(updateData)
      .where(
        and(
          eq(expenses.id, expenseId),
          eq(expenses.userId, userId)
        )
      )
      .returning();
    
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