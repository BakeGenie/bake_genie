import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function updateSettingsTable() {
  try {
    console.log("Updating settings table for email notifications...");

    await db.execute(sql`
      ALTER TABLE settings 
      ADD COLUMN IF NOT EXISTS email_address TEXT,
      ADD COLUMN IF NOT EXISTS secondary_email_address TEXT,
      ADD COLUMN IF NOT EXISTS receive_upcoming_orders BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS upcoming_orders_frequency TEXT DEFAULT 'weekly',
      ADD COLUMN IF NOT EXISTS receive_payment_reminders BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS receive_marketing_emails BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS receive_product_updates BOOLEAN DEFAULT FALSE;
    `);

    console.log("Settings table updated successfully");
  } catch (error) {
    console.error("Error updating settings table:", error);
  } finally {
    await pool.end();
  }
}

updateSettingsTable();