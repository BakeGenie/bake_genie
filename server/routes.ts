import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
import subscriptionRouter from "./routes/subscription";
import integrationsRouter from "./routes/integrations";
import ordersRouter from "./routes/orders-direct";
import { Router } from "express";
import { registerImportRoutes } from "./routes/import";

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  // Register subscription routes
  app.use('/api/subscription', subscriptionRouter);
  
  // Register integrations routes (for Stripe, Square, etc.)
  app.use('/api/integrations', integrationsRouter);
  
  // Register orders routes
  app.use(ordersRouter);
  
  // Register import routes
  const importRouter = Router();
  registerImportRoutes(importRouter);
  app.use(importRouter);

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
