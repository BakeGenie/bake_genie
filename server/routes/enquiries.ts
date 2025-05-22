import { Router, Request, Response } from "express";
import { db } from "../db";
import { enquiries } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";

export const router = Router();

/**
 * Get all enquiries for the current user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Use user ID from session, fallback to 1 for development
    const userId = 1;
    
    // Fetch enquiries for this user
    const userEnquiries = await db.query.enquiries.findMany({
      where: eq(enquiries.userId, userId),
      orderBy: [desc(enquiries.createdAt)]
    });
    
    res.json(userEnquiries);
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({ 
      error: "Failed to fetch enquiries" 
    });
  }
});

/**
 * Get count of enquiries with "New" status
 */
router.get("/count", async (req: Request, res: Response) => {
  try {
    // Use user ID from session, fallback to 1 for development
    const userId = 1;
    
    // Count new enquiries for this user using raw SQL
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM enquiries WHERE user_id = ${userId} AND status = 'New'`
    );
    
    const count = Number(result.rows[0]?.count || 0);
    
    res.json({ count });
  } catch (error) {
    console.error("Error counting new enquiries:", error);
    res.status(500).json({ 
      error: "Failed to count new enquiries" 
    });
  }
});

/**
 * Get a specific enquiry by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const userId = 1;
    
    const result = await db.query.enquiries.findFirst({
      where: (fields, { and, eq }) => 
        and(
          eq(fields.id, enquiryId),
          eq(fields.userId, userId)
        )
    });
    
    if (!result) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching enquiry:", error);
    res.status(500).json({ error: "Failed to fetch enquiry" });
  }
});

/**
 * Create a new enquiry
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = 1;
    
    // Prepare the enquiry data with userId
    const enquiryData = {
      ...req.body,
      userId,
      status: req.body.status || "New",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the new enquiry
    const result = await db.insert(enquiries).values(enquiryData).returning();
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({ error: "Failed to create enquiry" });
  }
});

/**
 * Update an enquiry's status
 */
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const userId = 1;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    // Update the enquiry status
    const result = await db.update(enquiries)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(enquiries.id, enquiryId))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    res.status(500).json({ error: "Failed to update enquiry status" });
  }
});

/**
 * Delete an enquiry
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const userId = 1;
    
    // Delete the enquiry
    const result = await db.delete(enquiries)
      .where(eq(enquiries.id, enquiryId))
      .returning();
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({ error: "Failed to delete enquiry" });
  }
});

export default router;