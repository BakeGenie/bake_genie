import { Router, Request as ExpressRequest, Response } from "express";
import { importService } from "../services/import-service";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { AuthRequest } from "../middleware/auth";
import { Session } from "express-session";

// Define custom request type with session
interface Request extends ExpressRequest {
  session: Session & {
    user?: {
      id: number;
      [key: string]: any;
    };
  };
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (path.extname(file.originalname).toLowerCase() === ".csv") {
      return cb(null, true);
    }
    cb(new Error("Only CSV files are allowed"));
  },
});

export const registerImportRoutes = (router: Router) => {
  /**
   * @route POST /api/import/orders
   * @desc Import orders from Bake Diary CSV
   * @access Private
   */
  router.post("/api/import/orders", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Check if user session exists
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      const userId = req.session.user.id;
      const result = await importService.importOrderList(req.file.path, userId);
      return res.json(result);
    } catch (error) {
      console.error("Error importing orders:", error);
      return res.status(500).json({
        success: false,
        message: `Error importing orders: ${error}`,
      });
    }
  });

  /**
   * @route POST /api/import/quotes
   * @desc Import quotes from Bake Diary CSV
   * @access Private
   */
  router.post("/api/import/quotes", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Check if user session exists
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      const userId = req.session.user.id;
      const result = await importService.importQuoteList(req.file.path, userId);
      return res.json(result);
    } catch (error) {
      console.error("Error importing quotes:", error);
      return res.status(500).json({
        success: false,
        message: `Error importing quotes: ${error}`,
      });
    }
  });

  /**
   * @route POST /api/import/order-items
   * @desc Import order items from Bake Diary CSV
   * @access Private
   */
  router.post("/api/import/order-items", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Check if user session exists
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }

      const userId = req.session.user.id;
      const result = await importService.importOrderItems(req.file.path, userId);
      return res.json(result);
    } catch (error) {
      console.error("Error importing order items:", error);
      return res.status(500).json({
        success: false,
        message: `Error importing order items: ${error}`,
      });
    }
  });
};