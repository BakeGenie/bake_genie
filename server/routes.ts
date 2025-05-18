import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { router as dataRoutes } from "./routes/data";
import { router as xeroRoutes } from "./routes/xero";
import { router as uploadRoutes } from "./routes/upload";
import { router as bundlesRoutes } from "./routes/bundles";
import { router as invoicesRoutes } from "./routes/invoices";

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

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
