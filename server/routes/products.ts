import { Router, Request, Response } from "express";
import { db, pool } from "../db";
import { products, type InsertProduct } from "@shared/schema";
import { eq } from "drizzle-orm";

export const router = Router();

/**
 * Get all products for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Get all products for the current user
    const productsList = await db.select().from(products).where(eq(products.userId, userId));
    
    return res.json(productsList);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch products" 
    });
  }
});

/**
 * Get a specific product by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid product ID" 
      });
    }
    
    // Get the product
    const [product] = await db.select().from(products).where(
      eq(products.id, productId)
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }
    
    return res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch product" 
    });
  }
});

/**
 * Create a new product
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Creating product with data:", JSON.stringify(req.body, null, 2));
    
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Ensure required fields
    if (!req.body.name || !req.body.type) {
      return res.status(400).json({ 
        success: false, 
        error: "Product name and type are required" 
      });
    }
    
    try {
      // Use a simplified direct query that works with our DB
      console.log("Starting product insert with SQL...");
      const result = await pool.query(`
        INSERT INTO products (
          user_id, name, type, description, price, cost, 
          tax_rate, labor_hours, labor_rate, overhead, image_url, 
          active, created_at, servings, sku, bundle_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 
          $7, $8, $9, $10, $11,
          $12, NOW(), $13, $14, $15
        ) RETURNING *
      `, [
        userId, 
        req.body.name, 
        req.body.type,
        req.body.description || null,
        req.body.price ? req.body.price.toString() : "0",
        req.body.cost ? req.body.cost.toString() : null,
        req.body.taxRate ? req.body.taxRate.toString() : "0",
        req.body.laborHours ? req.body.laborHours.toString() : "0",
        req.body.laborRate ? req.body.laborRate.toString() : "0",
        req.body.overhead ? req.body.overhead.toString() : "0",
        req.body.imageUrl || null,
        req.body.active !== undefined ? req.body.active : true,
        req.body.servings ? parseInt(req.body.servings.toString()) : null,
        req.body.sku || null,
        req.body.bundleId || null
      ]);
      
      // Make sure we have the product in the result
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Insert query did not return the created product');
      }
      
      console.log("Product created successfully:", result.rows[0]);
      
      // Return just the product directly instead of nested in an object
      return res.status(201).json(result.rows[0]);
    } catch (dbError) {
      console.error("Database error creating product:", dbError);
      console.error("Error details:", (dbError as any).detail, (dbError as any).code);
      return res.status(500).json({
        success: false,
        error: "Database error creating product",
        details: (dbError as Error).message
      });
    }
  } catch (error) {
    console.error("Error in product creation:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create product",
      details: (error as Error).message
    });
  }
});

/**
 * Update a product
 */
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid product ID" 
      });
    }
    
    // Prepare update data with proper type conversion
    const updateData: Partial<InsertProduct> = {};
    
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.type !== undefined) updateData.type = req.body.type;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.servings !== undefined) updateData.servings = parseInt(req.body.servings);
    if (req.body.price !== undefined) updateData.price = req.body.price.toString();
    if (req.body.cost !== undefined) updateData.cost = req.body.cost.toString();
    if (req.body.taxRate !== undefined) updateData.taxRate = req.body.taxRate.toString();
    if (req.body.laborHours !== undefined) updateData.laborHours = req.body.laborHours.toString();
    if (req.body.laborRate !== undefined) updateData.laborRate = req.body.laborRate.toString();
    if (req.body.overhead !== undefined) updateData.overhead = req.body.overhead.toString();
    if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
    if (req.body.sku !== undefined) updateData.sku = req.body.sku;
    if (req.body.bundleId !== undefined) updateData.bundleId = req.body.bundleId;
    if (req.body.active !== undefined) updateData.active = req.body.active;
    
    // Update the product
    const [updatedProduct] = await db.update(products)
      .set(updateData)
      .where(
        eq(products.id, productId)
      )
      .returning();
    
    if (!updatedProduct) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }
    
    return res.json({ 
      success: true, 
      product: updatedProduct 
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to update product" 
    });
  }
});

/**
 * Delete a product
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const productId = parseInt(req.params.id);
    
    if (isNaN(productId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid product ID" 
      });
    }
    
    // Delete the product
    await db.delete(products).where(
      eq(products.id, productId)
    );
    
    return res.json({ 
      success: true, 
      message: "Product deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to delete product" 
    });
  }
});