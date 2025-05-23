import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isAuthenticated } from '../middleware/auth';
import { importService } from '../services/import-service';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log(`Upload directory: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Set unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    console.log(`Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage instead of disk storage
const memoryStorage = multer.memoryStorage();

// Initialize multer upload middleware
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    // Allow CSV files only
    if (path.extname(file.originalname).toLowerCase() === '.csv') {
      console.log(`Accepting file: ${file.originalname}`);
      return cb(null, true);
    }
    cb(new Error('Only CSV files are allowed'));
  }
});

export const registerDataImportRoutes = (router: Router) => {
  /**
   * @route POST /api/data/import
   * @desc Import data from CSV file
   * @access Private
   */
  router.post('/api/data/import', upload.single('file'), async (req: Request, res: Response) => {
    try {
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request file:', req.file ? 'File present' : 'No file');
      
      // Check if file exists
      if (!req.file) {
        console.log('No file in request');
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }
      
      // Get user ID from session
      const userId = req.session?.user?.id || 1; // Fallback to default user if not authenticated

      console.log(`File received: ${req.file.originalname}, size: ${req.file.size} bytes`);
      
      // Get import type and mappings from request body
      const importType = req.body.type;
      let mappings = {};
      
      try {
        if (req.body.mappings) {
          mappings = JSON.parse(req.body.mappings);
          console.log('Using mappings:', mappings);
        }
      } catch (e) {
        console.error('Error parsing mappings:', e);
        return res.status(400).json({ success: false, error: 'Invalid mappings format' });
      }
      
      let result;
      
      // Special case for contacts import - direct memory processing
      if (importType === 'contacts') {
        const { parseBakeDiaryContacts } = require('../services/csv-parser');
        // The file is in memory with multer.memoryStorage
        const csvContent = req.file.buffer.toString('utf8');
        result = await parseBakeDiaryContacts(csvContent, userId);
      } else {
        // For other imports, save to disk first
        const tempFilePath = path.join(uploadDir, `${Date.now()}-${req.file.originalname}`);
        fs.writeFileSync(tempFilePath, req.file.buffer);
        console.log(`Saved temp file to ${tempFilePath}`);
        
        // Call the appropriate import method based on the import type
        switch (importType) {
          case 'orders':
            result = await importService.importOrders(tempFilePath, userId, mappings);
            break;
          case 'order_items':
            result = await importService.importOrderItems(tempFilePath, userId, mappings);
            break;
          case 'quotes':
            result = await importService.importQuotes(tempFilePath, userId, mappings);
            break;
          case 'expenses':
            result = await importService.importExpenses(tempFilePath, userId, mappings);
            break;
          case 'ingredients':
            result = await importService.importIngredients(tempFilePath, userId, mappings);
            break;
          case 'recipes':
            result = await importService.importRecipes(tempFilePath, userId, mappings);
            break;
          case 'supplies':
            result = await importService.importSupplies(tempFilePath, userId, mappings);
            break;
          default:
            return res.status(400).json({ 
              success: false, 
              error: `Unsupported import type: ${importType}` 
            });
        }
        
        // Clean up: delete temporary file after processing
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
      
      return res.json(result);
    } catch (error) {
      console.error('Error during import:', error);
      
      // Clean up: delete uploaded file if there was an error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json({
        success: false,
        error: `Error importing data: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
  
  /**
   * @route GET /api/data/import/fields
   * @desc Get available field mappings for different import types
   * @access Private
   */
  router.get('/api/data/import/fields', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const importType = req.query.type as string;
      
      if (!importType) {
        return res.status(400).json({ success: false, error: 'Import type is required' });
      }
      
      // Define available fields for each import type
      const fieldMappings: Record<string, string[]> = {
        contacts: [
          'first_name',
          'last_name',
          'email',
          'phone',
          'type',
          'company',
          'address',
          'city',
          'state',
          'postal_code',
          'country',
          'notes'
        ],
        orders: [
          'order_number',
          'customer_name',
          'order_date',
          'delivery_date',
          'status',
          'total',
          'balance_due',
          'delivery_address',
          'notes',
          'payment_method'
        ],
        order_items: [
          'order_id',
          'product_name',
          'quantity',
          'unit_price',
          'discount',
          'notes'
        ],
        quotes: [
          'quote_number',
          'customer_name',
          'event_date',
          'created_date',
          'status',
          'total',
          'notes',
          'expiry_date'
        ],
        expenses: [
          'date',
          'category',
          'amount',
          'description',
          'payment_source',
          'supplier',
          'vat',
          'total_inc_tax',
          'tax_deductible',
          'is_recurring',
          'receipt_url'
        ],
        ingredients: [
          'name',
          'category',
          'unit',
          'cost_per_unit',
          'stock_level',
          'reorder_point',
          'supplier',
          'notes'
        ],
        recipes: [
          'name',
          'category',
          'description',
          'serving_size',
          'prep_time',
          'cook_time',
          'notes'
        ],
        supplies: [
          'name',
          'category',
          'unit',
          'cost_per_unit',
          'stock_level',
          'reorder_point',
          'supplier',
          'notes'
        ]
      };
      
      if (!fieldMappings[importType]) {
        return res.status(400).json({ success: false, error: `Unknown import type: ${importType}` });
      }
      
      return res.json({
        success: true,
        fields: fieldMappings[importType]
      });
    } catch (error) {
      console.error('Error fetching field mappings:', error);
      return res.status(500).json({
        success: false,
        error: `Error fetching field mappings: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
};