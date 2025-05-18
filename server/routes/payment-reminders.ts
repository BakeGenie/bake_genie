import { Router, Request, Response } from "express";
import { db } from "../db";
import { eq, and, isNull, lt, gt } from "drizzle-orm";
import { 
  reminderTemplates,
  reminderSchedules,
  reminderHistory,
  orders,
  contacts
} from "@shared/schema";
import { emailService } from "../services/email";

// Define auth request interface
interface AuthRequest extends Express.Request {
  session: {
    userId: number;
    [key: string]: any;
  };
}

export const router = Router();

/**
 * Get default reminder templates
 */
router.get("/templates", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    
    const templates = await db
      .select()
      .from(reminderTemplates)
      .where(eq(reminderTemplates.userId, userId));
    
    return res.status(200).json(templates);
  } catch (error) {
    console.error("Error fetching reminder templates:", error);
    return res.status(500).json({ message: "Error fetching reminder templates" });
  }
});

/**
 * Create a new reminder template
 */
router.post("/templates", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const { name, subject, body, isDefault } = req.body;
    
    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({ message: "Name, subject, and body are required" });
    }
    
    // If setting this template as default, unset any existing default
    if (isDefault) {
      await db
        .update(reminderTemplates)
        .set({ isDefault: false })
        .where(and(
          eq(reminderTemplates.userId, userId),
          eq(reminderTemplates.isDefault, true)
        ));
    }
    
    const [template] = await db
      .insert(reminderTemplates)
      .values({
        userId,
        name,
        subject,
        body,
        isDefault: isDefault || false
      })
      .returning();
    
    return res.status(201).json(template);
  } catch (error) {
    console.error("Error creating reminder template:", error);
    return res.status(500).json({ message: "Error creating reminder template" });
  }
});

/**
 * Update a reminder template
 */
router.put("/templates/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const templateId = parseInt(req.params.id);
    const { name, subject, body, isDefault } = req.body;
    
    // Validate required fields
    if (!name || !subject || !body) {
      return res.status(400).json({ message: "Name, subject, and body are required" });
    }
    
    // Check if template exists and belongs to user
    const existingTemplate = await db
      .select()
      .from(reminderTemplates)
      .where(and(
        eq(reminderTemplates.id, templateId),
        eq(reminderTemplates.userId, userId)
      ));
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // If setting this template as default, unset any existing default
    if (isDefault) {
      await db
        .update(reminderTemplates)
        .set({ isDefault: false })
        .where(and(
          eq(reminderTemplates.userId, userId),
          eq(reminderTemplates.isDefault, true)
        ));
    }
    
    const [updatedTemplate] = await db
      .update(reminderTemplates)
      .set({
        name,
        subject,
        body,
        isDefault: isDefault || false,
        updatedAt: new Date()
      })
      .where(and(
        eq(reminderTemplates.id, templateId),
        eq(reminderTemplates.userId, userId)
      ))
      .returning();
    
    return res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error("Error updating reminder template:", error);
    return res.status(500).json({ message: "Error updating reminder template" });
  }
});

/**
 * Delete a reminder template
 */
router.delete("/templates/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const templateId = parseInt(req.params.id);
    
    // Check if template exists and belongs to user
    const existingTemplate = await db
      .select()
      .from(reminderTemplates)
      .where(and(
        eq(reminderTemplates.id, templateId),
        eq(reminderTemplates.userId, userId)
      ));
    
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Check if template is in use by any reminders
    const reminderUsingTemplate = await db
      .select()
      .from(reminderSchedules)
      .where(eq(reminderSchedules.templateId, templateId));
    
    if (reminderUsingTemplate.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete template because it is in use by one or more reminders" 
      });
    }
    
    await db
      .delete(reminderTemplates)
      .where(and(
        eq(reminderTemplates.id, templateId),
        eq(reminderTemplates.userId, userId)
      ));
    
    return res.status(200).json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder template:", error);
    return res.status(500).json({ message: "Error deleting reminder template" });
  }
});

/**
 * Get reminder schedules for an order
 */
router.get("/order/:orderId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const orderId = parseInt(req.params.orderId);
    
    const schedules = await db
      .select()
      .from(reminderSchedules)
      .where(and(
        eq(reminderSchedules.orderId, orderId),
        eq(reminderSchedules.userId, userId)
      ));
    
    return res.status(200).json(schedules);
  } catch (error) {
    console.error("Error fetching reminder schedules:", error);
    return res.status(500).json({ message: "Error fetching reminder schedules" });
  }
});

/**
 * Create a new reminder schedule for an order
 */
router.post("/order/:orderId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const orderId = parseInt(req.params.orderId);
    const { 
      templateId, 
      daysBefore, 
      isOverdue, 
      customSubject, 
      customBody, 
      isEnabled 
    } = req.body;
    
    // Either daysBefore must be set or isOverdue must be true
    if ((daysBefore === null || daysBefore === undefined) && !isOverdue) {
      return res.status(400).json({ 
        message: "Either daysBefore must be set or isOverdue must be true" 
      });
    }
    
    // Make sure order exists and belongs to the user
    const orderExists = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, userId)
      ));
    
    if (orderExists.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // If using a template, make sure it exists and belongs to the user
    if (templateId) {
      const templateExists = await db
        .select()
        .from(reminderTemplates)
        .where(and(
          eq(reminderTemplates.id, templateId),
          eq(reminderTemplates.userId, userId)
        ));
      
      if (templateExists.length === 0) {
        return res.status(404).json({ message: "Template not found" });
      }
    }
    
    // Calculate next send date based on the order due date and days before
    let nextSend = null;
    if (orderExists[0].dueDate && daysBefore !== null && daysBefore !== undefined) {
      const dueDate = new Date(orderExists[0].dueDate);
      nextSend = new Date(dueDate);
      nextSend.setDate(dueDate.getDate() - daysBefore);
      
      // If the nextSend date is in the past, set to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (nextSend < new Date()) {
        nextSend = tomorrow;
      }
    } else if (isOverdue && orderExists[0].dueDate) {
      // For overdue reminders, set next send to tomorrow if the due date is past
      const dueDate = new Date(orderExists[0].dueDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (dueDate < new Date()) {
        nextSend = tomorrow;
      }
    }
    
    const [schedule] = await db
      .insert(reminderSchedules)
      .values({
        orderId,
        userId,
        templateId: templateId || null,
        daysBefore: daysBefore || null,
        isOverdue: isOverdue || false,
        customSubject: customSubject || null,
        customBody: customBody || null,
        isEnabled: isEnabled !== false, // Default to true if not specified
        nextSend
      })
      .returning();
    
    return res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating reminder schedule:", error);
    return res.status(500).json({ message: "Error creating reminder schedule" });
  }
});

/**
 * Update a reminder schedule
 */
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const scheduleId = parseInt(req.params.id);
    const { 
      templateId, 
      daysBefore, 
      isOverdue, 
      customSubject, 
      customBody, 
      isEnabled 
    } = req.body;
    
    // Check if schedule exists and belongs to user
    const existingSchedule = await db
      .select({
        schedule: reminderSchedules,
        order: orders
      })
      .from(reminderSchedules)
      .innerJoin(orders, eq(reminderSchedules.orderId, orders.id))
      .where(and(
        eq(reminderSchedules.id, scheduleId),
        eq(reminderSchedules.userId, userId)
      ));
    
    if (existingSchedule.length === 0) {
      return res.status(404).json({ message: "Reminder schedule not found" });
    }
    
    // Either daysBefore must be set or isOverdue must be true
    if ((daysBefore === null || daysBefore === undefined) && !isOverdue) {
      return res.status(400).json({ 
        message: "Either daysBefore must be set or isOverdue must be true" 
      });
    }
    
    // If using a template, make sure it exists and belongs to the user
    if (templateId) {
      const templateExists = await db
        .select()
        .from(reminderTemplates)
        .where(and(
          eq(reminderTemplates.id, templateId),
          eq(reminderTemplates.userId, userId)
        ));
      
      if (templateExists.length === 0) {
        return res.status(404).json({ message: "Template not found" });
      }
    }
    
    // Calculate next send date based on the order due date and days before
    let nextSend = existingSchedule[0].schedule.nextSend;
    const order = existingSchedule[0].order;
    
    if (order.dueDate && daysBefore !== null && daysBefore !== undefined) {
      const dueDate = new Date(order.dueDate);
      nextSend = new Date(dueDate);
      nextSend.setDate(dueDate.getDate() - daysBefore);
      
      // If the nextSend date is in the past, set to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (nextSend < new Date()) {
        nextSend = tomorrow;
      }
    } else if (isOverdue && order.dueDate) {
      // For overdue reminders, set next send to tomorrow if the due date is past
      const dueDate = new Date(order.dueDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (dueDate < new Date()) {
        nextSend = tomorrow;
      }
    }
    
    const [updatedSchedule] = await db
      .update(reminderSchedules)
      .set({
        templateId: templateId || null,
        daysBefore: daysBefore || null,
        isOverdue: isOverdue || false,
        customSubject: customSubject || null,
        customBody: customBody || null,
        isEnabled: isEnabled !== false, // Default to true if not specified
        nextSend,
        updatedAt: new Date()
      })
      .where(and(
        eq(reminderSchedules.id, scheduleId),
        eq(reminderSchedules.userId, userId)
      ))
      .returning();
    
    return res.status(200).json(updatedSchedule);
  } catch (error) {
    console.error("Error updating reminder schedule:", error);
    return res.status(500).json({ message: "Error updating reminder schedule" });
  }
});

/**
 * Delete a reminder schedule
 */
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const scheduleId = parseInt(req.params.id);
    
    // Check if schedule exists and belongs to user
    const existingSchedule = await db
      .select()
      .from(reminderSchedules)
      .where(and(
        eq(reminderSchedules.id, scheduleId),
        eq(reminderSchedules.userId, userId)
      ));
    
    if (existingSchedule.length === 0) {
      return res.status(404).json({ message: "Reminder schedule not found" });
    }
    
    await db
      .delete(reminderSchedules)
      .where(and(
        eq(reminderSchedules.id, scheduleId),
        eq(reminderSchedules.userId, userId)
      ));
    
    return res.status(200).json({ message: "Reminder schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder schedule:", error);
    return res.status(500).json({ message: "Error deleting reminder schedule" });
  }
});

/**
 * Get reminder history for an order
 */
router.get("/history/order/:orderId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const orderId = parseInt(req.params.orderId);
    
    // Check if order exists and belongs to user
    const orderExists = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, userId)
      ));
    
    if (orderExists.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const history = await db
      .select()
      .from(reminderHistory)
      .where(eq(reminderHistory.orderId, orderId))
      .orderBy(reminderHistory.sentAt);
    
    return res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching reminder history:", error);
    return res.status(500).json({ message: "Error fetching reminder history" });
  }
});

/**
 * Manually send a reminder now
 */
router.post("/send/:scheduleId", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.session.userId;
    const scheduleId = parseInt(req.params.scheduleId);
    
    // Get schedule with order and contact information
    const reminderData = await db
      .select({
        schedule: reminderSchedules,
        order: orders,
        template: reminderTemplates,
        contact: contacts
      })
      .from(reminderSchedules)
      .innerJoin(orders, eq(reminderSchedules.orderId, orders.id))
      .leftJoin(reminderTemplates, eq(reminderSchedules.templateId, reminderTemplates.id))
      .innerJoin(contacts, eq(orders.contactId, contacts.id))
      .where(and(
        eq(reminderSchedules.id, scheduleId),
        eq(reminderSchedules.userId, userId)
      ));
    
    if (reminderData.length === 0) {
      return res.status(404).json({ message: "Reminder schedule not found" });
    }
    
    const { schedule, order, template, contact } = reminderData[0];
    
    // Check if contact has email
    if (!contact.email) {
      return res.status(400).json({ message: "Customer doesn't have an email" });
    }
    
    // Determine subject and body to use
    let subject = schedule.customSubject || (template ? template.subject : null);
    let body = schedule.customBody || (template ? template.body : null);
    
    if (!subject || !body) {
      return res.status(400).json({ 
        message: "Missing subject or body. Either set custom message or use a template" 
      });
    }
    
    // Replace placeholders in the templates
    const placeholders = {
      '[ORDER_NUMBER]': order.orderNumber,
      '[CUSTOMER_NAME]': `${contact.firstName} ${contact.lastName}`,
      '[CUSTOMER_FIRST_NAME]': contact.firstName,
      '[AMOUNT_DUE]': order.total.toString(),
      '[DUE_DATE]': order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'N/A',
      '[DAYS_REMAINING]': order.dueDate ? 
        Math.max(0, Math.ceil((new Date(order.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))).toString() 
        : 'N/A',
      '[BUSINESS_NAME]': 'Your Business Name' // TODO: Get from user settings
    };
    
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Send the email
    const emailResult = await emailService.sendEmail({
      to: contact.email,
      from: 'noreply@bakegenie.com', // TODO: Use user's email
      subject: subject,
      html: body
    });
    
    if (!emailResult) {
      return res.status(500).json({ message: "Failed to send email" });
    }
    
    // Record the reminder in history
    const [reminderRecord] = await db
      .insert(reminderHistory)
      .values({
        scheduleId,
        orderId: order.id,
        sentTo: contact.email,
        subject,
        body,
        status: 'sent'
      })
      .returning();
    
    // Update the reminder schedule with last sent date
    await db
      .update(reminderSchedules)
      .set({
        lastSent: new Date(),
        nextSend: null, // Clear next send since we just sent manually
        updatedAt: new Date()
      })
      .where(eq(reminderSchedules.id, scheduleId));
    
    return res.status(200).json({ 
      message: "Reminder sent successfully",
      reminderRecord
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return res.status(500).json({ message: "Error sending reminder" });
  }
});

export default router;