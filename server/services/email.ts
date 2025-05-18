import { MailService } from '@sendgrid/mail';
import { db } from "../db";
import { settings } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize SendGrid mail service
const mailService = new MailService();

interface EmailParams {
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }[];
}

/**
 * Email service for sending emails using SendGrid
 */
export class EmailService {
  /**
   * Send an email using SendGrid
   */
  async sendEmail(params: EmailParams): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key is not configured');
      }

      mailService.setApiKey(process.env.SENDGRID_API_KEY);
      
      await mailService.send({
        to: params.to,
        from: {
          email: params.from,
          name: params.fromName || undefined
        },
        subject: params.subject,
        text: params.text,
        html: params.html,
        attachments: params.attachments
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send an invoice email to a customer
   */
  async sendInvoiceEmail(userId: number, orderId: number, contactEmail: string, invoiceHtml: string, invoicePdf: string): Promise<boolean> {
    try {
      // Get user settings to determine sender email
      const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
      
      if (!userSettings || !userSettings.businessEmail) {
        throw new Error('Sender email not configured in user settings');
      }

      // Prepare email parameters
      const emailParams: EmailParams = {
        to: contactEmail,
        from: userSettings.businessEmail,
        fromName: userSettings.businessName || 'BakeGenie Invoice',
        subject: `Invoice for Order #${orderId}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Invoice for Order #${orderId}</h2>
            <p>Thank you for your order. Please find your invoice attached.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
              ${userSettings.businessName ? `<p>${userSettings.businessName}</p>` : ''}
              ${userSettings.businessAddress ? `<p>${userSettings.businessAddress}</p>` : ''}
              ${userSettings.businessPhone ? `<p>Phone: ${userSettings.businessPhone}</p>` : ''}
              ${userSettings.businessEmail ? `<p>Email: ${userSettings.businessEmail}</p>` : ''}
            </div>
          </div>
        `,
        attachments: [
          {
            content: invoicePdf,
            filename: `Invoice-${orderId}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      return await this.sendEmail(emailParams);
    } catch (error) {
      console.error('Error sending invoice email:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();