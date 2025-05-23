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
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    try {
      // Accept image files and PDFs
      const filetypes = /jpeg|jpg|png|gif|svg|pdf/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = file.originalname 
        ? filetypes.test(path.extname(file.originalname).toLowerCase()) 
        : false;
      
      // Log the file info for debugging
      console.log('Uploading file:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        mimetypeMatch: mimetype,
        extnameMatch: extname
      });
      
      if (mimetype && extname) {
        return cb(null, true);
      }
      
      cb(null, false); // Don't throw an error, just reject the file silently
    } catch (error) {
      console.error('Error in file filter:', error);
      cb(null, false);
    }
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
router.post("/receipt", upload.single("receipt"), (req: Request, res: Response) => {
  try {
    console.log("Receipt upload request received");
    
    if (!req.file) {
      console.log("No file provided in the request");
      return res.set({
        'Content-Type': 'application/json'
      }).status(400).send(JSON.stringify({ 
        success: false,
        error: "No receipt file provided" 
      }));
    }
    
    // Get the saved file path and construct the URL
    const filename = req.file.filename;
    const receiptUrl = `/uploads/${filename}`;
    
    // Verify file was created
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found in storage: ${filePath}`);
      return res.set({
        'Content-Type': 'application/json'
      }).status(500).send(JSON.stringify({
        success: false,
        error: "File uploaded but not found in storage"
      }));
    }
    
    console.log(`Successfully uploaded receipt: ${filename} (${req.file.size} bytes)`);
    
    // Return the receipt URL with proper content type
    const responseData = {
      success: true,
      url: receiptUrl,
      filename: filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    };
    
    console.log("Sending successful response:", responseData);
    
    return res.set({
      'Content-Type': 'application/json'
    }).status(200).send(JSON.stringify(responseData));
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return res.set({
      'Content-Type': 'application/json'
    }).status(500).send(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload receipt" 
    }));
  }
});

export default router;