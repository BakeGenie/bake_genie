import { Router, Request, Response } from "express";
import { db } from "../db";
import { contacts, insertContactSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const router = Router();

/**
 * Get all contacts
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const allContacts = await db.select().from(contacts).orderBy(contacts.lastName);
    return res.status(200).json(allContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ message: "Error fetching contacts" });
  }
});

/**
 * Get contact by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    return res.status(200).json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return res.status(500).json({ message: "Error fetching contact" });
  }
});

/**
 * Create new contact
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Log the incoming request body for debugging
    console.log("Contact creation request body:", req.body);
    
    // Ensure userId is set if not provided in request
    const contactData = {
      ...req.body,
      userId: req.body.userId || 1  // Default to user ID 1 if not provided
    };
    
    // Validate request body against schema
    const validateResult = insertContactSchema.safeParse(contactData);
    
    if (!validateResult.success) {
      return res.status(400).json({ 
        message: "Invalid contact data", 
        errors: validateResult.error.errors 
      });
    }
    
    // Insert contact into database
    const [newContact] = await db.insert(contacts).values(validateResult.data).returning();
    console.log("New contact created:", newContact);
    
    return res.status(201).json(newContact);
  } catch (error) {
    console.error("Error creating contact:", error);
    return res.status(500).json({ message: "Error creating contact" });
  }
});

/**
 * Update contact
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Validate request body against schema
    const validateResult = insertContactSchema.safeParse(req.body);
    
    if (!validateResult.success) {
      return res.status(400).json({ 
        message: "Invalid contact data", 
        errors: validateResult.error.errors 
      });
    }
    
    // Update contact in database
    const [updatedContact] = await db
      .update(contacts)
      .set(validateResult.data)
      .where(eq(contacts.id, id))
      .returning();
    
    if (!updatedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    return res.status(200).json(updatedContact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return res.status(500).json({ message: "Error updating contact" });
  }
});

/**
 * Delete contact
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Delete contact from database
    const [deletedContact] = await db
      .delete(contacts)
      .where(eq(contacts.id, id))
      .returning();
    
    if (!deletedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    return res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return res.status(500).json({ message: "Error deleting contact" });
  }
});