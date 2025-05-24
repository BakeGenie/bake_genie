import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { router as dataRoutes } from "./routes/data-fixed";
import { router as xeroRoutes } from "./routes/xero";
import { router as uploadRoutes } from "./routes/upload";
import { router as bundlesRoutes } from "./routes/bundles";
import { router as invoicesRoutes } from "./routes/invoices";
import { router as sampleInvoiceRoutes } from "./routes/sample-invoice";
import { router as paymentRemindersRoutes } from "./routes/payment-reminders";
import { router as reportRoutes } from "./routes/reports";
import { router as settingsRouter } from "./routes/settings";
import { router as taxRatesRouter } from "./routes/tax-rates";
import { router as featuresRouter } from "./routes/features";
import { router as contactsRouter } from "./routes/contacts";
import { router as productsRouter } from "./routes/products";
import { router as authRouter } from "./routes/auth";
import subscriptionRouter from "./routes/subscription";
import integrationsRouter from "./routes/integrations";
import ordersRouter, { registerOrdersDirectRoutes } from "./routes/orders-direct";
import orderLogsRouter from "./routes/order-logs";
import bakeDiaryImportRouter from "./routes/bake-diary-import";
import ingredientsImportRouter from "./routes/ingredients-import";
import ordersImportRouter from "./routes/orders-import";
import { quotesImportRouter } from "./routes/quotes-import";
import quotesImportHandler from "./routes/quotes-import-handler";
import orderItemsImportRouter from "./routes/order-items-import";
import ordersImportHandler from "./routes/orders-import-handler";
import orderItemsImportHandler from "./routes/order-items-import-handler";

import { Router } from "express";
import { registerImportRoutes } from "./routes/import";
import { registerExportRoutes } from "./routes/export";
import { registerDataImportRoutes } from "./routes/data-import";
import enquiriesRouter from "./routes/enquiries";
import tasksRouter from "./routes/tasks";
import ingredientsRouter from "./routes/ingredients";
import suppliesRouter from "./routes/supplies";
import usersRouter from "./routes/users";
import recipesRouter from "./routes/recipes";
// Using our ultra-simple expenses implementation for maximum reliability
import expensesRouter from "./routes/expenses-simple";
import expensesImportRouter from "./routes/expenses-import-manual";
import expensesBatchRouter from "./routes/expenses-batch";
import incomeRouter from "./routes/income";
import mileageRouter from "./routes/mileage";
import orderTasksRouter from "./routes/order-tasks";
import orderNotesRouter from "./routes/order-notes";
import scheduledPaymentsRouter from "./routes/scheduled-payments";
import paymentsRouter from "./routes/payments";
import { router as subscriptionPaymentRouter } from "./routes/subscription-payment";
import subscriptionTrialRouter from "./routes/subscription-trial-fixed";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register orders route with customer information FIRST to take precedence
  app.get('/api/orders', async (req: any, res: any) => {
    try {
      // Get user ID from session
      const userId = req.session?.userId || 1;
      
      // Use direct SQL query with JOIN to include contact information
      const result = await pool.query(`
        SELECT 
          o.*,
          json_build_object(
            'id', c.id,
            'firstName', c.first_name,
            'lastName', c.last_name,
            'email', c.email,
            'phone', c.phone
          ) as contact
        FROM orders o
        LEFT JOIN contacts c ON o.contact_id = c.id
        WHERE o.user_id = $1
        ORDER BY o.event_date
      `, [userId]);
      
      console.log("Orders query result sample with contact:", JSON.stringify(result.rows[0], null, 2));
      
      // Add headers to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "Failed to fetch orders" });
    }
  });

  // Register our direct routes first
  await registerOrdersDirectRoutes(app);
  // put application routes here
  // prefix all routes with /api

  // Register data import/export routes
  app.use('/api/data', dataRoutes);
  
  // Register Xero integration routes
  app.use('/api/xero', xeroRoutes);
  
  // Register upload routes
  app.use('/api/upload', uploadRoutes);
  
  // Register bundles routes
  app.use('/api/bundles', bundlesRoutes);
  
  // Register invoice routes
  app.use('/api/invoices', invoicesRoutes);
  
  // Register sample invoice route for preview
  app.use('/api/sample-invoice', sampleInvoiceRoutes);
  
  // Register payment reminders routes
  app.use('/api/reminders', paymentRemindersRoutes);
  
  // Register reports routes
  app.use('/api/reports', reportRoutes);
  
  // Register settings routes
  app.use('/api/settings', settingsRouter);
  
  // Register tax rates routes
  app.use('/api/tax-rates', taxRatesRouter);
  
  // Register features routes
  app.use('/api/settings/features', featuresRouter);
  
  // Register contacts routes
  app.use('/api/contacts', contactsRouter);
  
  // Register products routes
  app.use('/api/products', productsRouter);
  
  // Register new product routes for the fixed implementation
  
  // Register subscription routes
  app.use('/api/subscription', subscriptionRouter);
  
  // Register integrations routes (for Stripe, Square, etc.)
  app.use('/api/integrations', integrationsRouter);
  
  // Register orders routes - IMPORTANT: Direct routes must come first to take precedence
  app.use(ordersRouter);
  
  // Register order logs routes
  app.use(orderLogsRouter);
  
  // Register enquiries routes
  app.use('/api/enquiries', enquiriesRouter);
  
  // Register tasks routes
  app.use('/api/tasks', tasksRouter);
  
  // Register ingredients routes
  app.use('/api/ingredients', ingredientsRouter);
  
  // Register supplies routes
  app.use('/api/supplies', suppliesRouter);
  
  // Register recipes routes
  app.use('/api/recipes', recipesRouter);
  
  // Register expenses routes
  app.use('/api/expenses', expensesRouter);
  app.use(expensesImportRouter);
  
  // Register batch expenses import
  app.use(expensesBatchRouter);
  
  // Register Bake Diary specific import router
  app.use(bakeDiaryImportRouter);
  
  // Register income routes
  app.use('/api/income', incomeRouter);
  
  // Register mileage routes
  app.use('/api/mileage', mileageRouter);
  
  // Register auth routes
  app.use('/api/auth', authRouter);
  
  // Register user routes
  app.use('/api/users', usersRouter);
  
  // Register order tasks, notes, and scheduled payments routes
  app.use(orderTasksRouter);
  app.use(orderNotesRouter);
  app.use(scheduledPaymentsRouter);
  
  // Register payment processing routes
  app.use('/api/payments', paymentsRouter);
  
  // Register subscription payment routes
  app.use('/api/subscription', subscriptionPaymentRouter);
  
  // Register subscription trial routes
  app.use('/api/subscription', subscriptionTrialRouter);
  
  // Register import routes
  const importRouter = Router();
  registerImportRoutes(importRouter);
  app.use(importRouter);
  
  // Register export routes
  const exportRouter = Router();
  registerExportRoutes(exportRouter);
  app.use(exportRouter);
  
  // Register general data import routes
  const dataImportRouter = Router();
  registerDataImportRoutes(dataImportRouter);
  app.use(dataImportRouter);
  
  // Register ingredients import routes
  app.use(ingredientsImportRouter);
  
  // Register orders import routes
  app.use(ordersImportRouter);
  
  // Register quotes import routes
  app.use(quotesImportRouter);
  
  // Register order items import routes
  app.use(orderItemsImportRouter);
  
  // Register our new CSV import handlers
  app.use(ordersImportHandler);
  app.use(orderItemsImportHandler);
  app.use(quotesImportHandler);
  


  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
