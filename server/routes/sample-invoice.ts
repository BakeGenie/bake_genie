import { Router, Request, Response } from "express";
import { invoiceService } from "../services/invoice";

const router = Router();

/**
 * Get sample invoice HTML
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // If there are orders in the system, use the first one as a sample
    // In a real implementation, this would use either a dummy order or
    // fetch based on permissions/user criteria
    
    // For this demo, we'll try to fetch the first order
    // Get parameter order ID from URL query or use 1 as default
    const orderId = req.query.orderId ? parseInt(req.query.orderId as string) : 1;
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const { html } = await invoiceService.generateInvoiceHtml(orderId);
    
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: any) {
    console.error("Error generating sample invoice:", error);
    
    // Create a message indicating no invoice data is available
    const noInvoiceData = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice Preview</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 40px;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #555;
            font-size: 24px;
            margin-bottom: 20px;
          }
          p {
            font-size: 16px;
            margin-bottom: 15px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 20px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">📄</div>
          <h1>No Invoice Data Available</h1>
          <p>You need to create orders in the system to generate invoices.</p>
          <p>Once you have created an order, you will be able to preview and send invoices based on real order data.</p>
        </div>
      </body>
      </html>
    `;
    
    res.setHeader("Content-Type", "text/html");
    res.send(noInvoiceData);
  }
});

export { router };