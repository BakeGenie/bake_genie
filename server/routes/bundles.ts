import { Router, Response } from "express";
import { db } from "../db";
import { bundleItems, productBundles, products } from "@shared/schema";
import { and, eq } from "drizzle-orm";

// Extend the Request type to include session
interface AuthRequest extends Express.Request {
  session: {
    userId: number;
    [key: string]: any;
  };
}

export const router = Router();

/**
 * Get all bundles for the current user
 */
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const bundles = await db.query.productBundles.findMany({
      where: eq(productBundles.userId, userId),
      with: {
        items: {
          columns: {},
          with: {
            product: true
          }
        }
      }
    });
    
    res.json(bundles);
  } catch (error) {
    console.error("Error getting bundles:", error);
    res.status(500).json({ error: "Failed to get bundles" });
  }
});

/**
 * Get a bundle by ID
 */
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const bundleId = parseInt(req.params.id);
    
    const bundle = await db.query.productBundles.findFirst({
      where: and(
        eq(productBundles.id, bundleId),
        eq(productBundles.userId, userId)
      ),
      with: {
        items: {
          columns: {},
          with: {
            product: true
          }
        }
      }
    });
    
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    
    res.json(bundle);
  } catch (error) {
    console.error("Error getting bundle:", error);
    res.status(500).json({ error: "Failed to get bundle" });
  }
});

/**
 * Create a new bundle
 */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const { name, description, totalCost, items } = req.body;
    
    console.log("Creating new bundle with data:", JSON.stringify(req.body, null, 2));
    console.log("Current user ID from session:", userId);
    
    // Create the bundle
    const bundleData = {
      userId,
      name,
      description,
      price: req.body.price || null,
      category: req.body.category || null,
      totalCost: req.body.totalCost || null
    };
    
    console.log("Bundle data being inserted:", bundleData);
    
    const [bundle] = await db
      .insert(productBundles)
      .values(bundleData)
      .returning();
    
    console.log("Bundle created successfully:", bundle);
    
    // Create the bundle items
    if (items && items.length > 0) {
      console.log("Adding bundle items:", items);
      
      const bundleItemsToInsert = items.map((item: any) => ({
        bundleId: bundle.id,
        productId: item.productId,
        quantity: item.quantity
      }));
      
      console.log("Bundle items being inserted:", bundleItemsToInsert);
      
      await db.insert(bundleItems).values(bundleItemsToInsert);
      console.log("Bundle items added successfully");
    }
    
    res.status(201).json(bundle);
  } catch (error) {
    console.error("Error creating bundle:", error);
    res.status(500).json({ error: "Failed to create bundle", details: String(error) });
  }
});

/**
 * Update a bundle
 */
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const bundleId = parseInt(req.params.id);
    const { name, description, totalCost, items } = req.body;
    
    // Update the bundle
    const [bundle] = await db
      .update(productBundles)
      .set({
        name,
        description,
        price: req.body.price || null,
        category: req.body.category || null,
        totalCost: req.body.totalCost || null
      })
      .where(
        and(
          eq(productBundles.id, bundleId),
          eq(productBundles.userId, userId)
        )
      )
      .returning();
    
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    
    // Delete existing bundle items
    await db
      .delete(bundleItems)
      .where(eq(bundleItems.bundleId, bundleId));
    
    // Create new bundle items
    if (items && items.length > 0) {
      const bundleItemsToInsert = items.map((item: any) => ({
        bundleId: bundle.id,
        productId: item.productId,
        quantity: item.quantity
      }));
      
      await db.insert(bundleItems).values(bundleItemsToInsert);
    }
    
    res.json(bundle);
  } catch (error) {
    console.error("Error updating bundle:", error);
    res.status(500).json({ error: "Failed to update bundle" });
  }
});

/**
 * Delete a bundle
 */
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const bundleId = parseInt(req.params.id);
    
    // Delete bundle items first (cascade)
    await db
      .delete(bundleItems)
      .where(eq(bundleItems.bundleId, bundleId));
    
    // Delete the bundle
    const [bundle] = await db
      .delete(productBundles)
      .where(
        and(
          eq(productBundles.id, bundleId),
          eq(productBundles.userId, userId)
        )
      )
      .returning();
    
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting bundle:", error);
    res.status(500).json({ error: "Failed to delete bundle" });
  }
});