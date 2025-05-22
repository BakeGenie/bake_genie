import { Router, Request, Response } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { ingredients } from "@shared/schema";
import { eq } from "drizzle-orm";

export const router = Router();

/**
 * Get all ingredients for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Use user ID from session, fallback to 1 for development
    const userId = 1;
    
    // Fetch ingredients for this user
    const result = await db.execute(
      sql`SELECT * FROM ingredients WHERE user_id = ${userId} ORDER BY name ASC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ 
      error: "Failed to fetch ingredients" 
    });
  }
});

/**
 * Get a specific ingredient by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const ingredientId = parseInt(req.params.id);
    const userId = 1;
    
    // Get ingredient by ID
    const result = await db.execute(
      sql`SELECT * FROM ingredients WHERE id = ${ingredientId} AND user_id = ${userId}`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
});

/**
 * Create a new ingredient
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Creating new ingredient with data:", JSON.stringify(req.body, null, 2));
    
    const userId = 1; // Default user ID for development
    const { 
      name, 
      supplier, 
      purchaseSize, 
      purchaseSizeUnit,
      costPrice, 
      unit, 
      hasSpecificVolume 
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    if (!unit) {
      return res.status(400).json({ error: "Measurement unit is required" });
    }
    
    if (!costPrice) {
      return res.status(400).json({ error: "Cost price is required" });
    }
    
    // Insert the ingredient
    const insertResult = await db.execute(
      sql`
        INSERT INTO ingredients (
          user_id, name, supplier, unit, cost_per_unit, pack_size, pack_cost
        ) VALUES (
          ${userId}, ${name}, ${supplier || null}, ${unit}, ${costPrice}, 
          ${purchaseSize || null}, 
          ${purchaseSize && costPrice ? costPrice : null}
        ) RETURNING *
      `
    );
    
    if (insertResult.rows.length === 0) {
      return res.status(500).json({ error: "Failed to create ingredient" });
    }
    
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ 
      error: "Failed to create ingredient",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Update an ingredient
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const ingredientId = parseInt(req.params.id);
    const userId = 1;
    
    // Get the current ingredient to make sure it exists and belongs to the user
    const checkResult = await db.execute(
      sql`SELECT * FROM ingredients WHERE id = ${ingredientId} AND user_id = ${userId}`
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Ingredient not found" });
    }
    
    const { 
      name, 
      supplier, 
      purchaseSize, 
      purchaseSizeUnit,
      costPrice, 
      unit, 
      hasSpecificVolume 
    } = req.body;
    
    // Build update SQL dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (name !== undefined) {
      updates.push("name = $" + (values.length + 1));
      values.push(name);
    }
    
    if (supplier !== undefined) {
      updates.push("supplier = $" + (values.length + 1));
      values.push(supplier || null);
    }
    
    if (costPrice !== undefined) {
      updates.push("cost_per_unit = $" + (values.length + 1));
      values.push(costPrice);
    }
    
    if (unit !== undefined) {
      updates.push("unit = $" + (values.length + 1));
      values.push(unit);
    }
    
    if (purchaseSize !== undefined) {
      updates.push("pack_size = $" + (values.length + 1));
      values.push(purchaseSize || null);
    }
    
    if (purchaseSize !== undefined && costPrice !== undefined) {
      updates.push("pack_cost = $" + (values.length + 1));
      values.push(costPrice || null);
    }
    
    // If no fields to update, return the existing ingredient
    if (updates.length === 0) {
      return res.json(checkResult.rows[0]);
    }
    
    // Add ingredient ID and user ID to values
    values.push(ingredientId);
    values.push(userId);
    
    // Execute update
    const updateQuery = `
      UPDATE ingredients 
      SET ${updates.join(", ")} 
      WHERE id = $${values.length - 1} AND user_id = $${values.length}
      RETURNING *
    `;
    
    const updateResult = await db.$client.query(updateQuery, values);
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({ error: "Failed to update ingredient" });
    }
    
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(500).json({ 
      error: "Failed to update ingredient",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Delete an ingredient
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const ingredientId = parseInt(req.params.id);
    const userId = 1;
    
    // Delete the ingredient
    const result = await db.execute(
      sql`DELETE FROM ingredients WHERE id = ${ingredientId} AND user_id = ${userId} RETURNING id`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ingredient not found or already deleted" });
    }
    
    res.json({ id: result.rows[0].id, message: "Ingredient deleted successfully" });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
});

export default router;