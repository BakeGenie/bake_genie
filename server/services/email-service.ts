import sgMail from '@sendgrid/mail';
import { db } from '../db';
import { users, orders } from '@shared/schema';
import { eq, and, lt, gte } from 'drizzle-orm';
import { addDays, format } from 'date-fns';

if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html: string;
  cc?: string;
  bcc?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    await sgMail.send(emailData);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a subscription cancellation confirmation email
 */
export async function sendCancellationEmail(
  userEmail: string,
  userName: string,
  effectiveDate: Date
): Promise<boolean> {
  // Format the date in a readable format
  const formattedDate = effectiveDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const emailContent = {
    to: userEmail,
    from: 'noreply@bakegenie.co',
    subject: 'Your BakeGenie Subscription Cancellation Confirmation',
    cc: 'support@bakegenie.co', // Send a copy to support
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ff6b6b;">BakeGenie</h1>
        </div>
        <div>
          <h2>Subscription Cancellation Confirmation</h2>
          <p>Dear ${userName},</p>
          <p>We're sorry to see you go! This email confirms that your BakeGenie subscription has been cancelled as requested.</p>
          <p>Your subscription will remain active until the end of your current billing period on <strong>${formattedDate}</strong>.</p>
          <p>Until then, you'll continue to have full access to all BakeGenie features and services.</p>
          <p>If you change your mind or cancelled by mistake, please contact our support team at <a href="mailto:support@bakegenie.co">support@bakegenie.co</a> as soon as possible.</p>
          <p>We hope to welcome you back in the future!</p>
          <p>Warm regards,</p>
          <p>The BakeGenie Team</p>
        </div>
      </div>
    `
  };

  return await sendEmail(emailContent);
}

/**
 * Send upcoming orders report to a user
 */
export async function sendUpcomingOrdersReport(userId: number): Promise<boolean> {
  try {
    // Get user information
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email`);
      return false;
    }

    // Get upcoming orders for the next 14 days
    const today = new Date();
    const twoWeeksFromNow = addDays(today, 14);
    
    const upcomingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          gte(orders.eventDate, today),
          lt(orders.eventDate, twoWeeksFromNow)
        )
      );
    
    // Format orders for display
    const ordersList = upcomingOrders.map(order => {
      const eventDate = order.eventDate instanceof Date 
        ? format(order.eventDate, 'EEEE, MMMM do, yyyy') 
        : 'Date not available';
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.orderNumber}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.customerName || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${eventDate}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.eventType}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.status}</td>
        </tr>
      `;
    }).join('');
    
    const emailContent = {
      to: user.email,
      from: 'noreply@bakegenie.co',
      subject: 'Your Upcoming Orders Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff6b6b;">BakeGenie</h1>
          </div>
          <div>
            <h2>Upcoming Orders Report</h2>
            <p>Dear ${user.firstName},</p>
            <p>Here is your upcoming orders report for the next 14 days:</p>
            
            ${upcomingOrders.length > 0 
              ? `<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Order #</th>
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Customer</th>
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Event Date</th>
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Event Type</th>
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ordersList}
                  </tbody>
                </table>`
              : '<p>You have no upcoming orders in the next 14 days.</p>'
            }
            
            <p style="margin-top: 20px;">Log in to your BakeGenie account for more details.</p>
            <p>Warm regards,</p>
            <p>The BakeGenie Team</p>
          </div>
        </div>
      `
    };

    return await sendEmail(emailContent);
  } catch (error) {
    console.error('Error sending upcoming orders report:', error);
    return false;
  }
}

/**
 * Send payment reminders for outstanding invoices
 */
export async function sendPaymentReminders(userId: number): Promise<boolean> {
  try {
    // Get user information
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.email) {
      console.error(`User ${userId} not found or has no email`);
      return false;
    }

    // Get orders that need payment (status = Confirmed but not Paid)
    const unpaidOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, userId),
          eq(orders.status, 'Confirmed')
        )
      );
    
    if (unpaidOrders.length === 0) {
      // No unpaid orders, no need to send reminders
      return true;
    }
    
    // Format orders for display
    const ordersList = unpaidOrders.map(order => {
      const eventDate = order.eventDate instanceof Date 
        ? format(order.eventDate, 'MMMM do, yyyy') 
        : 'Date not available';
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.orderNumber}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${order.customerName || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${eventDate}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">$${order.total}</td>
        </tr>
      `;
    }).join('');
    
    const emailContent = {
      to: user.email,
      from: 'noreply@bakegenie.co',
      subject: 'Payment Reminder for Your Orders',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff6b6b;">BakeGenie</h1>
          </div>
          <div>
            <h2>Payment Reminder</h2>
            <p>Dear ${user.firstName},</p>
            <p>This is a friendly reminder that you have the following orders awaiting payment:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Order #</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Customer</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Event Date</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${ordersList}
              </tbody>
            </table>
            
            <p style="margin-top: 20px;">Please log in to your BakeGenie account to process these payments.</p>
            <p>Warm regards,</p>
            <p>The BakeGenie Team</p>
          </div>
        </div>
      `
    };

    return await sendEmail(emailContent);
  } catch (error) {
    console.error('Error sending payment reminders:', error);
    return false;
  }
}