import { db } from "../../server/db";
import { taxRates } from "../../shared/schema";
import { sql } from "drizzle-orm";

async function checkTaxRates() {
  try {
    console.log("Checking tax_rates table structure...");
    
    // Check if the table exists
    const tableExistsQuery = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tax_rates'
      );
    `);
    
    console.log("Table exists check:", tableExistsQuery.rows[0]);
    
    // Count records in the table
    const countQuery = await db.execute(sql`
      SELECT COUNT(*) FROM tax_rates;
    `);
    
    console.log("Number of tax rates:", countQuery.rows[0]);
    
    // Try to insert a test tax rate
    const userId = 1; // Default user for testing
    
    console.log("Attempting to insert a test tax rate...");
    const insertResult = await db.insert(taxRates).values({
      userId,
      name: "Test Tax Rate",
      rate: 10.00,
      description: "Test tax rate created by diagnostic script",
      isDefault: false,
      active: true
    }).returning();
    
    console.log("Insert result:", insertResult);
    
    // Try to fetch all tax rates
    console.log("Attempting to fetch all tax rates...");
    const allRates = await db.select().from(taxRates);
    
    console.log("All tax rates:", allRates);
    
    process.exit(0);
  } catch (error) {
    console.error("Error checking tax rates:", error);
    process.exit(1);
  }
}

checkTaxRates();