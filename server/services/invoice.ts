import { db } from "../db";
import { orders, orderItems, contacts, settings, products } from "@shared/schema";
import { emailService } from "./email";
import { eq } from "drizzle-orm";

/**
 * Service for generating and sending invoices
 */
export class InvoiceService {
  /**
   * Generate an HTML invoice for an order
   */
  async generateInvoiceHtml(orderId: number): Promise<{ html: string; userId: number }> {
    try {
      // Fetch order with items
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      const userId = order.userId;
      
      // Fetch order items
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      
      // Fetch contact
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, order.contactId));
      
      // Fetch user settings
      const [userSettings] = await db.select().from(settings).where(eq(settings.userId, userId));
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
      const taxRate = order.taxRate ? parseFloat(order.taxRate) : 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      // Format date
      const orderDate = new Date(order.eventDate);
      const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Generate HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice #${order.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #444;
            }
            .business-info {
              text-align: right;
            }
            .customer-info {
              margin-bottom: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f2f2f2;
              text-align: left;
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            .totals {
              width: 300px;
              margin-left: auto;
            }
            .totals td {
              padding: 5px 10px;
            }
            .totals tr.total {
              font-weight: bold;
              font-size: 18px;
            }
            .footer {
              margin-top: 40px;
              color: #777;
              font-size: 12px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div>
              <div class="invoice-title">INVOICE</div>
              <div>Invoice #: ${order.orderNumber}</div>
              <div>Date: ${formattedDate}</div>
            </div>
            <div class="business-info">
              ${userSettings?.businessName ? `<div><strong>${userSettings.businessName}</strong></div>` : ''}
              ${userSettings?.businessAddress ? `<div>${userSettings.businessAddress}</div>` : ''}
              ${userSettings?.businessPhone ? `<div>Phone: ${userSettings.businessPhone}</div>` : ''}
              ${userSettings?.businessEmail ? `<div>Email: ${userSettings.businessEmail}</div>` : ''}
            </div>
          </div>
          
          <div class="customer-info">
            <div><strong>Bill To:</strong></div>
            <div>${contact?.firstName} ${contact?.lastName}</div>
            ${contact?.company ? `<div>${contact.company}</div>` : ''}
            ${contact?.address ? `<div>${contact.address}</div>` : ''}
            ${contact?.email ? `<div>${contact.email}</div>` : ''}
            ${contact?.phone ? `<div>${contact.phone}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${userSettings?.currency || '$'}${parseFloat(item.price).toFixed(2)}</td>
                  <td>${userSettings?.currency || '$'}${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <table class="totals">
            <tr>
              <td>Subtotal:</td>
              <td>${userSettings?.currency || '$'}${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax (${taxRate}%):</td>
              <td>${userSettings?.currency || '$'}${taxAmount.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td>Total:</td>
              <td>${userSettings?.currency || '$'}${total.toFixed(2)}</td>
            </tr>
          </table>
          
          <div class="footer">
            ${userSettings?.invoiceFooter || ''}
          </div>
        </body>
        </html>
      `;
      
      return { html, userId };
    } catch (error) {
      console.error('Error generating invoice HTML:', error);
      throw error;
    }
  }

  /**
   * Convert HTML to PDF (simplified - returns base64 encoded HTML as PDF data)
   */
  async htmlToPdf(html: string): Promise<string> {
    // In a real implementation, we would use a library like puppeteer or html-pdf
    // For now, we'll just return the HTML as base64 to serve as a placeholder
    // This should be replaced with actual PDF generation
    const base64Html = Buffer.from(html).toString('base64');
    return base64Html;
  }

  /**
   * Send an invoice to a customer for a specific order
   */
  async sendInvoice(orderId: number): Promise<boolean> {
    try {
      // Generate invoice HTML
      const { html, userId } = await this.generateInvoiceHtml(orderId);
      
      // Convert to PDF
      const pdfData = await this.htmlToPdf(html);
      
      // Get order and contact details
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      
      if (!order) {
        throw new Error(`Order not found: ${orderId}`);
      }
      
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, order.contactId));
      
      if (!contact || !contact.email) {
        throw new Error(`Contact email not found for order: ${orderId}`);
      }
      
      // Send email with invoice
      return await emailService.sendInvoiceEmail(
        userId,
        orderId,
        contact.email,
        html,
        pdfData
      );
    } catch (error) {
      console.error('Error sending invoice:', error);
      return false;
    }
  }
}

export const invoiceService = new InvoiceService();