import { Router, Request, Response } from "express";
import { db } from "../db";
import { taxRates } from "@shared/schema";
import { eq, and, desc, asc, count } from "drizzle-orm";

interface AuthRequest extends Request {
  session: {
    userId: number;
    [key: string]: any;
  };
}

export const router = Router();

// Create default tax rates if none exist
async function createDefaultTaxRatesIfNoneExist(userId: number) {
  try {
    // Check if user already has tax rates
    const existingRates = await db
      .select()
      .from(taxRates)
      .where(eq(taxRates.userId, userId));
    
    if (existingRates.length === 0) {
      // Create standard rate
      await db.insert(taxRates).values({
        userId,
        name: "Standard Rate",
        rate: 10.0, // Default 10% for demo
        description: "Standard tax rate",
        isDefault: true,
        active: true
      });
      
      // Create zero rate
      await db.insert(taxRates).values({
        userId,
        name: "Zero Rate",
        rate: 0.0,
        description: "No tax",
        isDefault: false,
        active: true
      });
      
      console.log("Created default tax rates for user", userId);
    }
  } catch (error) {
    console.error("Error creating default tax rates:", error);
  }
}

// Get all tax rates for the current user
router.get("/", async (req: Request, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session?.userId || 1;
    
    // Ensure user has at least the default tax rates
    await createDefaultTaxRatesIfNoneExist(userId);

    const results = await db
      .select()
      .from(taxRates)
      .where(eq(taxRates.userId, userId))
      .orderBy(desc(taxRates.isDefault), asc(taxRates.name));

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching tax rates:", error);
    return res.status(500).json({ error: "Failed to fetch tax rates" });
  }
});

// Create a new tax rate
router.post("/", async (req: Request, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session?.userId || 1;
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
router.put("/:id", async (req: Request, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session?.userId || 1;
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
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Use session userId if available, otherwise use default user ID 1 for demo
    const userId = req.session?.userId || 1;
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