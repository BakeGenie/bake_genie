import { db } from "../server/db";

/**
 * Add email template fields to the settings table
 */
async function addEmailTemplateFields() {
  try {
    console.log("Adding email template fields to settings table...");
    
    // Check if one of the columns already exists to avoid duplicating the work
    const checkQuery = await db.execute(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'settings' AND column_name = 'quote_email_template';
    `);
    
    if (checkQuery.rows.length > 0) {
      console.log("Fields already exist. Skipping.");
      return;
    }

    // Add the new fields to the settings table
    await db.execute(`
      ALTER TABLE settings
      ADD COLUMN quote_email_template TEXT,
      ADD COLUMN invoice_email_template TEXT,
      ADD COLUMN payment_reminder_template TEXT,
      ADD COLUMN payment_receipt_template TEXT,
      ADD COLUMN enquiry_message_template TEXT;
    `);

    console.log("Email template fields added successfully!");
  } catch (error) {
    console.error("Error adding email template fields:", error);
  } finally {
    process.exit(0);
  }
}

addEmailTemplateFields();