import { Router, Request, Response } from "express";
import { db } from "../db";
import { settings } from "@shared/schema";
import { eq } from "drizzle-orm";

export const router = Router();

// Specialized route just for email templates to avoid date issues
router.patch("/templates", async (req: Request, res: Response) => {
  // For demo purposes, assume user ID 1 
  const userId = 1;
  try {
    const { 
      quoteEmailTemplate, 
      invoiceEmailTemplate, 
      paymentReminderTemplate, 
      paymentReceiptTemplate, 
      enquiryMessageTemplate 
    } = req.body;
    
    // Check if we have any data to update
    if (!quoteEmailTemplate && 
        !invoiceEmailTemplate && 
        !paymentReminderTemplate && 
        !paymentReceiptTemplate && 
        !enquiryMessageTemplate) {
      return res.status(400).json({ error: "No template data provided" });
    }
      
    // Get the current settings record first
    const [currentSettings] = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));
      
    if (!currentSettings) {
      return res.status(404).json({ error: "Settings not found" });
    }
    
    // Build update object with proper camelCase to snake_case conversion
    // Only update fields that were provided in the request
    const updateObject: any = {
      updated_at: new Date()
    };
    
    if (quoteEmailTemplate !== undefined) {
      updateObject.quoteEmailTemplate = quoteEmailTemplate;
    }
    if (invoiceEmailTemplate !== undefined) {
      updateObject.invoiceEmailTemplate = invoiceEmailTemplate;
    }
    if (paymentReminderTemplate !== undefined) {
      updateObject.paymentReminderTemplate = paymentReminderTemplate;
    }
    if (paymentReceiptTemplate !== undefined) {
      updateObject.paymentReceiptTemplate = paymentReceiptTemplate;
    }
    if (enquiryMessageTemplate !== undefined) {
      updateObject.enquiryMessageTemplate = enquiryMessageTemplate;
    }
    
    // Simple approach - update via DRIZZLE ORM with proper schema
    const result = await db
      .update(settings)
      .set({
        quote_email_template: quoteEmailTemplate,
        invoice_email_template: invoiceEmailTemplate,
        payment_reminder_template: paymentReminderTemplate,
        payment_receipt_template: paymentReceiptTemplate,
        enquiry_message_template: enquiryMessageTemplate,
        updated_at: new Date()
      })
      .where(eq(settings.userId, userId));
    
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error updating email templates:", error);
    return res.status(500).json({ 
      error: "Failed to update email templates", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

/**
 * Get settings for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  // For demo purposes, assume user ID 1 
  const userId = 1;
  try {

    const userSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));

    if (userSettings.length === 0) {
      // Return default settings if none found
      return res.json({
        currency: "AUD",
        weekStartDay: "Monday",
        language: "English",
        hourlyRate: "30.00",
        markupMargin: "40"
      });
    }

    return res.json(userSettings[0]);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * Update settings for the current user
 */
router.patch("/", async (req: Request, res: Response) => {
  // For demo purposes, use a fixed user ID
  const userId = 1;
  try {
    console.log("Settings update request body:", req.body);

    const userSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));

    // Extract fields from the request using camelCase (from frontend)
    const {
      quoteEmailTemplate,
      invoiceEmailTemplate,
      paymentReminderTemplate,
      paymentReceiptTemplate,
      enquiryMessageTemplate,
      // Include any other fields that should be updated directly
      currency,
      weekStartDay,
      languageCode,
      // ...don't include dates or IDs
    } = req.body;
    
    // Build our clean update object mapping to snake_case DB columns
    const updateData: any = {};
    
    // Map camelCase property names to snake_case DB column names
    if (quoteEmailTemplate !== undefined) updateData.quote_email_template = quoteEmailTemplate;
    if (invoiceEmailTemplate !== undefined) updateData.invoice_email_template = invoiceEmailTemplate;
    if (paymentReminderTemplate !== undefined) updateData.payment_reminder_template = paymentReminderTemplate;
    if (paymentReceiptTemplate !== undefined) updateData.payment_receipt_template = paymentReceiptTemplate;
    if (enquiryMessageTemplate !== undefined) updateData.enquiry_message_template = enquiryMessageTemplate;
    
    // Other fields that don't need name conversion
    if (currency !== undefined) updateData.currency = currency;
    if (weekStartDay !== undefined) updateData.week_start_day = weekStartDay;
    if (languageCode !== undefined) updateData.language_code = languageCode;
    
    // Always set the updated timestamp with proper snake_case column name
    updateData.updated_at = new Date();

    if (userSettings.length === 0) {
      // Create new settings record if none exists
      console.log("Creating new settings for user:", userId);
      const [newSettings] = await db
        .insert(settings)
        .values({
          userId,
          ...updateData,
        })
        .returning();

      return res.json(newSettings);
    } else {
      // Update existing settings
      console.log("Updating existing settings for user:", userId);
      
      // Convert string 'true'/'false' values to boolean if needed
      if (typeof updateData.receiveUpcomingOrders === 'string') {
        updateData.receiveUpcomingOrders = updateData.receiveUpcomingOrders === 'true';
      }
      if (typeof updateData.receivePaymentReminders === 'string') {
        updateData.receivePaymentReminders = updateData.receivePaymentReminders === 'true';
      }
      if (typeof updateData.receiveMarketingEmails === 'string') {
        updateData.receiveMarketingEmails = updateData.receiveMarketingEmails === 'true';
      }
      if (typeof updateData.receiveProductUpdates === 'string') {
        updateData.receiveProductUpdates = updateData.receiveProductUpdates === 'true';
      }
      
      console.log("Final update values:", updateData);
      
      try {
        const [updatedSettings] = await db
          .update(settings)
          .set(updateData)
          .where(eq(settings.userId, userId))
          .returning();
          
        return res.json(updatedSettings);
      } catch (dbError) {
        console.error("Error updating settings:", dbError);
        return res.status(500).json({ 
          error: "Failed to update settings", 
          details: dbError instanceof Error ? dbError.message : String(dbError) 
        });
      }
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({ 
      error: "Failed to update settings", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});