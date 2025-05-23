import { Router, Request as ExpressRequest, Response } from "express";
import { db } from "../db";
import { orders, quotes, orderItems, contacts, products, recipes, ingredients, tasks, enquiries, settings } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import multer from "multer";
import { Session } from "express-session";
import { isAuthenticated } from "../middleware/auth";

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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept JSON and CSV files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.json' || ext === '.csv') {
      return cb(null, true);
    }
    cb(new Error("Only JSON and CSV files are allowed"));
  },
});

/**
 * Import Bake Diary Contacts CSV
 * This function specifically handles the Bake Diary contact format
 * CSV Format: Type, First Name, Last Name, Supplier Name, Email, Number, Allow Marketing, Website, Source
 */
async function importBakeDiaryContacts(filePath: string, userId: number): Promise<any> {
  // Import csv-parse for handling CSV files
  const { parse } = await import('csv-parse/sync');
  
  try {
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse CSV file - skip header row (first row)
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // Handle CSV column names with spaces and keep original header names
      relax_column_count: true
    });
    
    console.log(`Found ${records.length} contacts in Bake Diary CSV`);
    console.log("Sample record:", JSON.stringify(records[0]));
    
    // Results tracking
    const result = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: 0,
      errorDetails: [] as string[]
    };
    
    // Process each contact
    for (const record of records) {
      try {
        // Check if required fields exist
        if (!record['First Name'] && !record['Last Name'] && !record['Email'] && !record['Number']) {
          console.log("Skipping empty record");
          result.skipped++;
          continue;
        }
        
        // Our database schema has these fields:
        // id, userId, firstName, lastName, email, phone, businessName, address, notes
        const contactData = {
          user_id: userId,
          first_name: record['First Name']?.trim() || '',
          last_name: record['Last Name']?.trim() || '',
          email: record['Email']?.trim() || '',
          phone: record['Number']?.trim() || '',
          business_name: record['Supplier Name']?.trim() || '',
          notes: `Imported from Bake Diary on ${new Date().toLocaleDateString()}. Type: ${record['Type'] || 'Customer'}. Allow Marketing: ${record['Allow Marketing'] || 'No'}. Website: ${record['Website'] || 'None'}. Source: ${record['Source'] || 'Import'}.`
        };
        
        console.log("Importing contact:", contactData.first_name, contactData.last_name);
        
        // Insert contact into database using raw SQL to ensure correct column names
        const query = `
          INSERT INTO contacts (user_id, first_name, last_name, email, phone, business_name, notes, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING id
        `;
        
        const values = [
          contactData.user_id,
          contactData.first_name,
          contactData.last_name,
          contactData.email,
          contactData.phone,
          contactData.business_name,
          contactData.notes
        ];
        
        const client = await db.client();
        const queryResult = await client.query(query, values);
        
        if (queryResult.rowCount > 0) {
          result.imported++;
        } else {
          result.errors++;
          result.errorDetails.push(`Failed to insert contact: ${contactData.first_name} ${contactData.last_name}`);
        }
      } catch (error) {
        console.error('Error importing contact:', error);
        result.errors++;
        result.errorDetails.push(`Error with contact ${record['First Name']} ${record['Last Name']}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return {
      success: result.imported > 0,
      message: `Successfully imported ${result.imported} contacts${result.skipped > 0 ? `, skipped ${result.skipped}` : ''}${result.errors > 0 ? `, with ${result.errors} errors` : ''}.`,
      details: result
    };
    
  } catch (error) {
    console.error('Error parsing Bake Diary CSV:', error);
    throw new Error(`Failed to import Bake Diary contacts: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const registerDataImportRoutes = (router: Router) => {
  /**
   * @route POST /api/data/import
   * @desc Import data from JSON or CSV
   * @access Private
   */
  router.post("/api/data/import", isAuthenticated, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No file uploaded" });
      }

      const userId = req.session.user!.id;
      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileName = req.file.originalname.toLowerCase();

      // Process based on file type
      try {
        let result;
        
        // Special handling for Bake Diary contacts import
        if (fileExt === '.csv' && (fileName.includes('bake diary contacts') || fileName.includes('contacts'))) {
          console.log('Detected Bake Diary Contacts CSV');
          result = await importBakeDiaryContacts(filePath, userId);
          return res.json(result);
        } else if (fileExt === '.json') {
          result = await importJsonData(filePath, userId, req.body);
          return res.json(result);
        } else if (fileExt === '.csv') {
          return res.status(400).json({ 
            success: false, 
            error: "General CSV import not supported. Please use specific import endpoints for Bake Diary CSV imports." 
          });
        } else {
          return res.status(400).json({ success: false, error: "Unsupported file type" });
        }
      } finally {
        // Clean up: remove uploaded file after processing
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error("Error importing data:", error);
      return res.status(500).json({
        success: false,
        error: `Error importing data: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
};

/**
 * Import data from JSON file
 */
async function importJsonData(filePath: string, userId: number, options: any): Promise<any> {
  try {
    // Read and parse the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const importData = JSON.parse(fileContent);
    
    // Summary of imported data
    const summary: Record<string, { imported: number, errors: number }> = {
      contacts: { imported: 0, errors: 0 },
      orders: { imported: 0, errors: 0 },
      orderItems: { imported: 0, errors: 0 },
      quotes: { imported: 0, errors: 0 },
      products: { imported: 0, errors: 0 },
      recipes: { imported: 0, errors: 0 },
      ingredients: { imported: 0, errors: 0 },
      tasks: { imported: 0, errors: 0 },
      enquiries: { imported: 0, errors: 0 },
      settings: { imported: 0, errors: 0 }
    };
    
    // Option to replace existing data
    const replaceExisting = options.replaceExisting === 'true';

    // Import contacts if enabled
    if (options.importContacts === 'true' && importData.contacts && Array.isArray(importData.contacts)) {
      if (replaceExisting) {
        await db.delete(contacts).where({ userId });
        console.log(`Deleted existing contacts for user ${userId}`);
      }
      
      for (const contact of importData.contacts) {
        try {
          const contactData = {
            userId,
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email || '',
            phone: contact.phone || '',
            address: contact.address || '',
            businessName: contact.businessName || '',
            notes: contact.notes || '',
          };
          
          await db.insert(contacts).values(contactData);
          summary.contacts.imported++;
        } catch (error) {
          console.error('Error importing contact:', error);
          summary.contacts.errors++;
        }
      }
    }
    
    // Import orders if enabled
    if (options.importOrders === 'true' && importData.orders && Array.isArray(importData.orders)) {
      if (replaceExisting) {
        // Delete associated orderItems first
        const existingOrders = await db.select({ id: orders.id }).from(orders).where({ userId });
        for (const order of existingOrders) {
          await db.delete(orderItems).where({ orderId: order.id });
        }
        
        await db.delete(orders).where({ userId });
        console.log(`Deleted existing orders and order items for user ${userId}`);
      }
      
      for (const order of importData.orders) {
        try {
          const orderData = {
            userId,
            contactId: order.contactId || null,
            orderNumber: order.orderNumber || `ORD-${Date.now()}`,
            title: order.title || '',
            eventType: order.eventType || 'Other',
            eventDate: order.eventDate ? new Date(order.eventDate) : new Date(),
            status: order.status || 'Draft',
            deliveryType: order.deliveryType || 'Pickup',
            deliveryAddress: order.deliveryAddress || '',
            deliveryFee: order.deliveryFee || '0',
            deliveryTime: order.deliveryTime || null,
            totalAmount: order.totalAmount || '0',
            amountPaid: order.amountPaid || '0',
            specialInstructions: order.specialInstructions || '',
            taxRate: order.taxRate || '0',
            notes: order.notes || '',
          };
          
          const [newOrder] = await db.insert(orders).values(orderData).returning();
          summary.orders.imported++;
          
          // If order items exist for this order, import them too
          if (importData.orderItems && Array.isArray(importData.orderItems)) {
            const items = importData.orderItems.filter((item: any) => item.orderId === order.id);
            
            for (const item of items) {
              try {
                const itemData = {
                  orderId: newOrder.id,
                  name: item.name || '',
                  description: item.description || '',
                  quantity: item.quantity || 1,
                  price: item.price || '0',
                };
                
                await db.insert(orderItems).values(itemData);
                summary.orderItems.imported++;
              } catch (error) {
                console.error('Error importing order item:', error);
                summary.orderItems.errors++;
              }
            }
          }
        } catch (error) {
          console.error('Error importing order:', error);
          summary.orders.errors++;
        }
      }
    }
    
    // Import quotes if enabled
    if (options.importOrders === 'true' && importData.quotes && Array.isArray(importData.quotes)) {
      if (replaceExisting) {
        await db.delete(quotes).where({ userId });
        console.log(`Deleted existing quotes for user ${userId}`);
      }
      
      for (const quote of importData.quotes) {
        try {
          const quoteData = {
            userId,
            contactId: quote.contactId || null,
            quoteNumber: quote.quoteNumber || `QUO-${Date.now()}`,
            title: quote.title || '',
            eventType: quote.eventType || 'Other',
            eventDate: quote.eventDate ? new Date(quote.eventDate) : new Date(),
            status: quote.status || 'Draft',
            deliveryType: quote.deliveryType || 'Pickup',
            deliveryAddress: quote.deliveryAddress || '',
            deliveryFee: quote.deliveryFee || '0',
            totalAmount: quote.totalAmount || '0',
            specialInstructions: quote.specialInstructions || '',
            expiryDate: quote.expiryDate ? new Date(quote.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            taxRate: quote.taxRate || '0',
            notes: quote.notes || '',
          };
          
          await db.insert(quotes).values(quoteData);
          summary.quotes.imported++;
        } catch (error) {
          console.error('Error importing quote:', error);
          summary.quotes.errors++;
        }
      }
    }
    
    // Import products if enabled
    if (options.importProducts === 'true' && importData.products && Array.isArray(importData.products)) {
      if (replaceExisting) {
        await db.delete(products).where({ userId });
        console.log(`Deleted existing products for user ${userId}`);
      }
      
      for (const product of importData.products) {
        try {
          const productData = {
            userId,
            name: product.name || '',
            description: product.description || '',
            price: product.price || '0',
            category: product.category || 'Other',
            sku: product.sku || '',
            active: product.active || true,
            imageUrl: product.imageUrl || null,
            productType: product.productType || 'standard',
          };
          
          await db.insert(products).values(productData);
          summary.products.imported++;
        } catch (error) {
          console.error('Error importing product:', error);
          summary.products.errors++;
        }
      }
    }
    
    // Import recipes if enabled
    if (options.importRecipes === 'true' && importData.recipes && Array.isArray(importData.recipes)) {
      if (replaceExisting) {
        await db.delete(recipes).where({ userId });
        console.log(`Deleted existing recipes for user ${userId}`);
      }
      
      for (const recipe of importData.recipes) {
        try {
          const recipeData = {
            userId,
            name: recipe.name || '',
            description: recipe.description || '',
            category: recipe.category || 'Other',
            prepTime: recipe.prepTime || '',
            cookTime: recipe.cookTime || '',
            yield: recipe.yield || '',
            instructions: recipe.instructions || '',
            notes: recipe.notes || '',
            isPublic: recipe.isPublic || false,
            imageUrl: recipe.imageUrl || null,
          };
          
          await db.insert(recipes).values(recipeData);
          summary.recipes.imported++;
        } catch (error) {
          console.error('Error importing recipe:', error);
          summary.recipes.errors++;
        }
      }
    }
    
    // Import ingredients if enabled
    if (options.importRecipes === 'true' && importData.ingredients && Array.isArray(importData.ingredients)) {
      if (replaceExisting) {
        await db.delete(ingredients).where({ userId });
        console.log(`Deleted existing ingredients for user ${userId}`);
      }
      
      for (const ingredient of importData.ingredients) {
        try {
          const ingredientData = {
            userId,
            name: ingredient.name || '',
            unit: ingredient.unit || '',
            costPerUnit: ingredient.costPerUnit || '0',
            category: ingredient.category || 'Other',
            inStock: ingredient.inStock || false,
            stockQuantity: ingredient.stockQuantity || '0',
            supplier: ingredient.supplier || '',
          };
          
          await db.insert(ingredients).values(ingredientData);
          summary.ingredients.imported++;
        } catch (error) {
          console.error('Error importing ingredient:', error);
          summary.ingredients.errors++;
        }
      }
    }
    
    // Import tasks if enabled
    if (options.importTasks === 'true' && importData.tasks && Array.isArray(importData.tasks)) {
      if (replaceExisting) {
        await db.delete(tasks).where({ userId });
        console.log(`Deleted existing tasks for user ${userId}`);
      }
      
      for (const task of importData.tasks) {
        try {
          const taskData = {
            userId,
            title: task.title || '',
            description: task.description || '',
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            status: task.status || 'Todo',
            priority: task.priority || 'Medium',
            orderId: task.orderId || null,
            reminderEnabled: task.reminderEnabled || false,
            reminderDate: task.reminderDate ? new Date(task.reminderDate) : null,
          };
          
          await db.insert(tasks).values(taskData);
          summary.tasks.imported++;
        } catch (error) {
          console.error('Error importing task:', error);
          summary.tasks.errors++;
        }
      }
    }
    
    // Import enquiries if enabled
    if (options.importEnquiries === 'true' && importData.enquiries && Array.isArray(importData.enquiries)) {
      if (replaceExisting) {
        await db.delete(enquiries).where({ userId });
        console.log(`Deleted existing enquiries for user ${userId}`);
      }
      
      for (const enquiry of importData.enquiries) {
        try {
          const enquiryData = {
            userId,
            name: enquiry.name || '',
            email: enquiry.email || '',
            phone: enquiry.phone || '',
            message: enquiry.message || '',
            eventType: enquiry.eventType || 'Other',
            eventDate: enquiry.eventDate ? new Date(enquiry.eventDate) : null,
            status: enquiry.status || 'New',
            followUpDate: enquiry.followUpDate ? new Date(enquiry.followUpDate) : null,
            notes: enquiry.notes || '',
          };
          
          await db.insert(enquiries).values(enquiryData);
          summary.enquiries.imported++;
        } catch (error) {
          console.error('Error importing enquiry:', error);
          summary.enquiries.errors++;
        }
      }
    }
    
    // Import settings if enabled
    if (options.importSettings === 'true' && importData.settings && Array.isArray(importData.settings)) {
      if (replaceExisting) {
        await db.delete(settings).where({ userId });
        console.log(`Deleted existing settings for user ${userId}`);
      }
      
      for (const setting of importData.settings) {
        try {
          const settingData = {
            userId,
            currency: setting.currency || 'USD',
            weekStart: setting.weekStart || 'Sunday',
            dateFormat: setting.dateFormat || 'MM/DD/YYYY',
            timeFormat: setting.timeFormat || '12h',
            businessName: setting.businessName || '',
            businessEmail: setting.businessEmail || '',
            businessPhone: setting.businessPhone || '',
            businessAddress: setting.businessAddress || '',
            businessLogo: setting.businessLogo || null,
            invoicePrefix: setting.invoicePrefix || 'INV-',
            taxRate: setting.taxRate || '0',
            emailSignature: setting.emailSignature || '',
            emailTemplateOrder: setting.emailTemplateOrder || '',
            emailTemplateQuote: setting.emailTemplateQuote || '',
            emailTemplateInvoice: setting.emailTemplateInvoice || '',
          };
          
          await db.insert(settings).values(settingData);
          summary.settings.imported++;
        } catch (error) {
          console.error('Error importing setting:', error);
          summary.settings.errors++;
        }
      }
    }
    
    // Cleanup temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
    
    return {
      success: true,
      message: "Data import completed",
      result: {
        summary
      }
    };
  } catch (error) {
    console.error('Error importing JSON data:', error);
    
    // Cleanup temporary file
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
    
    throw error;
  }
}