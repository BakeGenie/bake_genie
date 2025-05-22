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
    
    // Fetch enquiries for this user using raw SQL to handle schema differences
    const result = await db.execute(
      sql`SELECT * FROM enquiries WHERE user_id = ${userId} ORDER BY created_at DESC`
    );
    
    res.json(result.rows);
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
    
    // Get enquiry by ID using raw SQL
    const result = await db.execute(
      sql`SELECT * FROM enquiries WHERE id = ${enquiryId} AND user_id = ${userId}`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json(result.rows[0]);
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
    console.log("Received enquiry form data:", req.body);
    
    const userId = 1;
    const now = new Date();
    
    // Find or create a contact ID based on the name and email
    let contactId = null;
    if (req.body.name && req.body.email) {
      // In a real implementation, we would look up or create a contact here
      // For now, we'll just use null for contact_id
    }
    
    // Map the form fields to the actual database structure
    const enquiryData = {
      user_id: userId,
      contact_id: contactId,
      date: now, // Current date as enquiry date
      event_type: req.body.eventType || 'Other',
      event_date: req.body.eventDate || null,
      details: req.body.message || '',
      status: req.body.status || 'New',
      follow_up_date: null, // No follow-up date initially
      created_at: now,
      updated_at: now
    };
    
    console.log("Mapped to DB structure:", enquiryData);
    
    // Insert the new enquiry using raw SQL with only the fields that exist in the database
    const result = await db.execute(
      sql`INSERT INTO enquiries
        (user_id, contact_id, date, event_type, event_date, details, status, follow_up_date, created_at, updated_at)
        VALUES
        (${enquiryData.user_id}, ${enquiryData.contact_id}, ${enquiryData.date}, 
         ${enquiryData.event_type}, ${enquiryData.event_date}, ${enquiryData.details}, 
         ${enquiryData.status}, ${enquiryData.follow_up_date}, ${enquiryData.created_at}, ${enquiryData.updated_at})
        RETURNING *`
    );
    
    console.log("Inserted enquiry:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating enquiry:", error);
    res.status(500).json({ error: "Failed to create enquiry", details: error.message });
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
    
    // Update the enquiry status using raw SQL
    const result = await db.execute(
      sql`UPDATE enquiries 
          SET status = ${status}, updated_at = NOW() 
          WHERE id = ${enquiryId} AND user_id = ${userId}
          RETURNING *`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json(result.rows[0]);
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
    
    // Delete the enquiry using raw SQL
    const result = await db.execute(
      sql`DELETE FROM enquiries 
          WHERE id = ${enquiryId} AND user_id = ${userId}
          RETURNING id`
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    res.json({ success: true, message: "Enquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    res.status(500).json({ error: "Failed to delete enquiry" });
  }
});

export default router;