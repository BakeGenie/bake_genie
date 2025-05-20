import { db } from "../server/db";

/**
 * Add document font size field to the settings table
 */
async function addDocumentFontSizeField() {
  try {
    console.log("Adding document font size field to settings table...");
    
    // Check if the column already exists
    const checkQuery = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'settings' AND column_name = 'document_font_size';
    `);
    
    if (checkQuery.rows.length > 0) {
      console.log("Field already exists. Skipping.");
      return;
    }

    // Add the new field to the settings table
    await db.execute(`
      ALTER TABLE settings
      ADD COLUMN document_font_size TEXT DEFAULT 'normal';
    `);

    console.log("Document font size field added successfully!");
  } catch (error) {
    console.error("Error adding document font size field:", error);
  } finally {
    process.exit(0);
  }
}

addDocumentFontSizeField();