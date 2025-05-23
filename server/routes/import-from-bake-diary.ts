import { Router, Request, Response } from "express";
import multer from "multer";
import { csvImportService } from "../services/import-csv";
import fs from "fs";
import path from "path";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });
export const router = Router();

/**
 * Import data from Bake Diary CSV export
 */
router.post("/import-csv", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    if (!req.session.userId) {
      fs.unlinkSync(req.file.path);
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    console.log(`Importing from Bake Diary CSV: ${req.file.originalname}`);

    // Read the file content
    const fileData = fs.readFileSync(req.file.path);
    
    try {
      // Parse CSV data
      const csvData = await csvImportService.parseCSVFile(fileData);
      
      // Identify the type of CSV file
      const csvType = csvImportService.identifyCsvType(csvData);
      console.log(`Identified CSV type: ${csvType}`);
      
      let result;
      
      // Process based on CSV type
      switch (csvType) {
        case 'orders':
          result = await csvImportService.importBakeGenieOrders(csvData, req.session.userId);
          break;
        case 'quotes':
          result = await csvImportService.importBakeGenieQuotes(csvData, req.session.userId);
          break;
        case 'orderItems':
          result = await csvImportService.importBakeGenieOrderItems(csvData, req.session.userId);
          break;
        default:
          throw new Error(`Unknown CSV format. Please ensure this is a valid BakeGenie export file.`);
      }
      
      // Clean up - delete the uploaded file
      fs.unlinkSync(req.file.path);
      
      return res.json({
        success: result.success,
        message: result.message
      });
    } catch (csvError) {
      console.error("CSV processing error:", csvError);
      
      // Clean up uploaded file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        error: `CSV processing error: ${(csvError as Error).message}`
      });
    }
  } catch (error) {
    console.error("Error importing from BakeGenie:", error);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      error: `Error importing BakeGenie data: ${(error as Error).message}` 
    });
  }
});