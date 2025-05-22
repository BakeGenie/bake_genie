import { Router, Request, Response } from "express";
import { db } from "../db";
import { income, type InsertIncome } from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const router = Router();

/**
 * Get all income for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get user ID from session (fallback to 1 for development)
    const userId = req.session?.userId || 1;
    
    // Extract query parameters for filtering
    const { startDate, endDate, category } = req.query;
    
    // Build query filters
    let query = db.select().from(income).where(eq(income.userId, userId));
    
    // Add date range filters if provided
    if (startDate && typeof startDate === 'string') {
      query = query.where(gte(income.date, new Date(startDate)));
    }
    
    if (endDate && typeof endDate === 'string') {
      query = query.where(lte(income.date, new Date(endDate)));
    }
    
    // Add category filter if provided
    if (category && typeof category === 'string') {
      query = query.where(eq(income.category, category));
    }
    
    // Order by date descending (most recent first)
    query = query.orderBy(desc(income.date));
    
    // Execute the query
    const incomeList = await query;
    
    return res.json(incomeList);
  } catch (error) {
    console.error("Error fetching income:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch income" 
    });
  }
});

/**
 * Get a specific income by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const incomeId = parseInt(req.params.id);
    
    if (isNaN(incomeId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid income ID" 
      });
    }
    
    // Get the income
    const [incomeItem] = await db.select().from(income).where(
      and(
        eq(income.id, incomeId),
        eq(income.userId, userId)
      )
    );
    
    if (!incomeItem) {
      return res.status(404).json({ 
        success: false, 
        error: "Income not found" 
      });
    }
    
    return res.json(incomeItem);
  } catch (error) {
    console.error("Error fetching income:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch income" 
    });
  }
});

/**
 * Create a new income entry
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
    
    // Prepare income data
    const incomeData: InsertIncome = {
      userId,
      category: req.body.category,
      amount: req.body.amount.toString(),
      date: new Date(req.body.date),
      description: req.body.description || null
    };
    
    // Insert the income
    const [newIncome] = await db.insert(income)
      .values(incomeData)
      .returning();
    
    return res.status(201).json(newIncome);
  } catch (error) {
    console.error("Error creating income:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to create income" 
    });
  }
});

/**
 * Update an income entry
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const incomeId = parseInt(req.params.id);
    
    if (isNaN(incomeId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid income ID" 
      });
    }
    
    // Check if income exists and belongs to the user
    const [existingIncome] = await db.select().from(income).where(
      and(
        eq(income.id, incomeId),
        eq(income.userId, userId)
      )
    );
    
    if (!existingIncome) {
      return res.status(404).json({ 
        success: false, 
        error: "Income not found" 
      });
    }
    
    // Prepare update data
    const updateData: Partial<InsertIncome> = {};
    
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.amount !== undefined) updateData.amount = req.body.amount.toString();
    if (req.body.date !== undefined) updateData.date = new Date(req.body.date);
    if (req.body.description !== undefined) updateData.description = req.body.description;
    
    // Update the income
    const [updatedIncome] = await db.update(income)
      .set(updateData)
      .where(
        and(
          eq(income.id, incomeId),
          eq(income.userId, userId)
        )
      )
      .returning();
    
    return res.json(updatedIncome);
  } catch (error) {
    console.error("Error updating income:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update income" 
    });
  }
});

/**
 * Delete an income entry
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const incomeId = parseInt(req.params.id);
    
    if (isNaN(incomeId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid income ID" 
      });
    }
    
    // Delete the income
    await db.delete(income).where(
      and(
        eq(income.id, incomeId),
        eq(income.userId, userId)
      )
    );
    
    return res.json({ 
      success: true, 
      message: "Income deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting income:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete income" 
    });
  }
});

export default router;