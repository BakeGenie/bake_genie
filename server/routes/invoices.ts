import { Router, Request, Response } from "express";
import { invoiceService } from "../services/invoice";

const router = Router();
export { router };

/**
 * Get invoice HTML for an order
 */
router.get("/:orderId", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const { html } = await invoiceService.generateInvoiceHtml(orderId);
    
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: any) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: error.message || "Failed to generate invoice" });
  }
});

/**
 * Download invoice as PDF for an order
 */
router.get("/:orderId/pdf", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const { html } = await invoiceService.generateInvoiceHtml(orderId);
    const pdfData = await invoiceService.htmlToPdf(html);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${orderId}.pdf"`);
    
    // In a real implementation, we would send actual PDF data
    // For now, we're just sending base64 encoded HTML as a placeholder
    res.send(Buffer.from(pdfData, 'base64'));
  } catch (error: any) {
    console.error("Error generating PDF invoice:", error);
    res.status(500).json({ error: error.message || "Failed to generate PDF invoice" });
  }
});

/**
 * Send invoice via email
 */
router.post("/:orderId/send", async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }
    
    const success = await invoiceService.sendInvoice(orderId);
    
    if (success) {
      res.json({ success: true, message: "Invoice sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send invoice" });
    }
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    res.status(500).json({ error: error.message || "Failed to send invoice" });
  }
});