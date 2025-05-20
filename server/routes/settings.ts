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

    const userSettings = await db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId));

    if (userSettings.length === 0) {
      // Create new settings record if none exists
      const [newSettings] = await db
        .insert(settings)
        .values({
          userId,
          ...req.body,
        })
        .returning();

      return res.json(newSettings);
    } else {
      // Update existing settings
      const [updatedSettings] = await db
        .update(settings)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq(settings.userId, userId))
        .returning();

      return res.json(updatedSettings);
    }
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({ error: "Failed to update settings" });
  }
});