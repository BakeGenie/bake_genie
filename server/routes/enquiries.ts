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
    
    // Fetch enquiries with user information using a JOIN
    const result = await db.execute(
      sql`SELECT e.*, u.name as user_name, u.email as user_email 
          FROM enquiries e
          LEFT JOIN users u ON e.user_id = u.id
          WHERE e.user_id = ${userId} 
          ORDER BY e.created_at DESC`
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
    
    // Add required fields based on database constraints
    const simplifiedQuery = `
      INSERT INTO enquiries
        (user_id, date, details, status, created_at, updated_at, event_type)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const simplifiedValues = [
      userId,
      now,
      message,
      'New',
      now,
      now,
      req.body.eventType || 'Other' // Make sure event_type is included
    ];
    
    console.log("Executing simplified SQL query:", simplifiedQuery);
    console.log("With simplified values:", JSON.stringify(simplifiedValues, null, 2));
    
    // Use a direct connection to the database
    const result = await db.$client.query(simplifiedQuery, simplifiedValues);
    
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
      details: error.message
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