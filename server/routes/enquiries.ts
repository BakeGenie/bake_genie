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
    console.log("------------------------------------");
    console.log("ADD ENQUIRY REQUEST RECEIVED");
    console.log("Received enquiry form data:", JSON.stringify(req.body, null, 2));
    
    const userId = 1;
    const now = new Date();
    
    // Set default values for required fields
    const message = req.body.message || '';
    if (!message) {
      console.error("Message field is required but missing");
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Find or create a contact ID based on the name and email
    let contactId = null;
    
    // Map the form fields to the actual database structure
    const enquiryData = {
      user_id: userId,
      contact_id: contactId,
      date: now, // Current date as enquiry date
      event_type: req.body.eventType || 'Other',
      event_date: req.body.eventDate || null,
      details: message,
      status: 'New', // Always use 'New' for initial status
      follow_up_date: null, // No follow-up date initially
      created_at: now,
      updated_at: now
    };
    
    console.log("Mapped to DB structure:", JSON.stringify(enquiryData, null, 2));
    
    const query = `
      INSERT INTO enquiries
        (user_id, contact_id, date, event_type, event_date, details, status, follow_up_date, created_at, updated_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      enquiryData.user_id,
      enquiryData.contact_id,
      enquiryData.date,
      enquiryData.event_type,
      enquiryData.event_date,
      enquiryData.details,
      enquiryData.status,
      enquiryData.follow_up_date,
      enquiryData.created_at,
      enquiryData.updated_at
    ];
    
    console.log("Executing SQL query:", query);
    console.log("With values:", JSON.stringify(values, null, 2));
    
    // Instead of using db.execute with sql template literals, use the native query method
    const result = await db.$client.query(query, values);
    
    console.log("Query executed successfully");
    console.log("Inserted enquiry:", result.rows[0]);
    console.log("------------------------------------");
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) { // Explicitly type error as any to avoid TypeScript errors
    console.error("------------------------------------");
    console.error("ERROR CREATING ENQUIRY:");
    console.error(error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("------------------------------------");
    
    res.status(500).json({ 
      error: "Failed to create enquiry", 
      details: error.message,
      stack: error.stack
    });
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