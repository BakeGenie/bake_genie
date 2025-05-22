import express from "express";
import { pool } from "../db";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter to only allow certain file types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WEBP files are allowed."));
  }
};

// Configure upload limits (3MB as requested by user)
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter,
});

const router = express.Router();

// GET all products
router.get("/products", async (req, res) => {
  try {
    // Get the user ID from the session
    const userId = req.session?.user?.id || 1; // Default to 1 for testing

    const result = await pool.query(`
      SELECT * FROM products
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      error: "Failed to fetch products",
      details: (error as Error).message
    });
  }
});

// GET a specific product
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id || 1; // Default to 1 for testing

    const result = await pool.query(`
      SELECT * FROM products
      WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      error: "Failed to fetch product",
      details: (error as Error).message
    });
  }
});

// File upload endpoint
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    console.log("File uploaded successfully:", imageUrl);
    
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return res.status(500).json({
      error: "Failed to upload file",
      details: (error as Error).message
    });
  }
});

// CREATE a new product
router.post("/products", async (req, res) => {
  try {
    const userId = req.session?.user?.id || 1; // Default to 1 for testing
    console.log("Creating product with data:", req.body);

    // Create a new product
    const result = await pool.query(`
      INSERT INTO products (
        user_id, name, type, description, price, cost, 
        tax_rate, labor_hours, labor_rate, overhead, 
        image_url, active, created_at, servings, sku
      ) VALUES (
        $1, $2, $3, $4, $5, $6, 
        $7, $8, $9, $10, 
        $11, $12, NOW(), $13, $14
      ) RETURNING *
    `, [
      userId, 
      req.body.name, 
      req.body.type || null,
      req.body.description || null,
      req.body.price || "0",
      req.body.cost || null,
      req.body.taxRate || "0",
      req.body.laborHours || "0",
      req.body.laborRate || "0",
      req.body.overhead || "0",
      req.body.imageUrl || null,
      req.body.active !== undefined ? req.body.active : true,
      req.body.servings || null,
      req.body.sku || null
    ]);

    console.log("Product created successfully:", result.rows[0]);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      error: "Failed to create product",
      details: (error as Error).message
    });
  }
});

// UPDATE a product
router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id || 1; // Default to 1 for testing

    // Update the product
    const result = await pool.query(`
      UPDATE products SET
        name = $1,
        type = $2,
        description = $3,
        price = $4,
        cost = $5,
        tax_rate = $6,
        labor_hours = $7,
        labor_rate = $8,
        overhead = $9,
        image_url = $10,
        active = $11,
        servings = $12,
        sku = $13
      WHERE id = $14 AND user_id = $15
      RETURNING *
    `, [
      req.body.name,
      req.body.type || null,
      req.body.description || null,
      req.body.price || "0",
      req.body.cost || null,
      req.body.taxRate || "0",
      req.body.laborHours || "0",
      req.body.laborRate || "0",
      req.body.overhead || "0",
      req.body.imageUrl || null,
      req.body.active !== undefined ? req.body.active : true,
      req.body.servings || null,
      req.body.sku || null,
      id,
      userId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      error: "Failed to update product",
      details: (error as Error).message
    });
  }
});

// DELETE a product
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.user?.id || 1; // Default to 1 for testing

    const result = await pool.query(`
      DELETE FROM products
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      error: "Failed to delete product",
      details: (error as Error).message
    });
  }
});

export default router;