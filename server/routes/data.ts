import { Router, Request, Response } from 'express';
import { exportService } from '../services/export';
import { importService, ImportData } from '../services/import';
import { z } from 'zod';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Create router
export const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_, file, cb) => {
    // Accept only JSON files
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  },
});

// Validation schema for import options
const importOptionsSchema = z.object({
  replaceExisting: z.boolean().optional().default(false),
  importContacts: z.boolean().optional().default(true),
  importOrders: z.boolean().optional().default(true),
  importRecipes: z.boolean().optional().default(true),
  importProducts: z.boolean().optional().default(true),
  importFinancials: z.boolean().optional().default(true),
  importTasks: z.boolean().optional().default(true),
  importEnquiries: z.boolean().optional().default(true),
  importSettings: z.boolean().optional().default(true),
});

/**
 * Export all data for the current user
 */
router.get('/export', async (req: Request, res: Response) => {
  try {
    // In a real app, get the user ID from the session
    const userId = req.session?.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const data = await exportService.exportAllData(userId);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cakehub-export-${new Date().toISOString().slice(0, 10)}.json"`);
    
    return res.json({
      success: true,
      data,
      exportDate: new Date().toISOString(),
      version: '1.0',
      sourceSystem: 'CakeHub'
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during export' 
    });
  }
});

/**
 * Export specific data type for the current user
 */
router.get('/export/:dataType', async (req: Request, res: Response) => {
  try {
    // In a real app, get the user ID from the session
    const userId = req.session?.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const { dataType } = req.params;
    let data: any = null;
    
    // Call appropriate export method based on data type
    switch (dataType) {
      case 'orders':
        data = await exportService.exportOrders(userId);
        break;
      case 'contacts':
        data = await exportService.exportContacts(userId);
        break;
      case 'recipes':
        data = await exportService.exportRecipes(userId);
        break;
      case 'products':
        data = await exportService.exportProducts(userId);
        break;
      case 'financials':
        data = await exportService.exportFinancials(userId);
        break;
      case 'tasks':
        data = await exportService.exportTasks(userId);
        break;
      case 'enquiries':
        data = await exportService.exportEnquiries(userId);
        break;
      case 'settings':
        data = await exportService.exportSettings(userId);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Invalid data type: ${dataType}` 
        });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cakehub-${dataType}-${new Date().toISOString().slice(0, 10)}.json"`);
    
    return res.json({
      success: true,
      data,
      exportDate: new Date().toISOString(),
      dataType,
      version: '1.0',
      sourceSystem: 'CakeHub'
    });
  } catch (error) {
    console.error(`Error exporting ${req.params.dataType}:`, error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during export' 
    });
  }
});

/**
 * Import data from JSON file upload
 */
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // In a real app, get the user ID from the session
    const userId = req.session?.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    // Get import options
    const options = importOptionsSchema.parse(req.body);
    
    // Read and parse uploaded file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let importData: ImportData;
    
    try {
      importData = JSON.parse(fileContent);
      
      // Apply import filters based on options
      if (!options.importContacts) {
        delete importData.contacts;
      }
      if (!options.importOrders) {
        delete importData.orders;
      }
      if (!options.importRecipes) {
        delete importData.recipes;
      }
      if (!options.importProducts) {
        delete importData.products;
      }
      if (!options.importFinancials) {
        delete importData.financials;
      }
      if (!options.importTasks) {
        delete importData.tasks;
      }
      if (!options.importEnquiries) {
        delete importData.enquiries;
      }
      if (!options.importSettings) {
        delete importData.settings;
      }
      
    } catch (error) {
      // Clean up file
      fs.unlinkSync(filePath);
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON file' 
      });
    }
    
    // Process import
    const result = await importService.importAllData(userId, importData);
    
    // Clean up file
    fs.unlinkSync(filePath);
    
    return res.json({
      success: true,
      result,
      importDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error importing data:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting temporary file:', e);
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during import' 
    });
  }
});

/**
 * Import data from JSON in request body
 */
router.post('/import/json', async (req: Request, res: Response) => {
  try {
    // In a real app, get the user ID from the session
    const userId = req.session?.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Get import data from request body
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing or invalid import data' 
      });
    }
    
    // Get import options
    const options = importOptionsSchema.parse(req.body.options || {});
    let importData: ImportData = data;
    
    // Apply import filters based on options
    if (!options.importContacts) {
      delete importData.contacts;
    }
    if (!options.importOrders) {
      delete importData.orders;
    }
    if (!options.importRecipes) {
      delete importData.recipes;
    }
    if (!options.importProducts) {
      delete importData.products;
    }
    if (!options.importFinancials) {
      delete importData.financials;
    }
    if (!options.importTasks) {
      delete importData.tasks;
    }
    if (!options.importEnquiries) {
      delete importData.enquiries;
    }
    if (!options.importSettings) {
      delete importData.settings;
    }
    
    // Process import
    const result = await importService.importAllData(userId, importData);
    
    return res.json({
      success: true,
      result,
      importDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during import'
    });
  }
});

/**
 * Import from Cake Diary data format
 * Special endpoint specifically for importing from the legacy Cake Diary format
 */
router.post('/import/cake-diary', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // In a real app, get the user ID from the session
    const userId = req.session?.userId || 1; // Default to userId 1 for development
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    // Read and parse uploaded file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let cakeDiaryData: any;
    
    try {
      cakeDiaryData = JSON.parse(fileContent);
    } catch (error) {
      // Clean up file
      fs.unlinkSync(filePath);
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON file' 
      });
    }
    
    // Transform Cake Diary format to CakeHub format
    const importData = transformCakeDiaryData(cakeDiaryData);
    
    // Process import
    const result = await importService.importAllData(userId, importData);
    
    // Clean up file
    fs.unlinkSync(filePath);
    
    return res.json({
      success: true,
      result,
      importDate: new Date().toISOString(),
      sourceSystem: 'Cake Diary'
    });
  } catch (error) {
    console.error('Error importing from Cake Diary:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting temporary file:', e);
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An error occurred during import' 
    });
  }
});

/**
 * Transform Cake Diary data format to CakeHub format
 */
function transformCakeDiaryData(cakeDiaryData: any): ImportData {
  // This function would contain all the mapping logic to transform
  // from the Cake Diary data format to the CakeHub format
  
  const transformedData: ImportData = {
    contacts: [],
    orders: [],
    recipes: [],
    products: [],
    financials: {
      expenses: [],
      income: []
    },
    tasks: [],
    enquiries: [],
    settings: {},
    sourceSystem: 'Cake Diary'
  };
  
  // Transform contacts
  if (cakeDiaryData.customers && Array.isArray(cakeDiaryData.customers)) {
    transformedData.contacts = cakeDiaryData.customers.map((customer: any) => ({
      id: customer.id,
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      email: customer.email || null,
      phone: customer.phone || null,
      company: customer.company || null,
      address: customer.address ? `${customer.address.line1 || ''} ${customer.address.line2 || ''}`.trim() : null,
      city: customer.address?.city || null,
      state: customer.address?.state || null,
      zip: customer.address?.postcode || null,
      country: customer.address?.country || null,
      notes: customer.notes || null
    }));
  }
  
  // Transform orders
  if (cakeDiaryData.orders && Array.isArray(cakeDiaryData.orders)) {
    transformedData.orders = cakeDiaryData.orders.map((order: any) => {
      // Transform order items
      const items = (order.items || []).map((item: any) => ({
        type: item.type || 'Other',
        name: item.name || '',
        description: item.description || null,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        price: (item.price * item.quantity) || 0,
        notes: item.notes || null
      }));
      
      return {
        id: order.id,
        orderNumber: order.order_number || `ORD-${Date.now()}`,
        contactId: order.customer_id || null,
        eventType: mapEventType(order.event_type || ''),
        eventDate: order.event_date || new Date().toISOString(),
        status: mapOrderStatus(order.status || ''),
        theme: order.theme || null,
        deliveryType: order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery',
        deliveryDetails: order.delivery_details || null,
        discount: order.discount || 0,
        discountType: order.discount_type || '%',
        setupFee: order.setup_fee || 0,
        taxRate: order.tax_rate || 0,
        total: order.total || 0,
        notes: order.notes || null,
        jobSheetNotes: order.job_sheet_notes || null,
        imageUrls: Array.isArray(order.images) ? order.images.map((img: any) => img.url) : [],
        items
      };
    });
  }
  
  // Transform recipes
  if (cakeDiaryData.recipes && Array.isArray(cakeDiaryData.recipes)) {
    transformedData.recipes = cakeDiaryData.recipes.map((recipe: any) => {
      // Transform recipe ingredients
      const ingredients = (recipe.ingredients || []).map((ing: any) => ({
        quantity: ing.quantity || 0,
        notes: ing.notes || null,
        ingredient: {
          id: ing.ingredient_id,
          name: ing.ingredient_name || '',
          unit: ing.unit || 'unit',
          unitCost: ing.unit_cost || null,
          packSize: ing.pack_size || null,
          packCost: ing.pack_cost || null
        }
      }));
      
      return {
        id: recipe.id,
        name: recipe.name || '',
        description: recipe.description || null,
        servings: recipe.servings || 1,
        instructions: recipe.instructions || null,
        totalCost: recipe.total_cost || null,
        prepTime: recipe.prep_time || null,
        cookTime: recipe.cook_time || null,
        imageUrl: recipe.image_url || null,
        category: recipe.category || null,
        ingredients
      };
    });
  }
  
  // Transform products
  if (cakeDiaryData.products && Array.isArray(cakeDiaryData.products)) {
    transformedData.products = cakeDiaryData.products.map((product: any) => ({
      id: product.id,
      type: product.type || 'Other',
      name: product.name || '',
      description: product.description || null,
      servings: product.servings || null,
      price: product.price || 0,
      cost: product.cost || null,
      taxRate: product.tax_rate || 0,
      laborHours: product.labor_hours || 0,
      laborRate: product.labor_rate || 0,
      overhead: product.overhead || 0,
      imageUrl: product.image_url || null,
      active: product.active !== false
    }));
  }
  
  // Transform financials
  if (cakeDiaryData.expenses && Array.isArray(cakeDiaryData.expenses)) {
    transformedData.financials.expenses = cakeDiaryData.expenses.map((expense: any) => ({
      id: expense.id,
      category: expense.category || 'Other',
      amount: expense.amount || 0,
      date: expense.date || new Date().toISOString(),
      description: expense.description || null,
      receiptUrl: expense.receipt_url || null,
      taxDeductible: expense.tax_deductible === true
    }));
  }
  
  if (cakeDiaryData.income && Array.isArray(cakeDiaryData.income)) {
    transformedData.financials.income = cakeDiaryData.income.map((income: any) => ({
      id: income.id,
      category: income.category || 'Other',
      amount: income.amount || 0,
      date: income.date || new Date().toISOString(),
      description: income.description || null
    }));
  }
  
  // Transform tasks
  if (cakeDiaryData.tasks && Array.isArray(cakeDiaryData.tasks)) {
    transformedData.tasks = cakeDiaryData.tasks.map((task: any) => ({
      id: task.id,
      orderId: task.order_id || null,
      title: task.title || '',
      description: task.description || null,
      dueDate: task.due_date || null,
      completed: task.completed === true,
      priority: task.priority || 'Medium'
    }));
  }
  
  // Transform enquiries
  if (cakeDiaryData.enquiries && Array.isArray(cakeDiaryData.enquiries)) {
    transformedData.enquiries = cakeDiaryData.enquiries.map((enquiry: any) => ({
      id: enquiry.id,
      name: enquiry.name || '',
      email: enquiry.email || '',
      phone: enquiry.phone || null,
      eventType: mapEventType(enquiry.event_type || ''),
      eventDate: enquiry.event_date || null,
      message: enquiry.message || '',
      status: mapEnquiryStatus(enquiry.status || '')
    }));
  }
  
  // Transform settings
  if (cakeDiaryData.settings) {
    transformedData.settings = {
      currency: cakeDiaryData.settings.currency || 'USD',
      defaultTaxRate: cakeDiaryData.settings.default_tax_rate || 0,
      businessHours: cakeDiaryData.settings.business_hours || null,
      invoiceFooter: cakeDiaryData.settings.invoice_footer || null,
      quoteFooter: cakeDiaryData.settings.quote_footer || null,
      orderNumberPrefix: cakeDiaryData.settings.order_number_prefix || '',
      quoteNumberPrefix: cakeDiaryData.settings.quote_number_prefix || '',
      laborRate: cakeDiaryData.settings.labor_rate || 0
    };
  }
  
  return transformedData;
}

/**
 * Map Cake Diary event type to CakeHub event type
 */
function mapEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    'birthday': 'Birthday',
    'wedding': 'Wedding',
    'corporate': 'Corporate',
    'anniversary': 'Anniversary',
    'baby_shower': 'Baby Shower',
    'gender_reveal': 'Gender Reveal',
    'christening': 'Christening',
    'hen_party': 'Hen/Stag',
    'stag_party': 'Hen/Stag',
  };
  
  return mapping[eventType.toLowerCase()] || 'Other';
}

/**
 * Map Cake Diary order status to CakeHub order status
 */
function mapOrderStatus(status: string): string {
  const mapping: Record<string, string> = {
    'draft': 'Quote',
    'quote': 'Quote',
    'confirmed': 'Confirmed',
    'paid': 'Paid',
    'ready': 'Ready',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  
  return mapping[status.toLowerCase()] || 'Quote';
}

/**
 * Map Cake Diary enquiry status to CakeHub enquiry status
 */
function mapEnquiryStatus(status: string): string {
  const mapping: Record<string, string> = {
    'new': 'New',
    'pending': 'New',
    'contacted': 'Contacted',
    'converted': 'Converted',
    'lost': 'Lost'
  };
  
  return mapping[status.toLowerCase()] || 'New';
}