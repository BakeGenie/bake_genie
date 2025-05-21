import { db } from '../db';
import { eq, gte, lt, and } from 'drizzle-orm';
import { orders, users, contacts, settings } from '@shared/schema';
import { format, addDays } from 'date-fns';

/**
 * Send upcoming orders report to a user
 */
export async function sendUpcomingOrdersReport(userId: number): Promise<boolean> {
  try {
    console.log(`Generating upcoming orders report for user ${userId}`);
    
    // Here we would query upcoming orders and send an email
    // This is a stub implementation that logs instead of sending an actual email
    
    // Get the user
    const userResults = await db.select().from(users).where(eq(users.id, userId));
    if (userResults.length === 0) {
      console.error(`User ${userId} not found for sending upcoming orders report`);
      return false;
    }
    
    const user = userResults[0];
    
    // Get user settings
    const settingsResults = await db.select().from(settings).where(eq(settings.userId, userId));
    if (settingsResults.length === 0) {
      console.error(`Settings not found for user ${userId} for sending upcoming orders report`);
      return false;
    }
    
    const userSettings = settingsResults[0];
    
    // Get upcoming orders (next 7 days)
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    const upcomingOrdersResults = await db
      .select({
        order: orders,
        contact: contacts
      })
      .from(orders)
      .leftJoin(contacts, eq(orders.contactId, contacts.id))
      .where(
        and(
          eq(orders.userId, userId),
          gte(orders.eventDate, today.toISOString()),
          lt(orders.eventDate, nextWeek.toISOString())
        )
      );
    
    console.log(`Found ${upcomingOrdersResults.length} upcoming orders for user ${userId}`);
    
    // In a real implementation, we would use a template to format this
    // and send an actual email using the email service
    const reportContent = `
Upcoming Orders Report for ${user.firstName} ${user.lastName}
Generated on ${format(today, 'yyyy-MM-dd')}

You have ${upcomingOrdersResults.length} upcoming orders in the next 7 days:

${upcomingOrdersResults.map((row, index) => `
${index + 1}. Order #${row.order.orderNumber} - ${format(new Date(row.order.eventDate), 'yyyy-MM-dd')}
   Customer: ${row.contact?.firstName || ''} ${row.contact?.lastName || ''}
   Event Type: ${row.order.eventType}
   Status: ${row.order.status}
   Amount: ${row.order.totalAmount}
`).join('')}

Thank you for using BakeGenie!
`;
    
    console.log(`Upcoming orders report would be sent to ${user.email}:`);
    console.log(reportContent);
    
    return true;
  } catch (error) {
    console.error(`Error generating upcoming orders report for user ${userId}:`, error);
    return false;
  }
}

/**
 * Send payment reminders for outstanding invoices
 */
export async function sendPaymentReminders(userId: number): Promise<boolean> {
  try {
    console.log(`Generating payment reminders for user ${userId}`);
    
    // Here we would query orders with outstanding payments and send reminders
    // This is a stub implementation that logs instead of sending actual emails
    
    // Get the user
    const userResults = await db.select().from(users).where(eq(users.id, userId));
    if (userResults.length === 0) {
      console.error(`User ${userId} not found for sending payment reminders`);
      return false;
    }
    
    const user = userResults[0];
    
    // Get orders with outstanding payments
    const outstandingOrdersResults = await db
      .select({
        order: orders,
        contact: contacts
      })
      .from(orders)
      .leftJoin(contacts, eq(orders.contactId, contacts.id))
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, 'Confirmed')
        )
      );
    
    // Filter to only include orders where amount paid is less than total amount
    const ordersWithOutstandingPayments = outstandingOrdersResults.filter(row => 
      parseFloat(row.order.amountPaid) < parseFloat(row.order.totalAmount)
    );
    
    console.log(`Found ${ordersWithOutstandingPayments.length} orders with outstanding payments for user ${userId}`);
    
    // In a real implementation, we would use a template to format this
    // and send actual emails to customers
    for (const row of ordersWithOutstandingPayments) {
      const outstandingAmount = (
        parseFloat(row.order.totalAmount) - parseFloat(row.order.amountPaid)
      ).toFixed(2);
      
      const reminderContent = `
Payment Reminder for Order #${row.order.orderNumber}

Dear ${row.contact?.firstName || ''} ${row.contact?.lastName || ''},

This is a friendly reminder that you have an outstanding payment of $${outstandingAmount} 
for your order #${row.order.orderNumber}.

Order Details:
- Event Type: ${row.order.eventType}
- Event Date: ${format(new Date(row.order.eventDate), 'yyyy-MM-dd')}
- Total Amount: $${row.order.totalAmount}
- Amount Paid: $${row.order.amountPaid}
- Balance Due: $${outstandingAmount}

Please arrange for the payment at your earliest convenience. If you have already made the payment,
please disregard this reminder.

Thank you for your business!

Regards,
${user.firstName} ${user.lastName}
`;
      
      console.log(`Payment reminder would be sent to ${row.contact?.email}:`);
      console.log(reminderContent);
    }
    
    return true;
  } catch (error) {
    console.error(`Error generating payment reminders for user ${userId}:`, error);
    return false;
  }
}