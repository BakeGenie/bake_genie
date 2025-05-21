import { Router, Request, Response } from "express";
import { stringify } from "csv-stringify/sync";
import { format } from "date-fns";
import { db } from "../db";
import { importService } from "../services/import-service";
import { exportService } from "../services/export";

export const router = Router();

/**
 * Export all data for the current user
 */
router.get("/export", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    
    // Export all data for the current user
    const data = await exportService.exportAllData(userId);
    
    // Set content type and filename
    const filename = req.query.filename || `bakegenie-export-all-${Date.now()}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Return all data
    return res.json(data);
  } catch (error) {
    console.error("Error exporting data:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to export data" 
    });
  }
});

/**
 * Export specific data type for the current user
 */
router.get("/export/:dataType", async (req: Request, res: Response) => {
  try {
    // Get user ID from session
    const userId = req.session?.userId || 1;
    const dataType = req.params.dataType;
    
    // For CSV exports (default for specific data types)
    let csvData = '';
    let filename = req.query.filename as string || `${dataType}-export-${Date.now()}.csv`;
    
    // Define fallback headers for when export fails
    const fallbackHeaders = {
      orders: "Order Number,Status,Event Type,Event Date,Customer Name,Customer Email,Delivery Type,Delivery Details,Total\n",
      contacts: "First Name,Last Name,Email,Phone,Business Name,Address,Notes\n",
      tasks: "Title,Description,Due Date,Priority,Completed\n",
      enquiries: "Name,Email,Phone,Event Type,Event Date,Budget,Details,Status\n",
      recipes: "Name,Description,Category,Preparation Time,Cooking Time,Servings\n",
      products: "Name,Description,Price,Category,Image URL\n",
      financials: "Date,Type,Category,Amount,Description,Payment Method\n"
    };
    
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
            'Event Date': row.event_date ? new Date(row.event_date).toISOString().split('T')[0] : '',
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
        break;
        
      case "contacts":
        csvData = await exportService.exportContactsAsCsv(userId);
        break;
        
      case "recipes":
        csvData = await exportService.exportRecipesAsCsv(userId);
        break;
        
      case "products":
        csvData = await exportService.exportProductsAsCsv(userId);
        break;
        
      case "financials":
        csvData = await exportService.exportFinancialsAsCsv(userId);
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
            'Due Date': row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
            'Priority': row.priority || 'Normal',
            'Completed': row.completed ? 'Yes' : 'No',
            'Created': row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''
          }));
          
          csvData = stringify(taskRows, { header: true });
        } catch (error) {
          console.error("Error exporting tasks:", error);
          csvData = fallbackHeaders.tasks;
        }
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
            'Event Date': row.event_date ? new Date(row.event_date).toISOString().split('T')[0] : '',
            'Budget': row.budget || '',
            'Details': row.details || '',
            'Status': row.status || '',
            'Created': row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
            'Last Updated': row.updated_at ? new Date(row.updated_at).toISOString().split('T')[0] : ''
          }));
          
          csvData = stringify(enquiryRows, { header: true });
        } catch (error) {
          console.error("Error exporting enquiries:", error);
          csvData = fallbackHeaders.enquiries;
        }
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
    
    // Send CSV response with explicit headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.send(csvData);
    
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to export CSV data" 
    });
  }
});

/**
 * Import data from JSON file upload
 */
router.post("/import", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId || 1;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    // Parse file content to JSON
    const fileContent = file.buffer.toString('utf-8');
    let data;
    try {
      data = JSON.parse(fileContent);
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid JSON file" 
      });
    }
    
    // Import the data
    await importService.importData(data, userId);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to import data" 
    });
  }
});

/**
 * Import data from JSON in request body
 */
router.post("/import/json", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId || 1;
    const data = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: "No data provided" });
    }
    
    // Import the data
    await importService.importData(data, userId);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to import data" 
    });
  }
});

/**
 * Import from Bake Diary data format
 * Special endpoint specifically for importing from the legacy Bake Diary format
 */
router.post("/import/bake-diary", async (req: Request, res: Response) => {
  try {
    const userId = req.session?.userId || 1;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }
    
    // Parse file content to determine if it's order list, quote list, or order items
    const fileContent = file.buffer.toString('utf-8');
    
    // Transform Bake Diary data to our format and import
    const bakeDiaryData = JSON.parse(fileContent);
    const transformedData = transformBakeDiaryData(bakeDiaryData);
    
    // Import the transformed data
    await importService.importData(transformedData, userId);
    
    return res.json({ success: true });
  } catch (error) {
    console.error("Bake Diary import error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to import Bake Diary data" 
    });
  }
});

/**
 * Transform Bake Diary data format to BakeGenie format
 */
function transformBakeDiaryData(bakeDiaryData: any) {
  // Basic structure for the transformed data
  const transformedData = {
    orders: [],
    contacts: [],
    products: [],
    // Add other entities as needed
  };
  
  // Transform orders from Bake Diary format
  if (bakeDiaryData.orders) {
    transformedData.orders = bakeDiaryData.orders.map((order: any) => ({
      orderNumber: order.orderNumber || `BD-${Date.now()}`,
      status: mapOrderStatus(order.status || 'Confirmed'),
      eventType: mapEventType(order.eventType || 'Unknown'),
      eventDate: order.eventDate || new Date().toISOString(),
      // Add other fields as needed
    }));
  }
  
  // Transform contacts from Bake Diary format
  if (bakeDiaryData.customers) {
    transformedData.contacts = bakeDiaryData.customers.map((customer: any) => ({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      businessName: customer.businessName || '',
      address: customer.address || '',
      notes: customer.notes || '',
    }));
  }
  
  return transformedData;
}

/**
 * Map Bake Diary event type to BakeGenie event type
 */
function mapEventType(eventType: string): string {
  const eventTypeMap: Record<string, string> = {
    'Birthday': 'Birthday',
    'Wedding': 'Wedding',
    'Anniversary': 'Anniversary',
    'Celebration': 'Celebration',
    'Corporate': 'Corporate',
    'Other': 'Other'
  };
  
  return eventTypeMap[eventType] || 'Other';
}

/**
 * Map Bake Diary order status to BakeGenie order status
 */
function mapOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'Confirmed': 'Confirmed',
    'Draft': 'Quote',
    'Quote': 'Quote',
    'In Progress': 'In Progress',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'Delivered': 'Delivered'
  };
  
  return statusMap[status] || 'Quote';
}

/**
 * Map Bake Diary enquiry status to BakeGenie enquiry status
 */
function mapEnquiryStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'New': 'New',
    'Contacted': 'Contacted',
    'Follow-up': 'Follow Up',
    'Converted': 'Converted',
    'Lost': 'Lost'
  };
  
  return statusMap[status] || 'New';
}