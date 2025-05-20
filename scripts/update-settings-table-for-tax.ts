import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function updateSettingsTable() {
  try {
    console.log("Starting settings table update for tax configuration...");
    
    // Add language_code column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en'
    `);
    
    // Add tax-related columns if they don't exist
    await db.execute(sql`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS use_gst BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS use_tax_invoice BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tax_terminology TEXT DEFAULT 'Tax',
      ADD COLUMN IF NOT EXISTS tax_invoice_title TEXT DEFAULT 'Tax Invoice'
    `);
    
    // Create tax_rates table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        rate DECIMAL(5,2) NOT NULL,
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    console.log("Settings table updated successfully for tax configuration!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating settings table:", error);
    process.exit(1);
  }
}

updateSettingsTable();