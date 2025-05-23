import { parse } from 'csv-parse';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { 
  contacts, 
  orders, 
  orderItems, 
  quotes, 
  quoteItems, 
  InsertOrder, 
  InsertOrderItem, 
  InsertQuote, 
  InsertQuoteItem, 
  InsertContact,
  orderStatusTypes, 
  deliveryTypes,
  eventTypes
} from '@shared/schema';

// Types for the CSV data from BakeGenie
interface BakeDiaryOrder {
  'Order Number': string;
  'Order Date': string;
  'Customer Name': string;
  Email: string;
  Phone: string;
  'Event Type': string;
  'Event Date': string;
  Status: string;
  'Delivery Type': string;
  'Delivery Address'?: string;
  'Total Amount': string;
  'Amount Paid': string;
  Notes?: string;
}

interface BakeDiaryOrderItem {
  'Order Number': string;
  'Item Name': string;
  Description?: string;
  Quantity: string;
  Price: string;
}

interface BakeDiaryQuote {
  'Quote Number': string;
  'Quote Date': string;
  'Customer Name': string;
  Email: string;
  Phone: string;
  'Event Type': string;
  'Event Date': string;
  Status: string;
  'Delivery Type': string;
  'Delivery Address'?: string;
  'Total Amount': string;
  'Expiry Date': string;
  Notes?: string;
}

export class CSVImportService {
  async parseCSVFile(fileData: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      parse(fileData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  }

  identifyCsvType(csvData: any[]): 'orders' | 'quotes' | 'orderItems' | 'unknown' {
    if (csvData.length === 0) return 'unknown';
    
    const firstRow = csvData[0];
    
    // Check for Order List CSV
    if ('Order Number' in firstRow && 'Status' in firstRow && 'Event Date' in firstRow) {
      return 'orders';
    }
    
    // Check for Order Items CSV
    if ('Order Number' in firstRow && 'Item Name' in firstRow && 'Price' in firstRow) {
      return 'orderItems';
    }
    
    // Check for Quote List CSV
    if ('Quote Number' in firstRow && 'Status' in firstRow && 'Event Date' in firstRow) {
      return 'quotes';
    }
    
    return 'unknown';
  }

  async importBakeGenieOrders(orderData: BakeDiaryOrder[], userId: number): Promise<{ success: boolean; imported: number; errors: number; message: string }> {
    let imported = 0;
    let errors = 0;
    let errorMessages: string[] = [];
    
    for (const order of orderData) {
      try {
        // First, find or create the contact
        const contactName = order['Customer Name']?.split(' ') || ['', ''];
        const firstName = contactName[0] || '';
        const lastName = contactName.slice(1).join(' ') || '';
        
        // Check if contact exists
        let contactId: number;
        const existingContacts = await db.select().from(contacts).where(
          eq(contacts.email, order.Email || '')
        );
        
        if (existingContacts.length > 0) {
          contactId = existingContacts[0].id;
        } else {
          // Create new contact
          const newContact: InsertContact = {
            userId,
            firstName,
            lastName,
            email: order.Email || null,
            phone: order.Phone || null,
            address: null,
            businessName: null,
            notes: null
          };
          
          const [contact] = await db.insert(contacts).values(newContact).returning();
          contactId = contact.id;
        }
        
        // Normalize event type
        let eventType = order['Event Type'];
        if (!eventTypes.includes(eventType as any)) {
          eventType = 'Other';
        }
        
        // Normalize delivery type
        let deliveryType = order['Delivery Type'];
        if (!deliveryTypes.includes(deliveryType as any)) {
          deliveryType = 'Pickup';
        }
        
        // Normalize status
        let status = order.Status;
        if (!orderStatusTypes.includes(status as any)) {
          status = 'Quote';
        }
        
        // Create the order
        const newOrder: InsertOrder = {
          userId,
          contactId,
          orderNumber: order['Order Number'],
          title: null,
          eventType: eventType as any,
          eventDate: new Date(order['Event Date']).toISOString(),
          status: status as any,
          deliveryType: deliveryType as any,
          deliveryAddress: order['Delivery Address'] || null,
          deliveryFee: "0.00",
          deliveryTime: null,
          totalAmount: order['Total Amount'],
          amountPaid: order['Amount Paid'] || "0.00",
          specialInstructions: null,
          taxRate: "0",
          notes: order.Notes || null
        };
        
        await db.insert(orders).values(newOrder);
        imported++;
      } catch (error) {
        console.error('Error importing order:', error);
        errors++;
        errorMessages.push(`Error importing order ${order['Order Number']}: ${(error as Error).message}`);
      }
    }
    
    return {
      success: errors === 0,
      imported,
      errors,
      message: `Imported ${imported} orders with ${errors} errors.${errorMessages.length > 0 ? '\n' + errorMessages.join('\n') : ''}`
    };
  }

  async importBakeGenieQuotes(quoteData: BakeDiaryQuote[], userId: number): Promise<{ success: boolean; imported: number; errors: number; message: string }> {
    let imported = 0;
    let errors = 0;
    let errorMessages: string[] = [];
    
    for (const quote of quoteData) {
      try {
        // First, find or create the contact
        const contactName = quote['Customer Name']?.split(' ') || ['', ''];
        const firstName = contactName[0] || '';
        const lastName = contactName.slice(1).join(' ') || '';
        
        // Check if contact exists
        let contactId: number;
        const existingContacts = await db.select().from(contacts).where(
          eq(contacts.email, quote.Email || '')
        );
        
        if (existingContacts.length > 0) {
          contactId = existingContacts[0].id;
        } else {
          // Create new contact
          const newContact: InsertContact = {
            userId,
            firstName,
            lastName,
            email: quote.Email || null,
            phone: quote.Phone || null,
            address: null,
            businessName: null,
            notes: null
          };
          
          const [contact] = await db.insert(contacts).values(newContact).returning();
          contactId = contact.id;
        }
        
        // Normalize event type
        let eventType = quote['Event Type'];
        if (!eventTypes.includes(eventType as any)) {
          eventType = 'Other';
        }
        
        // Normalize delivery type
        let deliveryType = quote['Delivery Type'];
        if (!deliveryTypes.includes(deliveryType as any)) {
          deliveryType = 'Pickup';
        }
        
        // Create the quote
        const newQuote: InsertQuote = {
          userId,
          contactId,
          quoteNumber: quote['Quote Number'],
          title: null,
          eventType: eventType as any,
          eventDate: new Date(quote['Event Date']).toISOString(),
          status: 'Draft' as any, // Quote status is different in BakeGenie
          deliveryType: deliveryType as any,
          deliveryAddress: quote['Delivery Address'] || null,
          deliveryFee: "0.00",
          totalAmount: quote['Total Amount'],
          specialInstructions: null,
          expiryDate: new Date(quote['Expiry Date'] || new Date()).toISOString(),
          taxRate: "0",
          notes: quote.Notes || null
        };
        
        await db.insert(quotes).values(newQuote);
        imported++;
      } catch (error) {
        console.error('Error importing quote:', error);
        errors++;
        errorMessages.push(`Error importing quote ${quote['Quote Number']}: ${(error as Error).message}`);
      }
    }
    
    return {
      success: errors === 0,
      imported,
      errors,
      message: `Imported ${imported} quotes with ${errors} errors.${errorMessages.length > 0 ? '\n' + errorMessages.join('\n') : ''}`
    };
  }

  async importBakeGenieOrderItems(itemData: BakeDiaryOrderItem[], userId: number): Promise<{ success: boolean; imported: number; errors: number; message: string }> {
    let imported = 0;
    let errors = 0;
    let errorMessages: string[] = [];
    
    // Group items by order number
    const itemsByOrder: Record<string, BakeDiaryOrderItem[]> = {};
    
    for (const item of itemData) {
      const orderNumber = item['Order Number'];
      if (!itemsByOrder[orderNumber]) {
        itemsByOrder[orderNumber] = [];
      }
      itemsByOrder[orderNumber].push(item);
    }
    
    // Process each order's items
    for (const [orderNumber, items] of Object.entries(itemsByOrder)) {
      try {
        // Find the order
        const orderResult = await db.select().from(orders).where(
          eq(orders.orderNumber, orderNumber)
        );
        
        if (orderResult.length === 0) {
          throw new Error(`Order ${orderNumber} not found`);
        }
        
        const orderId = orderResult[0].id;
        
        // Import items for this order
        for (const item of items) {
          try {
            const newItem: InsertOrderItem = {
              orderId,
              name: item['Item Name'],
              description: item.Description || null,
              quantity: parseInt(item.Quantity) || 1,
              price: item.Price
            };
            
            await db.insert(orderItems).values(newItem);
            imported++;
          } catch (error) {
            console.error('Error importing order item:', error);
            errors++;
            errorMessages.push(`Error importing item for order ${orderNumber}: ${(error as Error).message}`);
          }
        }
      } catch (error) {
        console.error('Error processing order items:', error);
        errors++;
        errorMessages.push(`Error processing items for order ${orderNumber}: ${(error as Error).message}`);
      }
    }
    
    return {
      success: errors === 0,
      imported,
      errors,
      message: `Imported ${imported} order items with ${errors} errors.${errorMessages.length > 0 ? '\n' + errorMessages.join('\n') : ''}`
    };
  }
}

export const csvImportService = new CSVImportService();