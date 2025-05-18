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
    
    // Create a simple sample invoice if no orders exist
    const sampleInvoice = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Sample Invoice</title>
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
          .product-image {
            width: 50px;
            height: 50px;
            border-radius: 4px;
            margin-right: 10px;
            object-fit: cover;
          }
          .product-row {
            display: flex;
            align-items: center;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <div>Invoice #: INV-00001</div>
            <div>Date: May 18, 2025</div>
          </div>
          <div class="business-info">
            <div><strong>BakeGenie Bakery</strong></div>
            <div>123 Flour Street</div>
            <div>Cake City, CA 90210</div>
            <div>Phone: (555) 123-4567</div>
            <div>Email: info@bakegenie.com</div>
          </div>
        </div>
        
        <div class="customer-info">
          <div><strong>Bill To:</strong></div>
          <div>Jane Smith</div>
          <div>456 Sugar Avenue</div>
          <div>Sweet Town, CA 90211</div>
          <div>jane.smith@example.com</div>
          <div>(555) 987-6543</div>
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
            <tr>
              <td>
                <div class="product-row">
                  <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1089&q=80" alt="Birthday Cake" class="product-image" />
                  <div>Birthday Cake - Chocolate with Vanilla Frosting</div>
                </div>
              </td>
              <td>1</td>
              <td>$45.00</td>
              <td>$45.00</td>
            </tr>
            <tr>
              <td>
                <div class="product-row">
                  <img src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1087&q=80" alt="Cupcakes" class="product-image" />
                  <div>Cupcakes - Assorted (Dozen)</div>
                </div>
              </td>
              <td>2</td>
              <td>$24.00</td>
              <td>$48.00</td>
            </tr>
            <tr>
              <td>
                <div class="product-row">
                  <div>Delivery Fee</div>
                </div>
              </td>
              <td>1</td>
              <td>$15.00</td>
              <td>$15.00</td>
            </tr>
          </tbody>
        </table>
        
        <table class="totals">
          <tr>
            <td>Subtotal:</td>
            <td>$93.00</td>
          </tr>
          <tr>
            <td>Tax (8%):</td>
            <td>$7.44</td>
          </tr>
          <tr class="total">
            <td>Total:</td>
            <td>$100.44</td>
          </tr>
        </table>
        
        <div class="footer">
          Thank you for your business! Payment is due within 30 days.
        </div>
      </body>
      </html>
    `;
    
    res.setHeader("Content-Type", "text/html");
    res.send(sampleInvoice);
  }
});

export { router };