import { Router } from 'express';
import { db } from '../db';
import { contacts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { pool } from '../db';

const router = Router();

router.post('/api/quotes/import', async (req, res) => {
  try {
    const { records, columnMapping, userId } = req.body;
    
    if (!records || !columnMapping || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields in request body' 
      });
    }

    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as Array<{ row: number; message: string }>
    };

    // Process each record in the CSV
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Get the contact ID from the contact name, or use a default
        const contactName = getMappedValue(record, columnMapping, 'contact_name');
        let contactId: number = 1; // Default to ID 1 if no contact is found
        
        if (contactName) {
          // Try to find the contact by name (first name + last name or just first name)
          const names = contactName.split(' ');
          const firstName = names[0];
          const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
          
          // Search for contact based on first name (more lenient)
          const existingContacts = await db
            .select()
            .from(contacts)
            .where(eq(contacts.userId, userId));
            
          const foundContact = existingContacts.find(c => {
            const fullName = `${c.firstName} ${c.lastName}`.trim().toLowerCase();
            return fullName.includes(contactName.toLowerCase()) || 
                  c.firstName.toLowerCase().includes(firstName.toLowerCase());
          });
          
          if (foundContact) {
            contactId = foundContact.id;
          }
        }

        // Map CSV columns to database fields using the user's column mapping
        const quoteNumber = getMappedValue(record, columnMapping, 'quote_number');
        const eventType = getMappedValue(record, columnMapping, 'event_type') || 'Other';
        const eventDate = getMappedValue(record, columnMapping, 'event_date');
        const totalAmount = getMappedValue(record, columnMapping, 'total_amount');
        const quoteStatus = getMappedValue(record, columnMapping, 'status') || 'Draft';
        const expiryDate = getMappedValue(record, columnMapping, 'expiry_date');
        const notes = getMappedValue(record, columnMapping, 'notes');
        const description = getMappedValue(record, columnMapping, 'description');

        // Validate required fields
        if (!quoteNumber) {
          throw new Error('Quote number is required');
        }

        // Create direct SQL query to insert quote with the correct field names
        const client = await pool.connect();
        try {
          const insertResult = await client.query(
            `INSERT INTO quotes (
              user_id, quote_number, contact_id, event_type, event_date, 
              status, theme, delivery_type, total_amount, notes, 
              expiry_date, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING id`,
            [
              userId, 
              quoteNumber, 
              contactId,
              eventType || 'Other',
              eventDate ? parseDate(eventDate) : new Date(),
              quoteStatus || 'Draft',
              description || null,
              'Pickup', // Default to Pickup if not specified
              totalAmount || '0.00',
              notes,
              expiryDate ? parseDate(expiryDate) : null,
              new Date(),
              new Date()
            ]
          );
          
          results.successCount++;
        } finally {
          client.release();
        }
      } catch (error: any) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          message: error.message || 'Unknown error'
        });
      }
    }

    // Return the import results
    return res.status(200).json({
      message: `Processed ${records.length} quotes with ${results.successCount} successes and ${results.errorCount} errors.`,
      ...results
    });
  } catch (error: any) {
    console.error('Error in quote import:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred during import'
    });
  }
});

// Helper function to get a value from the record using the column mapping
function getMappedValue(record: any, columnMapping: Record<string, string>, fieldName: string): string | null {
  const csvField = columnMapping[fieldName];
  if (!csvField || csvField === '_none_') {
    return null;
  }
  return record[csvField] || null;
}

// Helper function to parse date strings in various formats
function parseDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Try to handle common date formats
  
  // Format: MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dateString)) {
    const parts = dateString.split('/');
    // Note: JavaScript months are 0-indexed
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  
  // Format: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(dateString)) {
    return new Date(dateString);
  }
  
  // Format with AM/PM: "5/19/2025 12:00:00 AM"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+(AM|PM)$/.test(dateString)) {
    // Remove the time part for simplicity
    const datePart = dateString.split(' ')[0];
    const parts = datePart.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  }
  
  // Try standard parsing as fallback
  const parsedDate = new Date(dateString);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  
  // Return current date if all parsing attempts fail
  console.warn(`Could not parse date: ${dateString}, using current date instead`);
  return new Date();
}

export default router;