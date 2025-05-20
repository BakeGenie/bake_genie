import { Router, Request, Response } from "express";
import { db } from "../db";
import { taxRates } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface AuthRequest extends Request {
  session: {
    userId: number;
    [key: string]: any;
  };
}

export const router = Router();

// Get all tax rates for the current user
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session.userId || 1;

    const results = await db
      .select()
      .from(taxRates)
      .where(eq(taxRates.userId, userId))
      .orderBy(taxRates.isDefault.desc(), taxRates.name.asc());

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching tax rates:", error);
    return res.status(500).json({ error: "Failed to fetch tax rates" });
  }
});

// Create a new tax rate
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session.userId || 1;
    const { name, rate, description, isDefault } = req.body;

    if (isDefault) {
      // If this is the default tax rate, unset any existing default first
      await db
        .update(taxRates)
        .set({ isDefault: false })
        .where(and(eq(taxRates.userId, userId), eq(taxRates.isDefault, true)));
    }

    const [newTaxRate] = await db
      .insert(taxRates)
      .values({
        userId,
        name,
        rate,
        description,
        isDefault: isDefault || false,
        active: true
      })
      .returning();

    return res.status(201).json(newTaxRate);
  } catch (error) {
    console.error("Error creating tax rate:", error);
    return res.status(500).json({ error: "Failed to create tax rate" });
  }
});

// Update a tax rate
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session.userId || 1;
    const { id } = req.params;
    const { name, rate, description, isDefault, active } = req.body;

    if (isDefault) {
      // If this is the default tax rate, unset any existing default first
      await db
        .update(taxRates)
        .set({ isDefault: false })
        .where(and(eq(taxRates.userId, userId), eq(taxRates.isDefault, true)));
    }

    const [updatedTaxRate] = await db
      .update(taxRates)
      .set({
        name,
        rate,
        description,
        isDefault: isDefault || false,
        active: active !== undefined ? active : true,
        updatedAt: new Date()
      })
      .where(and(eq(taxRates.id, parseInt(id)), eq(taxRates.userId, userId)))
      .returning();

    if (!updatedTaxRate) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    return res.status(200).json(updatedTaxRate);
  } catch (error) {
    console.error("Error updating tax rate:", error);
    return res.status(500).json({ error: "Failed to update tax rate" });
  }
});

// Delete a tax rate
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session.userId || 1;
    const { id } = req.params;

    const [deletedTaxRate] = await db
      .delete(taxRates)
      .where(and(eq(taxRates.id, parseInt(id)), eq(taxRates.userId, userId)))
      .returning();

    if (!deletedTaxRate) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting tax rate:", error);
    return res.status(500).json({ error: "Failed to delete tax rate" });
  }
});