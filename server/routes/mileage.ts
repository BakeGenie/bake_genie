import { Router } from "express";
import { db } from "../db";
import { mileage, insertMileageSchema } from "@shared/schema";
import { asc, desc, eq, and, sql } from "drizzle-orm";
import { format, parse, parseISO } from "date-fns";

const router = Router();

// Get all mileage records for the logged in user
router.get("/", async (req, res) => {
  try {
    const userId = 1; // Hard-coded for now, replace with authentication
    
    const mileageRecords = await db
      .select()
      .from(mileage)
      .where(eq(mileage.userId, userId))
      .orderBy(desc(mileage.date));
    
    res.json(mileageRecords);
  } catch (error) {
    console.error("Error fetching mileage records:", error);
    res.status(500).json({ error: "Failed to fetch mileage records" });
  }
});

// Get monthly mileage for filtering
router.get("/monthly/:year/:month", async (req, res) => {
  try {
    const userId = 1; // Hard-coded for now, replace with authentication
    const { year, month } = req.params;
    
    // Convert to number and validate
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: "Invalid year or month" });
    }
    
    // Get first and last day of the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);
    
    const formattedStartDate = format(startDate, "yyyy-MM-dd");
    const formattedEndDate = format(endDate, "yyyy-MM-dd");
    
    const mileageRecords = await db
      .select()
      .from(mileage)
      .where(
        and(
          eq(mileage.userId, userId),
          sql`${mileage.date} >= ${formattedStartDate}`,
          sql`${mileage.date} <= ${formattedEndDate}`
        )
      )
      .orderBy(desc(mileage.date));
    
    res.json(mileageRecords);
  } catch (error) {
    console.error("Error fetching monthly mileage records:", error);
    res.status(500).json({ error: "Failed to fetch monthly mileage records" });
  }
});

// Create a new mileage record
router.post("/", async (req, res) => {
  try {
    const userId = 1; // Hard-coded for now, replace with authentication
    
    // Parse, validate, and transform the incoming data
    const validatedData = insertMileageSchema.parse({
      ...req.body,
      userId
    });
    
    // Insert the mileage record
    const [newMileageRecord] = await db
      .insert(mileage)
      .values(validatedData)
      .returning();
    
    res.status(201).json(newMileageRecord);
  } catch (error) {
    console.error("Error creating mileage record:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    
    res.status(500).json({ error: "Failed to create mileage record" });
  }
});

// Delete a mileage record
router.delete("/:id", async (req, res) => {
  try {
    const userId = 1; // Hard-coded for now, replace with authentication
    const mileageId = parseInt(req.params.id);
    
    if (isNaN(mileageId)) {
      return res.status(400).json({ error: "Invalid mileage ID" });
    }
    
    // Delete the mileage record, ensuring it belongs to the user
    const [deletedRecord] = await db
      .delete(mileage)
      .where(and(
        eq(mileage.id, mileageId),
        eq(mileage.userId, userId)
      ))
      .returning();
    
    if (!deletedRecord) {
      return res.status(404).json({ error: "Mileage record not found" });
    }
    
    res.json({ success: true, message: "Mileage record deleted successfully" });
  } catch (error) {
    console.error("Error deleting mileage record:", error);
    res.status(500).json({ error: "Failed to delete mileage record" });
  }
});

// Update a mileage record
router.put("/:id", async (req, res) => {
  try {
    const userId = 1; // Hard-coded for now, replace with authentication
    const mileageId = parseInt(req.params.id);
    
    if (isNaN(mileageId)) {
      return res.status(400).json({ error: "Invalid mileage ID" });
    }
    
    // Validate the update data
    const validatedData = insertMileageSchema.parse({
      ...req.body,
      userId
    });
    
    // Update the mileage record, ensuring it belongs to the user
    const [updatedRecord] = await db
      .update(mileage)
      .set(validatedData)
      .where(and(
        eq(mileage.id, mileageId),
        eq(mileage.userId, userId)
      ))
      .returning();
    
    if (!updatedRecord) {
      return res.status(404).json({ error: "Mileage record not found" });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    console.error("Error updating mileage record:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input data", details: error.errors });
    }
    
    res.status(500).json({ error: "Failed to update mileage record" });
  }
});

export default router;