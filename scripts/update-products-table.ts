import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Update the products table to add missing columns
 */
async function updateProductsTable() {
  console.log("Checking if products table exists and has all required columns...");
  
  try {
    // First check if products table exists
    const tablesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      );
    `);
    
    const tableExists = tablesResult.rows[0].exists;
    
    if (!tableExists) {
      console.log("Products table doesn't exist, creating it...");
      await pool.query(`
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          category TEXT,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          servings INTEGER,
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2),
          tax_rate DECIMAL(5,2) DEFAULT '0',
          labor_hours DECIMAL(5,2) DEFAULT '0',
          labor_rate DECIMAL(10,2) DEFAULT '0',
          overhead DECIMAL(10,2) DEFAULT '0',
          image_url TEXT,
          bundle_id INTEGER,
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP,
          notes TEXT,
          sku TEXT
        );
      `);
      console.log("Products table created successfully!");
      return;
    }
    
    console.log("Products table exists, checking for missing columns...");
    
    // Check if type column exists
    const typeColumnResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'type'
      );
    `);
    
    const typeColumnExists = typeColumnResult.rows[0].exists;
    
    if (!typeColumnExists) {
      console.log("Adding 'type' column to products table...");
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN type TEXT NOT NULL DEFAULT 'Cake';
      `);
      console.log("Added 'type' column successfully!");
    }
    
    // Check for other potentially missing columns
    const columnsToCheck = [
      { name: 'tax_rate', definition: 'DECIMAL(5,2) DEFAULT \'0\'' },
      { name: 'labor_hours', definition: 'DECIMAL(5,2) DEFAULT \'0\'' },
      { name: 'labor_rate', definition: 'DECIMAL(10,2) DEFAULT \'0\'' },
      { name: 'overhead', definition: 'DECIMAL(10,2) DEFAULT \'0\'' },
      { name: 'active', definition: 'BOOLEAN DEFAULT TRUE' },
      { name: 'bundle_id', definition: 'INTEGER' },
    ];
    
    for (const column of columnsToCheck) {
      const columnResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'products' 
          AND column_name = '${column.name}'
        );
      `);
      
      const columnExists = columnResult.rows[0].exists;
      
      if (!columnExists) {
        console.log(`Adding '${column.name}' column to products table...`);
        await pool.query(`
          ALTER TABLE products 
          ADD COLUMN ${column.name} ${column.definition};
        `);
        console.log(`Added '${column.name}' column successfully!`);
      }
    }
    
    console.log("Products table is now up to date!");
    
  } catch (error) {
    console.error("Error updating products table:", error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
updateProductsTable()
  .then(() => {
    console.log("Products table update complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed to update products table:", error);
    process.exit(1);
  });