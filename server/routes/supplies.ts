import { Router } from "express";
import { db } from "../db";
import { supplies } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { insertSupplySchema } from "@shared/schema";

const router = Router();

// For TypeScript type safety
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

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
    
    // Convert number strings to actual numbers
    const supplyData = {
      ...req.body,
      userId,
      // Convert number fields and ensure they're the right type
      price: req.body.price ? req.body.price.toString() : null, // Ensure price is a string for decimal
      quantity: req.body.quantity ? Number(req.body.quantity) : 0,
      reorder_level: req.body.reorder_level ? Number(req.body.reorder_level) : 5
    };
    
    const validatedData = insertSupplySchema.parse(supplyData);
    
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

// Direct SQL import route to bypass ORM issues
router.post('/direct-import', async (req, res) => {
  try {
    const userId = req.session.userId || 1;
    const { supplies: suppliesData } = req.body;
    
    if (!Array.isArray(suppliesData) || suppliesData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request format. Supply data array is required.' 
      });
    }
    
    console.log(`DIRECT IMPORT: Received ${suppliesData.length} supplies for import`);
    console.log('First few items:', JSON.stringify(suppliesData.slice(0, 2)));
    
    // Import each supply item directly using SQL to avoid ORM issues
    let successCount = 0;
    let errorCount = 0;
    
    // Use a single transaction for all inserts
    try {
      // Start transaction
      await db.execute('BEGIN');
      
      for (const supply of suppliesData) {
        try {
          // Ensure proper data types and defaults
          const name = (supply.name || '').replace(/"/g, '');
          const supplier = (supply.supplier || '').replace(/"/g, '');
          const category = (supply.category || '').replace(/"/g, '');
          const price = typeof supply.price === 'number' ? supply.price : 0;
          const description = (supply.description || '').replace(/"/g, '');
          const quantity = typeof supply.quantity === 'number' ? supply.quantity : (parseInt(supply.quantity) || 0);
          const reorder_level = typeof supply.reorder_level === 'number' ? supply.reorder_level : (parseInt(supply.reorder_level) || 5);
          
          console.log(`Inserting supply: ${name}, Supplier: ${supplier}, Category: ${category}, Price: ${price}`);
          
          // More direct database connection to ensure it works
          await db.execute(`
            INSERT INTO supplies (
              user_id, name, supplier, category, price, description, quantity, reorder_level, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
            )
          `, [
            userId,
            name,
            supplier, 
            category,
            price,
            description,
            quantity,
            reorder_level
          ]);
          
          successCount++;
        } catch (err) {
          console.error(`DIRECT IMPORT: Failed to insert supply:`, err);
          errorCount++;
        }
      }
      
      // Commit transaction
      await db.execute('COMMIT');
      
    } catch (txnError) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw txnError;
    }
    
    const result = {
      success: true,
      message: `Successfully imported ${successCount} supplies. ${errorCount > 0 ? `Failed to import ${errorCount} supplies.` : ''}`,
      data: { imported: successCount, failed: errorCount }
    };
    
    console.log("Import complete with result:", result);
    
    // Respond with a plain text message to avoid JSON parsing issues
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(result));
  } catch (error) {
    console.error('DIRECT IMPORT: Error importing supplies:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to import supplies: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

export default router;