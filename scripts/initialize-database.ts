/**
 * Initialize the database with required tables for application functionality
 */
import { db } from "../server/db";
import { 
  users, contacts, orders, orderItems, quotes, quoteItems, 
  tasks, recipes, ingredients, recipeIngredients, 
  expenses, income, enquiries, settings, featureSettings,
  taxRates, integrations, payments, productBundles, bundleItems,
  reminderTemplates, reminderSchedules, reminderHistory,
  products
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function initializeDatabase() {
  console.log("Initializing database...");

  try {
    // Create tables if they don't exist
    await createTables();

    // Create a demo user if it doesn't exist
    await createDemoUser();

    // Create default settings
    await createDefaultSettings();

    // Create default feature settings
    await createDefaultFeatureSettings();

    // Create default tax rates
    await createDefaultTaxRates();

    console.log("Database initialization complete!");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

async function createTables() {
  console.log("Creating tables if they don't exist...");

  try {
    // Users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contacts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        business_name TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER NOT NULL REFERENCES contacts(id),
        order_number TEXT NOT NULL,
        title TEXT,
        event_type TEXT NOT NULL,
        event_date DATE NOT NULL,
        status TEXT NOT NULL,
        delivery_type TEXT NOT NULL,
        delivery_address TEXT,
        delivery_fee TEXT NOT NULL,
        delivery_time TEXT,
        total_amount TEXT NOT NULL,
        amount_paid TEXT NOT NULL,
        special_instructions TEXT,
        tax_rate TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Order Items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        price TEXT NOT NULL
      )
    `);

    // Quotes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quotes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER NOT NULL REFERENCES contacts(id),
        quote_number TEXT NOT NULL,
        title TEXT,
        event_type TEXT NOT NULL,
        event_date DATE NOT NULL,
        status TEXT NOT NULL,
        delivery_type TEXT NOT NULL,
        delivery_address TEXT,
        delivery_fee TEXT NOT NULL,
        total_amount TEXT NOT NULL,
        special_instructions TEXT,
        expiry_date DATE NOT NULL,
        tax_rate TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quote Items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS quote_items (
        id SERIAL PRIMARY KEY,
        quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL,
        price TEXT NOT NULL
      )
    `);

    // Tasks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        priority TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        related_order_id INTEGER REFERENCES orders(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        cost TEXT,
        image_url TEXT,
        product_type TEXT,
        recipe_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Recipes table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        servings INTEGER NOT NULL,
        description TEXT,
        instructions TEXT,
        total_cost TEXT,
        prep_time TEXT,
        cook_time TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ingredients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ingredients (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        cost_per_unit TEXT NOT NULL,
        supplier TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Recipe Ingredients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
        quantity TEXT NOT NULL,
        unit TEXT NOT NULL,
        cost TEXT NOT NULL
      )
    `);

    // Expenses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        category TEXT NOT NULL,
        amount TEXT NOT NULL,
        description TEXT,
        tax_deductible BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Income table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS income (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        source TEXT NOT NULL,
        amount TEXT NOT NULL,
        description TEXT,
        taxable BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Enquiries table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER REFERENCES contacts(id),
        date DATE NOT NULL,
        event_type TEXT NOT NULL,
        event_date DATE,
        details TEXT NOT NULL,
        status TEXT NOT NULL,
        follow_up_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        currency TEXT NOT NULL DEFAULT 'AUD',
        week_start TEXT NOT NULL DEFAULT 'Monday',
        business_name TEXT,
        business_address TEXT,
        business_email TEXT,
        business_phone TEXT,
        business_logo TEXT,
        invoice_prefix TEXT DEFAULT 'INV-',
        quote_prefix TEXT DEFAULT 'QT-',
        order_prefix TEXT DEFAULT 'ORD-',
        tax_rate TEXT DEFAULT '0',
        receive_upcoming_orders BOOLEAN DEFAULT TRUE,
        upcoming_orders_frequency TEXT DEFAULT 'daily',
        receive_payment_reminders BOOLEAN DEFAULT TRUE,
        notification_email TEXT,
        default_payment_terms INTEGER DEFAULT 7,
        invoice_notes TEXT,
        quote_notes TEXT,
        invoice_template INTEGER DEFAULT 1,
        invoice_email_subject TEXT DEFAULT 'Your Invoice from BakeGenie',
        invoice_email_body TEXT DEFAULT 'Dear Customer,\n\nPlease find attached your invoice for your order.\n\nPayment is due by the due date indicated.\n\nThank you for your business.\n\nRegards,\nBakeGenie',
        quote_email_subject TEXT DEFAULT 'Your Quote from BakeGenie',
        quote_email_body TEXT DEFAULT 'Dear Customer,\n\nPlease find attached your quote.\n\nThis quote is valid for 30 days.\n\nThank you for considering our services.\n\nRegards,\nBakeGenie',
        document_font_size TEXT DEFAULT 'normal',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Feature Settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feature_settings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tax Rates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        rate TEXT NOT NULL,
        description TEXT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Integrations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        provider TEXT NOT NULL,
        data JSONB NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        order_id INTEGER NOT NULL REFERENCES orders(id),
        date DATE NOT NULL,
        amount TEXT NOT NULL,
        method TEXT NOT NULL,
        reference TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Product Bundles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS product_bundles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bundle Items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bundle_items (
        id SERIAL PRIMARY KEY,
        bundle_id INTEGER NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1
      )
    `);

    // Reminder Templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reminder_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reminder Schedules table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reminder_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        template_id INTEGER NOT NULL REFERENCES reminder_templates(id),
        days_before INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reminder History table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reminder_history (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL REFERENCES reminder_schedules(id),
        order_id INTEGER REFERENCES orders(id),
        sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        recipient TEXT NOT NULL,
        success BOOLEAN NOT NULL
      )
    `);

    console.log("Tables created successfully");
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

async function createDemoUser() {
  try {
    // Check if demo user exists
    const existingUser = await db.select().from(users).where(sql`${users.username} = 'demo'`);
    
    if (existingUser.length === 0) {
      console.log("Creating demo user...");
      await db.insert(users).values({
        username: "demo",
        password: "password",
        firstName: "Demo",
        lastName: "User",
        email: "demo@example.com",
        role: "admin",
      });
      console.log("Demo user created");
    } else {
      console.log("Demo user already exists");
    }
  } catch (error) {
    console.error("Error creating demo user:", error);
    throw error;
  }
}

async function createDefaultSettings() {
  try {
    // Get the demo user
    const demoUser = await db.select().from(users).where(sql`${users.username} = 'demo'`);
    
    if (demoUser.length > 0) {
      const userId = demoUser[0].id;
      
      // Check if settings exist
      const existingSettings = await db.select().from(settings).where(sql`${settings.userId} = ${userId}`);
      
      if (existingSettings.length === 0) {
        console.log("Creating default settings...");
        await db.insert(settings).values({
          userId: userId,
          currency: "AUD",
          weekStart: "Monday",
          businessName: "My Bakery Business",
          businessAddress: "123 Baker Street",
          businessEmail: "bakery@example.com",
          businessPhone: "+61 2 1234 5678",
          invoicePrefix: "INV-",
          quotePrefix: "QT-",
          orderPrefix: "ORD-",
          taxRate: "10",
          receiveUpcomingOrders: true,
          upcomingOrdersFrequency: "daily",
          receivePaymentReminders: true,
          notificationEmail: "demo@example.com",
          defaultPaymentTerms: 7,
          invoiceNotes: "Thank you for your business",
          quoteNotes: "This quote is valid for 30 days",
          invoiceTemplate: 1,
        });
        console.log("Default settings created");
      } else {
        console.log("Settings already exist for demo user");
      }
    }
  } catch (error) {
    console.error("Error creating default settings:", error);
    throw error;
  }
}

async function createDefaultFeatureSettings() {
  try {
    // Check if feature settings exist
    const existingFeatures = await db.select().from(featureSettings);
    
    if (existingFeatures.length === 0) {
      console.log("Creating default feature settings...");
      
      const features = [
        { id: "account", name: "Account", enabled: true },
        { id: "dashboard", name: "Dashboard", enabled: true },
        { id: "orders", name: "Orders", enabled: true },
        { id: "quotes", name: "Quotes", enabled: true },
        { id: "contacts", name: "Contacts", enabled: true },
        { id: "products", name: "Products", enabled: true },
        { id: "recipes", name: "Recipes", enabled: true },
        { id: "ingredients", name: "Ingredients", enabled: true },
        { id: "expenses", name: "Expenses", enabled: true },
        { id: "income", name: "Income", enabled: true },
        { id: "calendar", name: "Calendar", enabled: true },
        { id: "reports", name: "Reports", enabled: true },
        { id: "settings", name: "Settings", enabled: true },
        { id: "enquiries", name: "Enquiries", enabled: true },
        { id: "tasks", name: "Tasks", enabled: true },
        { id: "tools", name: "Tools", enabled: true },
        { id: "integrations", name: "Integrations", enabled: true },
      ];
      
      for (const feature of features) {
        await db.insert(featureSettings).values(feature);
      }
      
      console.log("Default feature settings created");
    } else {
      console.log("Feature settings already exist");
    }
  } catch (error) {
    console.error("Error creating default feature settings:", error);
    throw error;
  }
}

async function createDefaultTaxRates() {
  try {
    // Get the demo user
    const demoUser = await db.select().from(users).where(sql`${users.username} = 'demo'`);
    
    if (demoUser.length > 0) {
      const userId = demoUser[0].id;
      
      // Check if tax rates exist
      const existingTaxRates = await db.select().from(taxRates).where(sql`${taxRates.userId} = ${userId}`);
      
      if (existingTaxRates.length === 0) {
        console.log("Creating default tax rates...");
        
        // Create standard rate
        await db.insert(taxRates).values({
          userId: userId,
          name: "Standard Rate",
          rate: "10",
          description: "Standard tax rate (10%)",
          isDefault: true,
        });
        
        // Create zero rate
        await db.insert(taxRates).values({
          userId: userId,
          name: "Zero Rate",
          rate: "0",
          description: "Zero-rated items (0%)",
          isDefault: false,
        });
        
        console.log("Default tax rates created");
      } else {
        console.log("Tax rates already exist for demo user");
      }
    }
  } catch (error) {
    console.error("Error creating default tax rates:", error);
    throw error;
  }
}

// Run the initialization
initializeDatabase();