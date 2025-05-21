import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from 'fs';
import path from 'path';
import { startEmailScheduler } from './services/email-scheduler';
import session from 'express-session';
import { storage } from './storage';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bakegenie-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set up a default demo user for development
app.use(async (req, res, next) => {
  if (!req.session.user) {
    // For development, create/get default user
    try {
      // Try to find user with ID 1
      let user = await storage.getUser(1);
      
      // If user doesn't exist, create a demo user
      if (!user) {
        user = await storage.createUser({
          username: 'demo',
          password: 'password',
          email: 'demo@example.com',
          firstName: 'Demo',
          lastName: 'User',
          businessName: 'Bakery Business',
          phone: '555-123-4567',
          address: '123 Baker Street',
          city: 'Bakersville',
          state: 'CA',
          zip: '12345',
          country: 'US',
          logoUrl: null,
          signature: null
        });
      }
      
      // Set user in session
      req.session.user = user;
    } catch (error) {
      console.error('Error setting up demo user:', error);
    }
  }
  next();
});

// Serve static files from the uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (typeof reqPath === 'string' && reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the email scheduler for automated notifications
    if (process.env.SENDGRID_API_KEY) {
      log('Starting email notification service');
      startEmailScheduler();
    } else {
      log('Email service not started - SENDGRID_API_KEY not found');
    }
  });
})();
