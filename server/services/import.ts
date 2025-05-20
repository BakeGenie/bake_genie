import { db } from "../db";
import { orders, quotes, orderItems, contacts } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';
import { eq, sql } from "drizzle-orm";
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { promisify } from 'util';
import { finished } from 'stream';

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
   * Import order list from CSV
   */
  async importOrderList(filePath: string, userId: number): Promise<ImportResult> {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const records = csvParse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Processing ${records.length} order records`);
      
      let processedRows = 0;
      let skippedRows = 0;
      const errors: string[] = [];

      // Process each record
      for (const record of records) {
        try {
          // First check and create contact if needed
          const contactName = record.Contact ? record.Contact.trim() : '';
          if (!contactName) {
            throw new Error('Missing contact name');
          }

          // Split contact name into first/last name (best effort)
          const nameParts = contactName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Check if contact exists
          let contactId;
          const existingContacts = await db.select().from(contacts).where(
            eq(contacts.email, record.Contact_Email || '')
          );
          
          if (existingContacts.length > 0) {
            // Use existing contact
            contactId = existingContacts[0].id;
          } else {
            // Create new contact
            const [newContact] = await db.insert(contacts).values({
              userId,
              firstName,
              lastName,
              email: record['Contact Email'] || '',
              phone: '',
              address: '',
              notes: 'Imported from Bake Diary',
            }).returning();
            
            contactId = newContact.id;
          }

          // Parse event date
          let eventDate: Date;
          try {
            if (record.Event_Date || record['Event Date']) {
              const dateStr = record.Event_Date || record['Event Date'];
              // Handle different date formats
              if (dateStr.includes('-')) {
                // YYYY-MM-DD format
                eventDate = new Date(dateStr);
              } else if (dateStr.includes('/')) {
                // MM/DD/YYYY format
                const [month, day, year] = dateStr.split('/');
                eventDate = new Date(`${year}-${month}-${day}`);
              } else {
                throw new Error(`Unrecognized date format: ${dateStr}`);
              }
            } else {
              // Default to current date if missing
              eventDate = new Date();
            }
          } catch (err) {
            console.error('Date parsing error:', err);
            eventDate = new Date(); // Fallback to current date
          }

          // Parse order status
          const statusMapping: Record<string, string> = {
            '': 'Quote',
            'Booked': 'Confirmed',
            'Paid': 'Paid',
            'Delivered': 'Delivered',
            'Cancelled': 'Cancelled'
          };
          
          const status = statusMapping[record.Status || ''] || 'Quote';
          
          // Parse amounts
          const orderTotal = parseFloat(record.Order_Total || record['Order Total'] || '0');
          const amountOutstanding = parseFloat(record.Amount_Outstanding || record['Amount Outstanding'] || '0');
          const deliveryAmount = parseFloat(record.Delivery_Amount || record['Delivery Amount'] || '0');
          
          // Check if order already exists with this order number
          const orderNumber = parseInt(record.Order_Number || record['Order Number'] || '0', 10);
          const existingOrders = await db.select().from(orders).where(
            sql`${orders.orderNumber} = ${orderNumber.toString()}`
          );
          
          if (existingOrders.length > 0) {
            errors.push(`Order #${orderNumber} already exists, skipping`);
            skippedRows++;
            continue;
          }

          // Create order
          const [newOrder] = await db.insert(orders).values({
            userId,
            contactId,
            orderNumber: orderNumber,
            title: record.Theme || '',
            eventType: record.Event_Type || record['Event Type'] || 'Other',
            eventDate: eventDate,
            status: status,
            deliveryType: deliveryAmount > 0 ? 'Delivery' : 'Pickup',
            deliveryAddress: '',
            deliveryFee: deliveryAmount.toString(),
            totalAmount: orderTotal.toString(),
            amountPaid: (orderTotal - amountOutstanding).toString(),
            specialInstructions: record.Theme || '',
            taxRate: '0',
            notes: 'Imported from Bake Diary',
          }).returning();

          processedRows++;
        } catch (err) {
          console.error('Error processing order record:', err);
          errors.push(`Error processing order: ${record.Order_Number || 'Unknown'} - ${err}`);
          skippedRows++;
        }
      }

      return {
        success: true,
        message: `Successfully imported ${processedRows} orders`,
        processedRows,
        skippedRows,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Order import error:', error);
      return {
        success: false,
        message: `Import failed: ${error}`,
        processedRows: 0,
        skippedRows: 0,
        errors: [`Import failed: ${error}`]
      };
    } finally {
      // Delete temporary file
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
  }

  /**
   * Import quote list from CSV
   */
  async importQuoteList(filePath: string, userId: number): Promise<ImportResult> {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const records = csvParse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Processing ${records.length} quote records`);
      
      let processedRows = 0;
      let skippedRows = 0;
      const errors: string[] = [];

      // Process each record
      for (const record of records) {
        try {
          // First check and create contact if needed
          const contactName = record.Contact ? record.Contact.trim() : '';
          if (!contactName) {
            throw new Error('Missing contact name');
          }

          // Split contact name into first/last name (best effort)
          const nameParts = contactName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Check if contact exists
          let contactId;
          const existingContacts = await db.select().from(contacts).where(
            eq(contacts.firstName, firstName)
          );
          
          if (existingContacts.length > 0) {
            // Use existing contact
            contactId = existingContacts[0].id;
          } else {
            // Create new contact
            const [newContact] = await db.insert(contacts).values({
              userId,
              firstName,
              lastName,
              email: '',
              phone: '',
              address: '',
              notes: 'Imported from Bake Diary',
            }).returning();
            
            contactId = newContact.id;
          }

          // Parse event date
          let eventDate: Date;
          try {
            if (record.Event_Date || record['Event Date']) {
              const dateStr = record.Event_Date || record['Event Date'];
              // Handle different date formats
              if (dateStr.includes('-')) {
                // YYYY-MM-DD format
                eventDate = new Date(dateStr);
              } else if (dateStr.includes('/')) {
                // MM/DD/YYYY format
                const [month, day, year] = dateStr.split('/');
                eventDate = new Date(`${year}-${month}-${day}`);
              } else {
                throw new Error(`Unrecognized date format: ${dateStr}`);
              }
            } else {
              // Default to current date if missing
              eventDate = new Date();
            }
          } catch (err) {
            console.error('Date parsing error:', err);
            eventDate = new Date(); // Fallback to current date
          }
          
          // Parse amounts
          const quoteTotal = parseFloat(record.Order_Total || record['Order Total'] || '0');
          
          // Check if quote already exists with this order number
          const quoteNumber = parseInt(record.Order_Number || record['Order Number'] || '0', 10);
          const existingQuotes = await db.select().from(quotes).where(
            eq(quotes.quoteNumber, quoteNumber)
          );
          
          if (existingQuotes.length > 0) {
            errors.push(`Quote #${quoteNumber} already exists, skipping`);
            skippedRows++;
            continue;
          }

          // Create quote
          const [newQuote] = await db.insert(quotes).values({
            userId,
            contactId,
            quoteNumber: quoteNumber,
            title: record.Theme || '',
            eventType: record.Event_Type || record['Event Type'] || 'Other',
            eventDate: eventDate,
            status: 'Draft', // Default status for quotes
            deliveryType: 'Pickup', // Default to pickup
            deliveryAddress: '',
            deliveryFee: '0',
            totalAmount: quoteTotal.toString(),
            specialInstructions: record.Theme || '',
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            taxRate: '0',
            notes: 'Imported from Bake Diary',
          }).returning();

          processedRows++;
        } catch (err) {
          console.error('Error processing quote record:', err);
          errors.push(`Error processing quote: ${record.Order_Number || 'Unknown'} - ${err}`);
          skippedRows++;
        }
      }

      return {
        success: true,
        message: `Successfully imported ${processedRows} quotes`,
        processedRows,
        skippedRows,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Quote import error:', error);
      return {
        success: false,
        message: `Import failed: ${error}`,
        processedRows: 0,
        skippedRows: 0,
        errors: [`Import failed: ${error}`]
      };
    } finally {
      // Delete temporary file
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
  }

  /**
   * Import order items from CSV
   */
  async importOrderItems(filePath: string, userId: number): Promise<ImportResult> {
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf-8');
      const records = csvParse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      console.log(`Processing ${records.length} order item records`);
      
      let processedRows = 0;
      let skippedRows = 0;
      const errors: string[] = [];

      // Process each record
      for (const record of records) {
        try {
          // Skip total rows
          if (record.Date === 'Total' || !record.Order_Number && !record['Order Number']) {
            skippedRows++;
            continue;
          }

          const orderNumber = parseInt(record.Order_Number || record['Order Number'] || '0', 10);
          
          // Find the order
          const existingOrders = await db.select().from(orders).where(
            eq(orders.orderNumber, orderNumber)
          );
          
          if (existingOrders.length === 0) {
            errors.push(`Order #${orderNumber} not found, skipping item`);
            skippedRows++;
            continue;
          }
          
          const orderId = existingOrders[0].id;
          
          // Parse values
          const itemName = record.Item || '';
          const details = record.Details || '';
          const price = parseFloat(record.Sell_Price || record['Sell Price (excl VAT)'] || '0');
          const quantity = parseInt(record.Servings || '1', 10);
          
          // Create order item
          const [newItem] = await db.insert(orderItems).values({
            orderId,
            name: itemName,
            description: details,
            quantity: quantity,
            price: price.toString(),
          }).returning();

          processedRows++;
        } catch (err) {
          console.error('Error processing order item record:', err);
          errors.push(`Error processing item: ${record.Item || 'Unknown'} - ${err}`);
          skippedRows++;
        }
      }

      return {
        success: true,
        message: `Successfully imported ${processedRows} order items`,
        processedRows,
        skippedRows,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Order items import error:', error);
      return {
        success: false,
        message: `Import failed: ${error}`,
        processedRows: 0,
        skippedRows: 0,
        errors: [`Import failed: ${error}`]
      };
    } finally {
      // Delete temporary file
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }
  }
}

export const importService = new ImportService();