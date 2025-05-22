import { Router } from "express";
import { db } from "../db";
import { supplies } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { insertSupplySchema } from "@shared/schema";

const router = Router();

// Get all supplies for the user
router.get("/", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const allSupplies = await db
      .select()
      .from(supplies)
      .where(eq(supplies.userId, userId));
    res.json(allSupplies);
  } catch (error) {
    console.error("Error fetching supplies:", error);
    res.status(500).json({ error: "Failed to fetch supplies" });
  }
});

// Get a single supply by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const supplyId = parseInt(req.params.id);
    
    if (isNaN(supplyId)) {
      return res.status(400).json({ error: "Invalid supply ID" });
    }
    
    const [supply] = await db
      .select()
      .from(supplies)
      .where(
        and(
          eq(supplies.id, supplyId),
          eq(supplies.userId, userId)
        )
      );
    
    if (!supply) {
      return res.status(404).json({ error: "Supply not found" });
    }
    
    res.json(supply);
  } catch (error) {
    console.error("Error fetching supply:", error);
    res.status(500).json({ error: "Failed to fetch supply" });
  }
});

// Create a new supply
router.post("/", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const validatedData = insertSupplySchema.parse({
      ...req.body,
      userId,
    });
    
    // Insert the new supply
    const [createdSupply] = await db
      .insert(supplies)
      .values(validatedData)
      .returning();
      
    res.status(201).json(createdSupply);
  } catch (error) {
    console.error("Error creating supply:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid supply data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create supply" });
  }
});

// Update a supply
router.put("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const supplyId = parseInt(req.params.id);
    
    if (isNaN(supplyId)) {
      return res.status(400).json({ error: "Invalid supply ID" });
    }
    
    // Make sure this supply belongs to the user
    const [existingSupply] = await db
      .select()
      .from(supplies)
      .where(
        and(
          eq(supplies.id, supplyId),
          eq(supplies.userId, userId)
        )
      );
    
    if (!existingSupply) {
      return res.status(404).json({ error: "Supply not found" });
    }
    
    // Validate and update the supply
    const validatedData = insertSupplySchema.parse({
      ...req.body,
      userId,
    });
    
    // Update the supply
    const [updatedSupply] = await db
      .update(supplies)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplies.id, supplyId),
          eq(supplies.userId, userId)
        )
      )
      .returning();
      
    res.json(updatedSupply);
  } catch (error) {
    console.error("Error updating supply:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid supply data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to update supply" });
  }
});

// Delete a supply
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const supplyId = parseInt(req.params.id);
    
    if (isNaN(supplyId)) {
      return res.status(400).json({ error: "Invalid supply ID" });
    }
    
    // Make sure this supply belongs to the user
    const [existingSupply] = await db
      .select()
      .from(supplies)
      .where(
        and(
          eq(supplies.id, supplyId),
          eq(supplies.userId, userId)
        )
      );
    
    if (!existingSupply) {
      return res.status(404).json({ error: "Supply not found" });
    }
    
    // Delete the supply
    await db
      .delete(supplies)
      .where(
        and(
          eq(supplies.id, supplyId),
          eq(supplies.userId, userId)
        )
      );
      
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting supply:", error);
    res.status(500).json({ error: "Failed to delete supply" });
  }
});

export default router;