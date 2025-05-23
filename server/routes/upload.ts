import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up upload directory
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Create multer upload instance with file size limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept image files and PDFs
    const filetypes = /jpeg|jpg|png|gif|svg|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("Only image files and PDFs are allowed"));
  },
});

export const router = Router();

/**
 * Upload product image
 */
router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    
    // Get the saved file path and construct the URL
    const filename = req.file.filename;
    const imageUrl = `/uploads/${filename}`;
    
    // Return the image URL
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
});

/**
 * Upload expense receipt
 */
router.post("/receipt", upload.single("receipt"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No receipt file provided" });
    }
    
    // Get the saved file path and construct the URL
    const filename = req.file.filename;
    const receiptUrl = `/uploads/${filename}`;
    
    // Return the receipt URL
    return res.status(200).json({ 
      success: true,
      url: receiptUrl,
      filename: filename
    });
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to upload receipt" 
    });
  }
});

export default router;