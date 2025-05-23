import { Router, Request as ExpressRequest, Response } from "express";
import { db } from "../db";
import { orders, quotes, orderItems, contacts, products, recipes, ingredients, tasks, enquiries, settings } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { stringify } from 'csv-stringify';
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

export const registerExportRoutes = (router: Router) => {
  /**
   * @route GET /api/data/export
   * @desc Export all data as JSON
   * @access Private
   */
  router.get("/api/data/export", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Collect all data for the user
      const userData = {
        orders: await db.select().from(orders).where({ userId }),
        orderItems: await db.select()
          .from(orderItems)
          .innerJoin(orders, orderItems.orderId === orders.id)
          .where({ "orders.userId": userId }),
        quotes: await db.select().from(quotes).where({ userId }),
        contacts: await db.select().from(contacts).where({ userId }),
        products: await db.select().from(products).where({ userId }),
        recipes: await db.select().from(recipes).where({ userId }),
        ingredients: await db.select().from(ingredients).where({ userId }),
        tasks: await db.select().from(tasks).where({ userId }),
        enquiries: await db.select().from(enquiries).where({ userId }),
        settings: await db.select().from(settings).where({ userId }),
        exportDate: new Date().toISOString(),
        version: "1.0"
      };

      // Set response headers for download
      const filename = req.query.filename || "bakegenie-export.json";
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      return res.json(userData);
    } catch (error) {
      console.error("Error exporting data:", error);
      return res.status(500).json({
        success: false,
        message: `Error exporting data: ${error}`
      });
    }
  });

  /**
   * @route GET /api/data/export/:type
   * @desc Export specific data type as CSV
   * @access Private
   */
  router.get("/api/data/export/:type", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const exportType = req.params.type;
      const filename = req.query.filename || `bakegenie-export-${exportType}.csv`;
      
      let data: any[] = [];
      let headers: string[] = [];
      
      // Fetch data based on export type
      switch (exportType) {
        case "orders":
          data = await db.select().from(orders).where({ userId });
          headers = ["id", "orderNumber", "contactId", "title", "eventType", "eventDate", "status", 
                   "deliveryType", "deliveryAddress", "deliveryFee", "total", "notes"];
          break;
          
        case "contacts":
          data = await db.select().from(contacts).where({ userId });
          headers = ["id", "firstName", "lastName", "email", "phone", "address", "businessName", "notes"];
          break;
          
        case "products":
          data = await db.select().from(products).where({ userId });
          headers = ["id", "name", "description", "price", "category", "sku", "active"];
          break;
          
        case "recipes":
          data = await db.select().from(recipes).where({ userId });
          headers = ["id", "name", "description", "category", "prepTime", "cookTime", "yield", "instructions", "notes"];
          break;
          
        case "ingredients":
          data = await db.select().from(ingredients).where({ userId });
          headers = ["id", "name", "unit", "costPerUnit", "category", "inStock", "stockQuantity", "supplier"];
          break;
          
        case "tasks":
          data = await db.select().from(tasks).where({ userId });
          headers = ["id", "title", "description", "dueDate", "status", "priority"];
          break;
          
        case "enquiries":
          data = await db.select().from(enquiries).where({ userId });
          headers = ["id", "name", "email", "phone", "message", "status", "followUpDate"];
          break;
          
        case "template_orders":
          // Return template with headers only
          headers = ["Order Number", "Contact", "Contact Email", "Theme", "Event Type", "Event Date", "Status", 
                   "Delivery", "Delivery Amount", "Order Total", "Amount Outstanding", "Notes"];
          data = []; // Empty template
          break;
          
        case "template_quotes":
          // Return template with headers only
          headers = ["Order Number", "Contact", "Event Type", "Event Date", "Theme", "Order Total", "Notes"];
          data = []; // Empty template
          break;
          
        case "template_order_items":
          // Return template with headers only
          headers = ["Order Number", "Date", "Item", "Details", "Servings", "Sell Price"];
          data = []; // Empty template
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported export type: ${exportType}`
          });
      }
      
      // Convert data to CSV
      const stringifier = stringify({ header: true, columns: headers });
      
      // Set response headers for download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Stream the CSV directly to the response
      stringifier.pipe(res);
      
      // Write data rows
      for (const row of data) {
        const csvRow: any = {};
        headers.forEach(header => {
          let value = row[header];
          
          // Format dates
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
          
          csvRow[header] = value;
        });
        stringifier.write(csvRow);
      }
      
      stringifier.end();
    } catch (error) {
      console.error("Error exporting data:", error);
      return res.status(500).json({
        success: false,
        message: `Error exporting data: ${error}`
      });
    }
  });
};