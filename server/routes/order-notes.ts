import { Router } from "express";
import { db } from "../db";
import { orderNotes } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Get notes for a specific order
 */
router.get("/api/orders/:orderId/notes", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    // Get the order's notes
    const notes = await db
      .select()
      .from(orderNotes)
      .where(eq(orderNotes.orderId, orderId))
      .orderBy(orderNotes.createdAt, "desc");
    
    res.json(notes);
  } catch (error) {
    console.error("Error fetching order notes:", error);
    res.status(500).json({ error: "Failed to fetch order notes" });
  }
});

/**
 * Create a new note for an order
 */
router.post("/api/orders/:orderId/notes", async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.session?.userId || 1; // Get user ID from session or use default
    
    // Create the note with the order ID
    const noteData = {
      orderId,
      content: req.body.content,
      createdBy: userId,
    };
    
    // Insert the note
    const [newNote] = await db.insert(orderNotes).values(noteData).returning();
    
    console.log("Note created:", newNote);
    
    res.status(201).json({
      success: true,
      note: newNote,
    });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

/**
 * Delete a note
 */
router.delete("/api/notes/:noteId", async (req, res) => {
  try {
    const noteId = parseInt(req.params.noteId);
    
    // Delete the note
    await db.delete(orderNotes).where(eq(orderNotes.id, noteId));
    
    res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;