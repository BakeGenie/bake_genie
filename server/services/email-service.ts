import sgMail from '@sendgrid/mail';
import { User, Order, Contact, Settings } from '@shared/schema';
import { users, orders, contacts, settings as settingsTable } from '@shared/schema';
import { db } from '../db';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

/**
 * Format a number as currency
 */
function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email sending will not work.');
}

// Default sender email (can be overridden in settings)
const DEFAULT_FROM_EMAIL = 'notifications@bakegenie.com';
const DEFAULT_FROM_NAME = 'BakeGenie Notifications';

/**
 * Common interface for email data
 */
interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: {
    email: string;
    name: string;
  };
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Only attempt to send if we have a SendGrid API key
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Cannot send email - SENDGRID_API_KEY not configured');
      return false;
    }

    // Set default sender if not provided
    const from = emailData.from || { 
      email: DEFAULT_FROM_EMAIL, 
      name: DEFAULT_FROM_NAME 
    };

    // Send email via SendGrid
    await sgMail.send({
      to: emailData.to,
      from: {
        email: from.email,
        name: from.name
      },
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      trackingSettings: {
        clickTracking: {
          enable: true
        },
        openTracking: {
          enable: true
        }
      }
    });

    console.log(`Email sent successfully to ${emailData.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate an upcoming orders report for a user
 */
export async function generateUpcomingOrdersReport(userId: number): Promise<{
  html: string;
  text: string;
  subject: string;
}> {
  try {
    // Get user settings to determine time range
    const userSettings = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userId));
    
    // Get user info
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (userResult.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult[0];
    const settings = userSettings[0] || { upcomingOrdersFrequency: 'weekly' };
    
    // Set date range based on frequency
    const now = new Date();
    let endDate = new Date();
    
    switch (settings.upcomingOrdersFrequency) {
      case 'daily':
        // Next 24 hours
        endDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        // Next 7 days
        endDate.setDate(now.getDate() + 7);
        break;
      case 'monthly':
      default:
        // Next 30 days
        endDate.setDate(now.getDate() + 30);
        break;
    }
    
    // Get upcoming orders using SQL date comparison
    const upcomingOrders = await db
      .select()
      .from(orders)
      .leftJoin(contacts, eq(orders.contactId, contacts.id))
      .where(
        and(
          eq(orders.userId, userId),
          sql`${orders.eventDate} >= ${now.toISOString()}`,
          sql`${orders.eventDate} <= ${endDate.toISOString()}`,
          eq(orders.status, 'Confirmed')
        )
      );
    
    // Generate HTML content
    let htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          h1, h2 { color: #2563eb; }
          .order { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
          .order-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
          .event-date { color: #2563eb; font-weight: bold; }
          .customer { margin-bottom: 10px; }
          .items { margin-top: 10px; }
          .total { font-weight: bold; margin-top: 10px; text-align: right; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Upcoming Orders for ${user.firstName} ${user.lastName}</h1>
        
        <div class="summary">
          <p>This is your ${settings.upcomingOrdersFrequency} upcoming orders report from BakeGenie.</p>
          <p>You have <strong>${upcomingOrders.length}</strong> upcoming orders between ${now.toLocaleDateString()} and ${endDate.toLocaleDateString()}.</p>
        </div>
    `;
    
    // No orders message
    if (upcomingOrders.length === 0) {
      htmlContent += `
        <p>You don't have any upcoming orders for this period.</p>
      `;
    } else {
      // Orders table
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Event Date</th>
              <th>Event Type</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      // Add each order
      upcomingOrders.forEach(order => {
        const { orders: orderData, contacts: contactData } = order;
        htmlContent += `
          <tr>
            <td>${orderData.orderNumber}</td>
            <td>${contactData ? `${contactData.firstName} ${contactData.lastName}` : 'Unknown Customer'}</td>
            <td>${new Date(orderData.eventDate).toLocaleDateString()}</td>
            <td>${orderData.eventType}</td>
            <td>${formatCurrency(Number(orderData.total), settings.currency || 'USD')}</td>
            <td>${orderData.status}</td>
          </tr>
        `;
      });
      
      htmlContent += `
          </tbody>
        </table>
      `;
    }
    
    // Footer
    htmlContent += `
        <div class="footer">
          <p>This email was sent from BakeGenie, your bakery business management system.</p>
          <p>You can change your email preferences in your account settings.</p>
        </div>
      </body>
      </html>
    `;
    
    // Generate plain text content
    const textContent = `
Upcoming Orders for ${user.firstName} ${user.lastName}

This is your ${settings.upcomingOrdersFrequency} upcoming orders report from BakeGenie.

You have ${upcomingOrders.length} upcoming orders between ${now.toLocaleDateString()} and ${endDate.toLocaleDateString()}.

${upcomingOrders.map(order => {
  const { orders: orderData, contacts: contactData } = order;
  return `
Order #: ${orderData.orderNumber}
Customer: ${contactData ? `${contactData.firstName} ${contactData.lastName}` : 'Unknown'}
Event Date: ${new Date(orderData.eventDate).toLocaleDateString()}
Event Type: ${orderData.eventType}
Total: ${formatCurrency(Number(orderData.total), settings.currency || 'USD')}
Status: ${orderData.status}
  `;
}).join('\n')}

This email was sent from BakeGenie, your bakery business management system.
You can change your email preferences in your account settings.
    `;
    
    return {
      html: htmlContent,
      text: textContent,
      subject: `Your ${settings.upcomingOrdersFrequency} Upcoming Orders Report`
    };
  } catch (error) {
    console.error('Error generating upcoming orders report:', error);
    return {
      html: '<p>Sorry, we could not generate your upcoming orders report. Please check your BakeGenie dashboard.</p>',
      text: 'Sorry, we could not generate your upcoming orders report. Please check your BakeGenie dashboard.',
      subject: 'Your Upcoming Orders Report'
    };
  }
}

/**
 * Send an upcoming orders report to a user
 */
export async function sendUpcomingOrdersReport(userId: number): Promise<boolean> {
  try {
    // Get user settings to check if they want to receive reports
    const userSettings = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.userId, userId));
    
    // Get user info
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (userResult.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult[0];
    const settings = userSettings[0];
    
    // Check if user wants to receive reports
    if (!settings || !settings.receiveUpcomingOrders) {
      console.log(`User ${userId} has not opted to receive order reports. Skipping.`);
      return false;
    }
    
    // Get email address to send to
    const toEmail = settings.emailAddress || user.email;
    
    if (!toEmail) {
      console.error(`No email address found for user ${userId}`);
      return false;
    }
    
    // Generate the report
    const report = await generateUpcomingOrdersReport(userId);
    
    // Send the email
    return await sendEmail({
      to: toEmail,
      subject: report.subject,
      html: report.html,
      text: report.text,
      from: {
        email: DEFAULT_FROM_EMAIL,
        name: DEFAULT_FROM_NAME
      }
    });
  } catch (error) {
    console.error('Error sending upcoming orders report:', error);
    return false;
  }
}

/**
 * Send payment reminders for upcoming or overdue payments
 */
export async function sendPaymentReminders(userId: number): Promise<boolean> {
  // Implementation for payment reminders will go here
  // This will be similar to the upcoming orders report but focused on payments
  return true;
}