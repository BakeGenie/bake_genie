import { db } from "../db";
import { orders, quotes, orderItems, contacts } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';
import { eq, sql } from "drizzle-orm";
import { parse } from 'csv-parse';
import { promisify } from 'util';

// Interface for import results
interface ImportResult {
  success: boolean;
  message: string;
  processedRows: number;
  skippedRows: number;
  errors?: string[];
}

/**
 * Service for importing data from Bake Diary CSV files
 */
export class ImportService {
  
  /**
   * Process a CSV file and return records
   */
  private async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(filePath)
        .pipe(parse({
          columns: true,
          trim: true,
          skip_empty_lines: true
        }))
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve(results));
    });
  }
  
  /**
   * Import order list from CSV
   */
  async importOrderList(filePath: string, userId: number): Promise<ImportResult> {
    try {
      // Parse the CSV file
      const records = await this.parseCSV(filePath);
      
      console.log(`Processing ${records.length} order records`);
      
      let processedRows = 0;
      let skippedRows = 0;
      const errors: string[] = [];
      
      // Process each record
      for (const record of records) {
        try {
          // Skip total rows or empty records
          if (record["Order Number"] === "Total" || !record["Order Number"]) {
            skippedRows++;
            continue;
          }
          
          // Extract contact details
          const contactName = record.Contact?.trim() || '';
          if (!contactName) {
            errors.push(`Missing contact name for order ${record["Order Number"]}`);
            skippedRows++;
            continue;
          }
          
          // Split contact name into first/last name (best effort)
          const nameParts = contactName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Get or create contact
          let contactId;
          const contactEmail = record["Contact Email"] || '';
          
          // Try to find existing contact
          let existingContactResults;
          if (contactEmail) {
            existingContactResults = await db.select().from(contacts).where(
              sql`${contacts.email} = ${contactEmail} AND ${contacts.userId} = ${userId}`
            );
          } else {
            existingContactResults = await db.select().from(contacts).where(
              sql`${contacts.firstName} = ${firstName} AND ${contacts.lastName} = ${lastName} AND ${contacts.userId} = ${userId}`
            );
          }
          
          if (existingContactResults.length > 0) {
            contactId = existingContactResults[0].id;
          } else {
            // Create new contact
            const [newContact] = await db.insert(contacts).values({
              userId,
              firstName,
              lastName,
              email: contactEmail,
              phone: '',
              address: '',
              notes: 'Imported from Bake Diary'
            }).returning();
            
            contactId = newContact.id;
          }
          
          // Parse event date
          let eventDate: Date;
          try {
            const dateString = record["Event Date"];
            if (dateString) {
              if (dateString.includes('-')) {
                // YYYY-MM-DD format
                eventDate = new Date(dateString);
              } else if (dateString.includes('/')) {
                // MM/DD/YYYY format
                const parts = dateString.split('/');
                if (parts.length === 3) {
                  const [month, day, yearPart] = parts;
                  // Extract year from format like "2025"
                  const year = yearPart.split(' ')[0];
                  eventDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                } else {
                  eventDate = new Date();
                }
              } else {
                eventDate = new Date();
              }
            } else {
              eventDate = new Date();
            }
          } catch (err) {
            console.error('Date parsing error:', err);
            eventDate = new Date();
          }
          
          // Map order status
          const statusMapping: Record<string, string> = {
            '': 'Quote',
            'Booked': 'Confirmed',
            'Paid': 'Paid',
            'Delivered': 'Delivered',
            'Cancelled': 'Cancelled'
          };
          
          const status = statusMapping[record.Status || ''] || 'Quote';
          
          // Parse amounts
          const orderTotal = parseFloat(record["Order Total"] || '0');
          const amountOutstanding = parseFloat(record["Amount Outstanding"] || '0');
          const amountPaid = orderTotal - amountOutstanding;
          const deliveryAmount = parseFloat(record["Delivery Amount"] || '0');
          const orderNumber = parseInt(record["Order Number"], 10);
          
          // Check if order already exists
          const existingOrderResults = await db.select().from(orders).where(
            sql`${orders.orderNumber} = ${orderNumber.toString()} AND ${orders.userId} = ${userId}`
          );
          
          if (existingOrderResults.length > 0) {
            errors.push(`Order #${orderNumber} already exists, skipping`);
            skippedRows++;
            continue;
          }
          
          // Create order
          const [newOrder] = await db.insert(orders).values({
            userId,
            contactId,
            orderNumber: orderNumber.toString(),
            theme: record.Theme || '',
            eventType: record["Event Type"] || 'Other',
            eventDate,
            status,
            deliveryType: deliveryAmount > 0 ? 'Delivery' : 'Pickup',
            deliveryDetails: '',
            setupFee: deliveryAmount.toString(),
            total: orderTotal.toString(),
            taxRate: '0',
            notes: 'Imported from Bake Diary',
          }).returning();
          
          processedRows++;
        } catch (err) {
          console.error('Error processing order record:', err);
          errors.push(`Error processing order: ${record["Order Number"] || 'Unknown'} - ${err}`);
          skippedRows++;
        }
      }
      
      // Cleanup temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      return {
        success: processedRows > 0,
        message: `Successfully imported ${processedRows} orders${skippedRows > 0 ? ` (${skippedRows} skipped)` : ''}`,
        processedRows,
        skippedRows,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Order import error:', error);
      // Cleanup temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      return {
        success: false,
        message: `Import failed: ${error}`,
        processedRows: 0,
        skippedRows: 0,
        errors: [`Import failed: ${error}`]
      };
    }
  }
  
  /**
   * Import quote list from CSV
   */
  async importQuoteList(filePath: string, userId: number): Promise<ImportResult> {
    try {
      // Parse the CSV file
      const records = await this.parseCSV(filePath);
      
      console.log(`Processing ${records.length} quote records`);
      
      let processedRows = 0;
      let skippedRows = 0;
      const errors: string[] = [];
      
      // Process each record
      for (const record of records) {
        try {
          // Skip total rows or empty records
          if (record["Order Number"] === "Total" || !record["Order Number"]) {
            skippedRows++;
            continue;
          }
          
          // Extract contact details
          const contactName = record.Contact?.trim() || '';
          if (!contactName) {
            errors.push(`Missing contact name for quote ${record["Order Number"]}`);
            skippedRows++;
            continue;
          }
          
          // Split contact name into first/last name (best effort)
          const nameParts = contactName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Get or create contact
          let contactId;
          
          // Try to find existing contact
          const existingContactResults = await db.select().from(contacts).where(
            sql`${contacts.firstName} = ${firstName} AND ${contacts.lastName} = ${lastName} AND ${contacts.userId} = ${userId}`
          );
          
          if (existingContactResults.length > 0) {
            contactId = existingContactResults[0].id;
          } else {
            // Create new contact
            const [newContact] = await db.insert(contacts).values({
              userId,
              firstName,
              lastName,
              email: '',
              phone: '',
              businessName: '', // Using businessName instead of company to match schema
              address: '',
              notes: 'Imported from Bake Diary'
            }).returning();
            
            contactId = newContact.id;
          }
          
          // Parse event date
          let eventDate: Date;
          try {
            const dateString = record["Event Date"];
            if (dateString) {
              if (dateString.includes('-')) {
                // YYYY-MM-DD format
                eventDate = new Date(dateString);
              } else if (dateString.includes('/')) {
                // MM/DD/YYYY format
                const parts = dateString.split('/');
                if (parts.length === 3) {
                  const [month, day, yearPart] = parts;
                  // Extract year from format like "2025"
                  const year = yearPart.split(' ')[0];
                  eventDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                } else {
                  eventDate = new Date();
                }
              } else {
                eventDate = new Date();
              }
            } else {
              eventDate = new Date();
            }
          } catch (err) {
            console.error('Date parsing error:', err);
            eventDate = new Date();
          }
          
          // Parse amounts
          const quoteTotal = record["Order Total"] ? parseFloat(record["Order Total"]) : 0;
          const quoteNumber = parseInt(record["Order Number"], 10);
          
          // Check if quote already exists
          const existingQuoteResults = await db.select().from(quotes).where(
            sql`${quotes.quoteNumber} = ${quoteNumber.toString()} AND ${quotes.userId} = ${userId}`
          );
          
          if (existingQuoteResults.length > 0) {
            errors.push(`Quote #${quoteNumber} already exists, skipping`);
            skippedRows++;
            continue;
          }
          
          // Create quote - remove 'theme' field which doesn't exist in our schema
          const [newQuote] = await db.insert(quotes).values({
            userId,
            contactId,
            quoteNumber: quoteNumber.toString(),
            eventType: record["Event Type"] || 'Other',
            eventDate,
            status: 'Draft', // Default status for quotes
            deliveryType: 'Pickup', // Default to pickup
            deliveryDetails: '',
            discount: '0',
            discountType: '%',
            setupFee: '0',
            total: quoteTotal.toString(),
            // Store theme in notes field instead
            notes: `${record.Theme || record.Notes || ''}\nImported from Bake Diary`,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            taxRate: '0',
            imageUrls: [],
          }).returning();
          
          processedRows++;
        } catch (err) {
          console.error('Error processing quote record:', err);
          errors.push(`Error processing quote: ${record["Order Number"] || 'Unknown'} - ${err}`);
          skippedRows++;
        }
      }
      
      // Cleanup temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      return {
        success: processedRows > 0,
        message: `Successfully imported ${processedRows} quotes${skippedRows > 0 ? ` (${skippedRows} skipped)` : ''}`,
        processedRows,
        skippedRows,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Quote import error:', error);
      // Cleanup temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      return {
        success: false,
        message: `Import failed: ${error}`,
        processedRows: 0,
        skippedRows: 0,
        errors: [`Import failed: ${error}`]
      };
    }
  }
  
  /**
   * Import order items from CSV
   */
  async importOrderItems(filePath: string, userId: number): Promise<ImportResult> {
    try {
      // Parse the CSV file
      const records = await this.parseCSV(filePath);
      
      console.log(`Processing ${records.length} order item records`);
      
      let processedRows = 0;
      let skippedRows = 0;
      const errors: string[] = [];
      
      // Process each record
      for (const record of records) {
        try {
          // Skip total rows or empty records
          if (record.Date === 'Total' || !record["Order Number"]) {
            skippedRows++;
            continue;
          }
          
          const orderNumber = parseInt(record["Order Number"], 10);
          
          // Find the order
          const existingOrderResults = await db.select().from(orders).where(
            sql`${orders.orderNumber} = ${orderNumber.toString()} AND ${orders.userId} = ${userId}`
          );
          
          if (existingOrderResults.length === 0) {
            errors.push(`Order #${orderNumber} not found for item ${record.Item || 'Unknown'}`);
            skippedRows++;
            continue;
          }
          
          const orderId = existingOrderResults[0].id;
          
          // Parse values
          const itemName = record.Item || '';
          const details = record.Details || '';
          let price = 0;
          
          // Handle different price field names 
          if (record["Sell Price (excl VAT)"]) {
            price = parseFloat(record["Sell Price (excl VAT)"]);
          } else if (record["Sell Price"]) {
            price = parseFloat(record["Sell Price"]);
          }
          
          const quantity = parseInt(record.Servings || '1', 10);
          
          // Create order item
          await db.insert(orderItems).values({
            orderId,
            name: itemName,
            description: details,
            quantity: quantity,
            price: price.toString(),
          });
          
          processedRows++;
        } catch (err) {
          console.error('Error processing order item record:', err);
          errors.push(`Error processing item: ${record.Item || 'Unknown'} - ${err}`);
          skippedRows++;
        }
      }
      
      // Cleanup temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      return {
        success: processedRows > 0,
        message: `Successfully imported ${processedRows} order items${skippedRows > 0 ? ` (${skippedRows} skipped)` : ''}`,
        processedRows,
        skippedRows,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Order items import error:', error);
      // Cleanup temporary file
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      return {
        success: false,
        message: `Import failed: ${error}`,
        processedRows: 0,
        skippedRows: 0,
        errors: [`Import failed: ${error}`]
      };
    }
  }
}

export const importService = new ImportService();