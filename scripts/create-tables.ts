import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Create essential tables for the application to function
 */
async function createEssentialTables() {
  console.log("Creating essential tables...");

  try {
    // Users table
    console.log("Creating users table...");
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
    console.log("Creating contacts table...");
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

    // Create a demo user if it doesn't exist
    console.log("Creating demo user if needed...");
    const existingUser = await db.execute(sql`SELECT id FROM users WHERE username = 'demo' LIMIT 1`);
    
    if (!existingUser.rowCount) {
      await db.execute(sql`
        INSERT INTO users (username, password, first_name, last_name, email, role)
        VALUES ('demo', 'password', 'Demo', 'User', 'demo@example.com', 'admin')
      `);
      console.log("Demo user created");
    } else {
      console.log("Demo user already exists");
    }

    // Orders table
    console.log("Creating orders table...");
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
    console.log("Creating order_items table...");
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
    console.log("Creating quotes table...");
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
    console.log("Creating quote_items table...");
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

    console.log("Essential tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

// Run the function
createEssentialTables().then(() => {
  console.log("Database initialization complete");
  process.exit(0);
}).catch(err => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});