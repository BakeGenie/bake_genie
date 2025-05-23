import { Router } from 'express';
import { db } from '../db';
import { quotes, quoteItems, contacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
        const totalAmount = getMappedValue(record, columnMapping, 'price');
        const quoteStatus = getMappedValue(record, columnMapping, 'status') || 'Draft';
        const expiryDate = getMappedValue(record, columnMapping, 'expiry_date');
        const notes = getMappedValue(record, columnMapping, 'notes');
        const description = getMappedValue(record, columnMapping, 'description');

        // Validate required fields
        if (!quoteNumber) {
          throw new Error('Quote number is required');
        }

        // Create direct SQL query to insert quote with the correct field names
        const insertQuery = `
          INSERT INTO quotes (
            user_id, quote_number, contact_id, event_type, event_date, 
            status, theme, delivery_type, total_amount, notes, 
            expiry_date, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ) RETURNING *
        `;
        
        const insertedQuote = await db.execute(insertQuery, [
          userId, 
          quoteNumber, 
          contactId,
          eventType || 'Other',
          eventDate ? new Date(eventDate) : new Date(),
          quoteStatus || 'Draft',
          description || null,
          'Pickup', // Default to Pickup if not specified
          totalAmount || '0.00',
          notes,
          expiryDate ? new Date(expiryDate) : null,
          new Date(),
          new Date()
        ]);
          .returning();

        results.successCount++;
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

export default router;