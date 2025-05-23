import { Router, Request, Response } from "express";
import multer from "multer";
import { importService } from "../services/import";
import { csvImportService } from "../services/import-csv";
import { exportService } from "../services/export";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { stringify } from "csv-stringify/sync";
import { db } from "../db";

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
 * Export all data for the current user
 */
router.get("/export", async (req: Request, res: Response) => {
  try {
    // Use a mock user ID until authentication is implemented
    const userId = 1;
    
    const data = await exportService.exportAllData(userId);
    
    res.json(data);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to export data" 
    });
  }
});

/**
 * Export specific data type for the current user
 */
// CSV Export endpoint
router.get("/export/:dataType", async (req: Request, res: Response) => {
  try {
    // Use user ID from session
    const userId = req.session?.userId || 1;
    const dataType = req.params.dataType;
    const format = req.query.format || 'csv'; // Default to CSV format as requested
    
    if (format === 'csv') {
      // CSV export
      let csvData: string = '';
      let filename: string = '';
      
      // Create fallback empty CSV headers for each type in case of errors
      const fallbackHeaders = {
        orders: "Order Number,Status,Event Type,Event Date,Customer Name,Delivery Type,Delivery Details,Total\n",
        contacts: "First Name,Last Name,Email,Phone,Business Name,Address,Notes\n",
        tasks: "Title,Description,Due Date,Priority,Completed\n",
        enquiries: "Name,Email,Phone,Event Type,Event Date,Budget,Details,Status\n",
        recipes: "Name,Description,Category,Preparation Time,Cooking Time,Servings\n",
        products: "Name,Description,Price,Category,Image URL\n",
        financials: "Date,Type,Category,Amount,Description,Payment Method\n"
      };
      
      try {
        switch(dataType) {
          case "orders":
            // Directly use SQL to avoid schema issues with Drizzle
            try {
              const result = await db.execute(`
                SELECT o.id, o.order_number, o.status, o.event_type, o.event_date, 
                       o.delivery_type, o.delivery_details, o.total, o.notes,
                       c.first_name, c.last_name, c.email, c.phone  
                FROM orders o
                LEFT JOIN contacts c ON o.contact_id = c.id
                WHERE o.user_id = $1
              `, [userId]);
              
              // Process results
              const orderRows = result.rows.map(row => ({
                'Order Number': row.order_number || '',
                'Status': row.status || '',
                'Event Type': row.event_type || '',
                'Event Date': row.event_date ? format(new Date(row.event_date), 'yyyy-MM-dd') : '',
                'Customer Name': row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : '',
                'Customer Email': row.email || '',
                'Delivery Type': row.delivery_type || '',
                'Notes': row.notes || '',
                'Delivery Details': row.delivery_details || '',
                'Total': row.total || ''
              }));
              
              csvData = stringify(orderRows, { header: true });
            } catch (error) {
              console.error("Error exporting orders:", error);
              csvData = fallbackHeaders.orders;
            }
            filename = `orders-export-${Date.now()}.csv`;
            break;
        case "contacts":
          csvData = await exportService.exportContactsAsCsv(userId);
          filename = `contacts-export-${Date.now()}.csv`;
          break;
        case "recipes":
          csvData = await exportService.exportRecipesAsCsv(userId);
          filename = `recipes-export-${Date.now()}.csv`;
          break;
        case "products":
          csvData = await exportService.exportProductsAsCsv(userId);
          filename = `products-export-${Date.now()}.csv`;
          break;
        case "financials":
          csvData = await exportService.exportFinancialsAsCsv(userId);
          filename = `financials-export-${Date.now()}.csv`;
          break;
        case "tasks":
          // Directly use SQL for tasks export
          try {
            const result = await db.execute(`
              SELECT id, title, description, due_date, completed, priority, created_at, user_id
              FROM tasks
              WHERE user_id = $1
            `, [userId]);
            
            // Process results
            const taskRows = result.rows.map(row => ({
              'Title': row.title || '',
              'Description': row.description || '',
              'Due Date': row.due_date ? format(new Date(row.due_date), 'yyyy-MM-dd') : '',
              'Priority': row.priority || 'Normal',
              'Completed': row.completed ? 'Yes' : 'No',
              'Created': row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd') : ''
            }));
            
            csvData = stringify(taskRows, { header: true });
          } catch (error) {
            console.error("Error exporting tasks:", error);
            csvData = fallbackHeaders.tasks;
          }
          filename = `tasks-export-${Date.now()}.csv`;
          break;
        case "enquiries":
          // Directly use SQL for enquiries export
          try {
            const result = await db.execute(`
              SELECT id, email, phone, event_type, event_date, budget, details, status, created_at, updated_at,
                    first_name, last_name
              FROM enquiries
              WHERE user_id = $1
            `, [userId]);
            
            // Process results
            const enquiryRows = result.rows.map(row => ({
              'Name': (row.first_name && row.last_name) ? 
                      `${row.first_name} ${row.last_name}` : 
                      (row.first_name || row.last_name || ''),
              'Email': row.email || '',
              'Phone': row.phone || '',
              'Event Type': row.event_type || '',
              'Event Date': row.event_date ? format(new Date(row.event_date), 'yyyy-MM-dd') : '',
              'Budget': row.budget || '',
              'Details': row.details || '',
              'Status': row.status || '',
              'Created': row.created_at ? format(new Date(row.created_at), 'yyyy-MM-dd') : '',
              'Last Updated': row.updated_at ? format(new Date(row.updated_at), 'yyyy-MM-dd') : ''
            }));
            
            csvData = stringify(enquiryRows, { header: true });
          } catch (error) {
            console.error("Error exporting enquiries:", error);
            csvData = fallbackHeaders.enquiries;
          }
          filename = `enquiries-export-${Date.now()}.csv`;
          break;
        case "template_orders":
          csvData = await exportService.exportOrdersTemplate();
          filename = `bake-diary-orders-template.csv`;
          break;
        case "template_quotes":
          csvData = await exportService.exportQuotesTemplate();
          filename = `bake-diary-quotes-template.csv`;
          break;
        case "template_order_items":
          csvData = await exportService.exportOrderItemsTemplate();
          filename = `bake-diary-order-items-template.csv`;
          break;
        case "settings":
          // Settings don't have a CSV export
          return res.status(400).json({ 
            success: false, 
            error: `Settings cannot be exported as CSV` 
          });
        default:
          return res.status(400).json({ 
            success: false, 
            error: `Unknown data type for CSV export: ${dataType}` 
          });
      }
      
      // Send CSV response with more explicit headers to prevent browser misinterpretation
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      // Add cache control to prevent browser caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.send(csvData);
    }
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return res.status(500).json({ success: false, error: "Failed to export CSV data" });
  }
} else {
      // JSON export (fallback for backward compatibility)
      let data: any;
      
      switch (dataType) {
        case "orders":
          data = await exportService.exportOrders(userId);
          break;
        case "contacts":
          data = await exportService.exportContacts(userId);
          break;
        case "recipes":
          data = await exportService.exportRecipes(userId);
          break;
        case "products":
          data = await exportService.exportProducts(userId);
          break;
        case "financials":
          data = await exportService.exportFinancials(userId);
          break;
        case "tasks":
          data = await exportService.exportTasks(userId);
          break;
        case "enquiries":
          data = await exportService.exportEnquiries(userId);
          break;
        case "settings":
          data = await exportService.exportSettings(userId);
          break;
        default:
          return res.status(400).json({ 
            success: false, 
            error: `Unknown data type: ${dataType}` 
          });
      }
      
      return res.json(data);
    }
  } catch (error) {
    console.error(`Export error for ${req.params.dataType}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to export ${req.params.dataType} data` 
    });
  }
});

/**
 * Import data from JSON file upload
 */
router.post("/import", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    // Read file content
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    
    // Parse JSON data
    let data: any;
    try {
      data = JSON.parse(fileContent);
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid JSON file" });
    }
    
    // Parse import options from request body
    const replaceExisting = req.body.replaceExisting === "true";
    const importOptions = {
      importContacts: req.body.importContacts === "true",
      importOrders: req.body.importOrders === "true",
      importRecipes: req.body.importRecipes === "true",
      importProducts: req.body.importProducts === "true",
      importFinancials: req.body.importFinancials === "true",
      importTasks: req.body.importTasks === "true",
      importEnquiries: req.body.importEnquiries === "true",
      importSettings: req.body.importSettings === "true",
    };
    
    // Clean up selected data based on import options
    let importData: ImportData = data;
    if (!importOptions.importContacts) delete importData.contacts;
    if (!importOptions.importOrders) delete importData.orders;
    if (!importOptions.importRecipes) delete importData.recipes;
    if (!importOptions.importProducts) delete importData.products;
    if (!importOptions.importFinancials) delete importData.financials;
    if (!importOptions.importTasks) delete importData.tasks;
    if (!importOptions.importEnquiries) delete importData.enquiries;
    if (!importOptions.importSettings) delete importData.settings;
    
    // Use a mock user ID until authentication is implemented
    const userId = 1;
    
    // Import the data
    const result = await importService.importAllData(userId, importData);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, error: "Failed to import data" });
  }
});

/**
 * Import data from JSON in request body
 */
router.post("/import/json", async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: "No data provided" });
    }
    
    // Parse import options
    const importOptions = req.query;
    const replaceExisting = importOptions.replaceExisting === "true";
    
    // Setup filtered import data
    let importData: ImportData = data;
    if (importOptions.importContacts === "false") delete importData.contacts;
    if (importOptions.importOrders === "false") delete importData.orders;
    if (importOptions.importRecipes === "false") delete importData.recipes;
    if (importOptions.importProducts === "false") delete importData.products;
    if (importOptions.importFinancials === "false") delete importData.financials;
    if (importOptions.importTasks === "false") delete importData.tasks;
    if (importOptions.importEnquiries === "false") delete importData.enquiries;
    if (importOptions.importSettings === "false") delete importData.settings;
    
    // Use a mock user ID until authentication is implemented
    const userId = 1;
    
    // Import the data
    const result = await importService.importAllData(userId, importData);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Import error:", error);
    res.status(500).json({ success: false, error: "Failed to import data" });
  }
});

/**
 * Import from BakeGenie data format
 * Special endpoint specifically for importing from the legacy BakeGenie format
 */
router.post("/import/bake-diary", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    // Read file content
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    
    // Parse JSON data
    let data: any;
    try {
      data = JSON.parse(fileContent);
    } catch (e) {
      return res.status(400).json({ success: false, error: "Invalid JSON file" });
    }
    
    // Transform BakeGenie data to BakeGenie format
    const transformedData = transformBakeDiaryData(data);
    
    // Parse import options from request body
    const replaceExisting = req.body.replaceExisting === "true";
    const importOptions = {
      importContacts: req.body.importContacts === "true",
      importOrders: req.body.importOrders === "true",
      importRecipes: req.body.importRecipes === "true",
      importProducts: req.body.importProducts === "true",
      importFinancials: req.body.importFinancials === "true",
      importTasks: req.body.importTasks === "true",
      importEnquiries: req.body.importEnquiries === "true",
      importSettings: req.body.importSettings === "true",
    };
    
    // Clean up selected data based on import options
    if (!importOptions.importContacts) delete transformedData.contacts;
    if (!importOptions.importOrders) delete transformedData.orders;
    if (!importOptions.importRecipes) delete transformedData.recipes;
    if (!importOptions.importProducts) delete transformedData.products;
    if (!importOptions.importFinancials) delete transformedData.financials;
    if (!importOptions.importTasks) delete transformedData.tasks;
    if (!importOptions.importEnquiries) delete transformedData.enquiries;
    if (!importOptions.importSettings) delete transformedData.settings;
    
    // Use a mock user ID until authentication is implemented
    const userId = 1;
    
    // Import the data
    const result = await importService.importAllData(userId, transformedData);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Bake Diary import error:", error);
    res.status(500).json({ success: false, error: "Failed to import data from Bake Diary" });
  }
});

/**
 * Transform Bake Diary data format to BakeGenie format
 */
function transformBakeDiaryData(bakeDiaryData: any): ImportData {
  // Map fields from Bake Diary format to BakeGenie format
  // This is a placeholder implementation - the actual transformation would depend on the Bake Diary data structure
  
  const transformedData: ImportData = {
    version: "1.0",
    sourceSystem: "Bake Diary",
    orders: [],
    contacts: [],
    recipes: [],
    products: [],
    financials: {
      expenses: [],
      income: [],
    },
    tasks: [],
    enquiries: [],
    settings: {
      businessName: "",
      businessDetails: {
        email: "",
        phone: "",
        address: "",
        logo: "",
      },
      preferences: {},
    },
  };
  
  // Transform contacts
  if (bakeDiaryData.customers) {
    transformedData.contacts = bakeDiaryData.customers.map((customer: any) => ({
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      email: customer.email || null,
      phone: customer.phone || null,
      address: customer.address || null,
      city: customer.city || null,
      state: customer.state || null,
      postalCode: customer.postalCode || null,
      country: customer.country || "United Kingdom",
      notes: customer.notes || null,
    }));
  }
  
  // Transform orders
  if (bakeDiaryData.orders) {
    transformedData.orders = bakeDiaryData.orders.map((order: any) => ({
      orderNumber: order.orderNumber || `ORD-${Date.now()}`,
      contactId: order.customerId || 0, // Will need to map to new contact IDs
      eventType: mapEventType(order.eventType || "Other"),
      eventDate: order.eventDate || new Date().toISOString().split("T")[0],
      deliveryDate: order.deliveryDate || new Date().toISOString().split("T")[0],
      deliveryType: order.deliveryType || "Pickup",
      deliveryAddress: order.deliveryAddress || null,
      deliveryFee: order.deliveryFee?.toString() || "0",
      total: order.total?.toString() || "0",
      deposit: order.deposit?.toString() || "0",
      balance: order.balance?.toString() || "0",
      status: mapOrderStatus(order.status || "Quote"),
      notes: order.notes || null,
      allergens: order.allergens || null,
      items: order.items ? order.items.map((item: any) => ({
        name: item.name || "",
        quantity: item.quantity || 1,
        price: item.price?.toString() || "0",
        type: item.type || "Cake",
        description: item.description || null,
      })) : [],
    }));
  }
  
  // Transform recipes
  if (bakeDiaryData.recipes) {
    transformedData.recipes = bakeDiaryData.recipes.map((recipe: any) => ({
      name: recipe.name || "",
      servings: recipe.servings || 8,
      description: recipe.description || null,
      instructions: recipe.instructions || null,
      totalCost: recipe.cost?.toString() || null,
      prepTime: recipe.prepTime || null,
      cookTime: recipe.cookTime || null,
      ingredients: recipe.ingredients ? recipe.ingredients.map((ing: any) => ({
        ingredientId: 0, // Will need mapping
        name: ing.name || "",
        quantity: ing.quantity?.toString() || "0",
        unit: ing.unit || "g",
        cost: ing.cost?.toString() || "0",
      })) : [],
    }));
  }
  
  // Transform tasks
  if (bakeDiaryData.tasks) {
    transformedData.tasks = bakeDiaryData.tasks.map((task: any) => ({
      title: task.title || "",
      description: task.description || null,
      dueDate: task.dueDate || new Date().toISOString().split("T")[0],
      completed: task.completed || false,
      priority: task.priority || "Medium",
      relatedOrderId: task.orderId || null,
    }));
  }
  
  // Transform enquiries
  if (bakeDiaryData.enquiries) {
    transformedData.enquiries = bakeDiaryData.enquiries.map((enquiry: any) => ({
      contactId: enquiry.customerId || 0,
      date: enquiry.date || new Date().toISOString().split("T")[0],
      eventType: mapEventType(enquiry.eventType || "Other"),
      eventDate: enquiry.eventDate || null,
      details: enquiry.details || "",
      status: mapEnquiryStatus(enquiry.status || "Open"),
      followUpDate: enquiry.followUpDate || null,
    }));
  }
  
  // Transform settings
  if (bakeDiaryData.settings) {
    transformedData.settings = {
      businessName: bakeDiaryData.settings.businessName || "",
      businessDetails: {
        email: bakeDiaryData.settings.email || "",
        phone: bakeDiaryData.settings.phone || "",
        address: bakeDiaryData.settings.address || "",
        logo: bakeDiaryData.settings.logo || "",
      },
      preferences: bakeDiaryData.settings.preferences || {},
    };
  }
  
  return transformedData;
}

/**
 * Map BakeGenie event type to BakeGenie event type
 */
function mapEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    "birthday": "Birthday",
    "wedding": "Wedding",
    "corporate": "Corporate",
    "anniversary": "Anniversary",
    "babyshower": "Baby Shower",
    "gender reveal": "Gender Reveal",
    "christening": "Christening",
    "hen": "Hen/Stag",
    "stag": "Hen/Stag",
    "other": "Other",
  };
  
  return mapping[eventType.toLowerCase()] || "Other";
}

/**
 * Map Bake Diary order status to BakeGenie order status
 */
function mapOrderStatus(status: string): string {
  const mapping: Record<string, string> = {
    "draft": "Quote",
    "quote": "Quote",
    "confirmed": "Confirmed",
    "paid": "Paid",
    "ready": "Ready",
    "delivered": "Delivered",
    "cancelled": "Cancelled",
  };
  
  return mapping[status.toLowerCase()] || "Quote";
}

/**
 * Map Bake Diary enquiry status to BakeGenie enquiry status
 */
function mapEnquiryStatus(status: string): string {
  const mapping: Record<string, string> = {
    "open": "Open",
    "replied": "Replied",
    "waiting": "Waiting for Reply",
    "converted": "Converted to Order",
    "closed": "Closed",
  };
  
  return mapping[status.toLowerCase()] || "Open";
}