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
import { router as productsRouter } from "./routes/products";
import { router as authRouter } from "./routes/auth";
import subscriptionRouter from "./routes/subscription";
import integrationsRouter from "./routes/integrations";
import ordersRouter, { registerOrdersDirectRoutes } from "./routes/orders-direct";
import orderLogsRouter from "./routes/order-logs";
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
import expensesRouter from "./routes/expenses";
import incomeRouter from "./routes/income";
import mileageRouter from "./routes/mileage";
import orderTasksRouter from "./routes/order-tasks";
import orderNotesRouter from "./routes/order-notes";
import scheduledPaymentsRouter from "./routes/scheduled-payments";
import paymentsRouter from "./routes/payments";
import { router as subscriptionPaymentRouter } from "./routes/subscription-payment";
import subscriptionTrialRouter from "./routes/subscription-trial-fixed";

export async function registerRoutes(app: Express): Promise<Server> {
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
  
  // Register orders routes
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

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
