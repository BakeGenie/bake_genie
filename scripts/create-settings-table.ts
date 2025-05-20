import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createSettingsTable() {
  try {
    console.log("Creating settings table...");
    
    await db.execute(sql`
      DROP TABLE IF EXISTS settings;
      CREATE TABLE settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        currency TEXT DEFAULT 'AUD',
        default_tax_rate DECIMAL(5,2) DEFAULT 0,
        business_hours JSONB,
        business_name TEXT,
        business_email TEXT,
        business_phone TEXT,
        business_address TEXT,
        business_logo_url TEXT,
        invoice_footer TEXT,
        quote_footer TEXT,
        order_number_prefix TEXT DEFAULT '',
        quote_number_prefix TEXT DEFAULT '',
        invoice_template TEXT DEFAULT 'default',
        invoice_colors JSONB,
        labor_rate DECIMAL(10,2) DEFAULT 0,
        week_start_day TEXT DEFAULT 'Monday',
        language TEXT DEFAULT 'English',
        hourly_rate TEXT DEFAULT '30.00',
        markup_margin TEXT DEFAULT '40',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Settings table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating settings table:", error);
    process.exit(1);
  }
}

createSettingsTable();