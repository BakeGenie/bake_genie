import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function createSettingsTable() {
  try {
    console.log("Creating settings table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        currency VARCHAR(10) DEFAULT 'AUD',
        week_start_day VARCHAR(10) DEFAULT 'Monday',
        language VARCHAR(30) DEFAULT 'English',
        hourly_rate VARCHAR(10) DEFAULT '30.00',
        markup_margin VARCHAR(10) DEFAULT '40',
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