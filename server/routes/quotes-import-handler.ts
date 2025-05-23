import { Router } from 'express';
import { db } from '../db';
import { quotes, quoteItems } from '@shared/schema';
import type { InsertQuote, InsertQuoteItem } from '@shared/schema';

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
        // Map CSV columns to database fields using the user's column mapping
        const quoteData: Partial<InsertQuote> = {
          userId: userId,
          quoteNumber: getMappedValue(record, columnMapping, 'quote_number'),
          contactName: getMappedValue(record, columnMapping, 'contact_name'),
          eventDate: getMappedValue(record, columnMapping, 'event_date'),
          eventType: getMappedValue(record, columnMapping, 'event_type'),
          description: getMappedValue(record, columnMapping, 'description'),
          price: getMappedValue(record, columnMapping, 'price'),
          status: getMappedValue(record, columnMapping, 'status') || 'Draft',
          expiryDate: getMappedValue(record, columnMapping, 'expiry_date'),
          notes: getMappedValue(record, columnMapping, 'notes'),
        };

        // Validate required fields
        if (!quoteData.quoteNumber) {
          throw new Error('Quote number is required');
        }

        // Insert the quote into the database
        const [insertedQuote] = await db.insert(quotes)
          .values({
            user_id: userId,
            quote_number: quoteData.quoteNumber,
            contact_name: quoteData.contactName || null,
            event_date: quoteData.eventDate ? new Date(quoteData.eventDate) : null,
            event_type: quoteData.eventType || null,
            description: quoteData.description || null,
            price: quoteData.price || '0.00',
            status: quoteData.status,
            expiry_date: quoteData.expiryDate ? new Date(quoteData.expiryDate) : null,
            notes: quoteData.notes || null,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning();

        // If we have item details in the CSV, create quote items
        // This would be a more advanced feature for future implementation
        
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