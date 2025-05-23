import { Router } from 'express';
import { db } from '../db';
import { quotes, contacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Helper function to format date strings into ISO format
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
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

// Process the CSV data and import it into the database
router.post('/api/quotes/import', async (req, res) => {
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
    
    // Use a single transaction for all imports
    try {
      // Start transaction
      await db.execute('BEGIN');
      
      // Process each record
      for (let index = 0; index < records.length; index++) {
        const record = records[index];
        
        try {
          // Map CSV columns to database fields based on user selection
          const rowNum = index + 1; // 1-based for error messages
          
          // Get required fields with fallbacks
          const quoteNumber = columnMapping.quote_number && record[columnMapping.quote_number] 
            ? String(record[columnMapping.quote_number]) 
            : `QT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
          const contactName = columnMapping.contact_name ? record[columnMapping.contact_name] : null;
          const eventDate = columnMapping.event_date ? parseDate(record[columnMapping.event_date]) : null;
          const eventType = columnMapping.event_type ? record[columnMapping.event_type] : null;
          const description = columnMapping.description ? record[columnMapping.description] : '';
          const price = columnMapping.price ? parseCurrency(record[columnMapping.price]) : 0;
          const status = columnMapping.status ? record[columnMapping.status] : 'Draft';
          const notes = columnMapping.notes ? record[columnMapping.notes] : '';
          const expiryDate = columnMapping.expiry_date ? parseDate(record[columnMapping.expiry_date]) : null;
          
          // Find or create contact if name is provided
          let contactId = null;
          if (contactName) {
            // Look for existing contact
            const [existingContact] = await db.execute(
              `SELECT id FROM contacts WHERE LOWER(first_name || ' ' || last_name) = LOWER($1) AND user_id = $2 LIMIT 1`,
              [contactName, userId]
            );
            
            if (existingContact) {
              contactId = existingContact.id;
            } else {
              // Split name into first and last name
              const nameParts = contactName.trim().split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              // Create new contact
              const [newContact] = await db.execute(
                `INSERT INTO contacts (user_id, first_name, last_name, created_at, updated_at) 
                VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
                [userId, firstName, lastName]
              );
              
              contactId = newContact.id;
            }
          }
          
          // Generate quote SQL - using direct SQL to avoid ORM issues
          const sql = `
            INSERT INTO quotes (
              quote_number, user_id, contact_id, event_date, event_type, 
              status, price, description, notes, expiry_date, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
            )
            ON CONFLICT (quote_number) DO UPDATE SET
              contact_id = $3,
              event_date = $4,
              event_type = $5,
              status = $6,
              price = $7,
              description = $8,
              notes = $9,
              expiry_date = $10,
              updated_at = NOW()
            RETURNING id
          `;
          
          const [insertedQuote] = await db.execute(sql, [
            quoteNumber,
            userId,
            contactId,
            eventDate,
            eventType,
            status,
            price,
            description,
            notes,
            expiryDate
          ]);
          
          results.successCount++;
          results.successDetails.push({
            id: insertedQuote.id,
            quoteNumber,
            contactName,
            eventDate,
            eventType,
            status,
            price
          });
          
        } catch (error: any) {
          console.error(`Error importing row ${index + 1}:`, error);
          results.errorCount++;
          results.errors.push({
            row: index + 1,
            message: error.message || 'Unknown error occurred while processing this row',
          });
        }
      }
      
      // Commit transaction
      await db.execute('COMMIT');
      
    } catch (error) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw error;
    }
    
    // Generate response message
    let message = '';
    if (results.successCount > 0) {
      message += `Successfully imported ${results.successCount} quotes. `;
    }
    if (results.errorCount > 0) {
      message += `Failed to import ${results.errorCount} quotes.`;
    }
    
    // Return the results
    return res.status(200).json({
      success: results.successCount > 0,
      successCount: results.successCount,
      errorCount: results.errorCount,
      errors: results.errors,
      message,
    });
  } catch (error: any) {
    console.error('Error in quote import:', error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message || 'Unknown error occurred'}`,
    });
  }
});

export default router;