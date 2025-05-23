import { Router } from 'express';
import { db } from '../db';
import { orders, contacts, type Order } from '@shared/schema';
import { eq, SQL, sql } from 'drizzle-orm';

const router = Router();

// Helper function to format date strings into ISO format
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  // Try different date formats
  const dateFormats = [
    // May 19, 2025
    /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
    // 19 May 2025
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
    // 19/05/2025 or 19-05-2025
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,
    // 2025/05/19 or 2025-05-19
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/
  ];
  
  // Try to match one of the formats
  for (const format of dateFormats) {
    const match = dateStr.match(format);
    if (match) {
      try {
        let day, month, year;
        
        if (format === dateFormats[0]) {
          // May 19, 2025
          month = match[1];
          day = match[2];
          year = match[3];
        } else if (format === dateFormats[1]) {
          // 19 May 2025
          day = match[1];
          month = match[2];
          year = match[3];
        } else if (format === dateFormats[2]) {
          // 19/05/2025
          day = match[1];
          month = match[2];
          year = match[3];
        } else {
          // 2025/05/19
          year = match[1];
          month = match[2];
          day = match[3];
        }
        
        // Convert month name to number if needed
        if (isNaN(parseInt(month))) {
          const monthNames = {
            'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
            'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
            'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
            'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
          };
          month = monthNames[month.toLowerCase()] + 1;
        }
        
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toISOString().split('T')[0];
      } catch (e) {
        console.error('Error parsing date:', e);
        continue;
      }
    }
  }
  
  // If all formats fail, try Date constructor as a last resort
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Error parsing date with Date constructor:', e);
  }
  
  return null;
};

// Clean and normalize currency values
const parseCurrency = (value: string): number => {
  if (!value) return 0;
  
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
};

// Check if a value is true or false
const parseBoolean = (value: string): boolean => {
  if (!value) return false;
  
  const lowercaseValue = value.toLowerCase().trim();
  
  return ['true', 'yes', 'y', '1', 'paid', 'complete', 'completed'].includes(lowercaseValue);
};

// Find or create a contact based on name
const findOrCreateContact = async (contactName: string, userId: number) => {
  if (!contactName) return null;
  
  // Try to find an existing contact
  const [existingContact] = await db
    .select()
    .from(contacts)
    .where(sql`LOWER(${contacts.name}) = LOWER(${contactName}) AND ${contacts.userId} = ${userId}`);
  
  if (existingContact) {
    return existingContact.id;
  }
  
  // Create a new contact if none exists
  try {
    const [newContact] = await db
      .insert(contacts)
      .values({
        name: contactName,
        email: null,
        phone: null,
        address: null,
        userId: userId,
      })
      .returning({ id: contacts.id });
    
    return newContact.id;
  } catch (error) {
    console.error('Error creating new contact:', error);
    return null;
  }
};

// Process the CSV data and import it into the database
router.post('/import', async (req, res) => {
  try {
    const { records, columnMapping, userId } = req.body;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records provided for import',
      });
    }
    
    // Results tracking
    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as { row: number; message: string }[],
      successDetails: [] as any[],
    };
    
    // Process each record
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      
      try {
        // Map CSV columns to database fields based on user selection
        const rowNum = index + 1; // 1-based for error messages
        
        // Get the order number from CSV or generate if not provided
        let orderNumber = '';
        if (columnMapping.order_number && record[columnMapping.order_number]) {
          orderNumber = record[columnMapping.order_number].toString();
        } else {
          // Generate a random order number if not provided
          orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }
        
        // Find or create contact if contact name is provided
        let contactId = null;
        if (columnMapping.contact_name && record[columnMapping.contact_name]) {
          contactId = await findOrCreateContact(record[columnMapping.contact_name], userId);
        }
        
        // Map and prepare order data
        const orderData = {
          orderNumber: orderNumber,
          userId: userId,
          contactId: contactId,
          eventDate: columnMapping.event_date ? parseDate(record[columnMapping.event_date]) : null,
          eventType: columnMapping.event_type ? record[columnMapping.event_type] : null,
          status: columnMapping.status ? record[columnMapping.status] : 'Draft',
          deliveryOption: columnMapping.delivery_option ? record[columnMapping.delivery_option] : null,
          deliveryAddress: columnMapping.delivery_address ? record[columnMapping.delivery_address] : null,
          deliveryCost: columnMapping.delivery_cost ? parseCurrency(record[columnMapping.delivery_cost]) : 0,
          total: columnMapping.total ? parseCurrency(record[columnMapping.total]) : 0,
          depositAmount: columnMapping.deposit_amount ? parseCurrency(record[columnMapping.deposit_amount]) : 0,
          depositPaid: columnMapping.deposit_paid ? parseBoolean(record[columnMapping.deposit_paid]) : false,
          balancePaid: columnMapping.balance_paid ? parseBoolean(record[columnMapping.balance_paid]) : false,
          notes: columnMapping.notes ? record[columnMapping.notes] : null,
          description: columnMapping.description ? record[columnMapping.description] : null,
        };
        
        // Check if order already exists
        const [existingOrder] = await db
          .select()
          .from(orders)
          .where(eq(orders.orderNumber, orderNumber));
        
        if (existingOrder) {
          // Update existing order
          await db
            .update(orders)
            .set(orderData)
            .where(eq(orders.id, existingOrder.id));
          
          results.successCount++;
          results.successDetails.push({
            orderNumber: orderNumber,
            updated: true,
            ...orderData
          });
        } else {
          // Insert new order
          const [newOrder] = await db
            .insert(orders)
            .values(orderData)
            .returning();
          
          results.successCount++;
          results.successDetails.push({
            orderNumber: orderNumber,
            updated: false,
            ...orderData
          });
        }
      } catch (error: any) {
        console.error(`Error importing row ${index + 1}:`, error);
        results.errorCount++;
        results.errors.push({
          row: index + 1,
          message: error.message || 'Unknown error occurred while processing this row',
        });
      }
    }
    
    // Generate response message
    let message = '';
    if (results.successCount > 0) {
      message += `Successfully imported ${results.successCount} orders. `;
    }
    if (results.errorCount > 0) {
      message += `Failed to import ${results.errorCount} orders.`;
    }
    
    // Return the results
    return res.status(200).json({
      success: results.successCount > 0,
      ...results,
      message,
    });
  } catch (error: any) {
    console.error('Error in order import:', error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message || 'Unknown error occurred'}`,
    });
  }
});

export default router;