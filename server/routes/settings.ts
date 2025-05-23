import { Router, Request, Response } from "express";
import { db } from "../db";
import { settings } from "@shared/schema";
import { eq } from "drizzle-orm";

export const router = Router();

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

    // Extract only the fields we want to update, focusing on email templates
    const {
      quote_email_template,
      invoice_email_template,
      payment_reminder_template,
      payment_receipt_template,
      enquiry_message_template,
      // Include any other fields that should be updated directly
      currency,
      weekStartDay,
      languageCode,
      // ...don't include dates or IDs
    } = req.body;
    
    // Build our clean update object with only valid fields
    const updateData: any = {};
    
    // Only add fields that actually have values
    if (quote_email_template) updateData.quote_email_template = quote_email_template;
    if (invoice_email_template) updateData.invoice_email_template = invoice_email_template;
    if (payment_reminder_template) updateData.payment_reminder_template = payment_reminder_template;
    if (payment_receipt_template) updateData.payment_receipt_template = payment_receipt_template;
    if (enquiry_message_template) updateData.enquiry_message_template = enquiry_message_template;
    if (currency) updateData.currency = currency;
    if (weekStartDay) updateData.weekStartDay = weekStartDay;
    if (languageCode) updateData.languageCode = languageCode;
    
    // Always set the updated timestamp
    updateData.updatedAt = new Date();

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