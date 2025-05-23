import { Router } from 'express';
import { pool } from '../db'; // Use the raw connection pool instead of the Drizzle instance

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
const parseCurrency = (value: string): string => {
  if (!value) return '0';
  
  // Remove currency symbols and non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return cleaned || '0';
};

// Process CSV data and import it into the database
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
    
    // Create a default contact if needed for all quotes
    const defaultContactId = await ensureDefaultContact(userId);
    
    // Process each record individually
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const client = await pool.connect();
      
      try {
        // Start transaction
        await client.query('BEGIN');
        
        // Generate quote information
        const quoteNumber = columnMapping.quote_number && record[columnMapping.quote_number] 
          ? String(record[columnMapping.quote_number]) 
          : `QT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
        const contactName = columnMapping.contact_name ? record[columnMapping.contact_name] : null;
        const eventDate = columnMapping.event_date ? parseDate(record[columnMapping.event_date]) : null;
        const eventType = columnMapping.event_type ? record[columnMapping.event_type] : null;
        const description = columnMapping.description ? record[columnMapping.description] : '';
        const amount = columnMapping.price ? parseCurrency(record[columnMapping.price]) : '0';
        const status = columnMapping.status ? record[columnMapping.status] : 'Draft';
        const notes = columnMapping.notes ? record[columnMapping.notes] : '';
        
        // Find or create contact ID
        let contactId = defaultContactId;
        
        if (contactName) {
          try {
            contactId = await findOrCreateContact(client, userId, contactName);
          } catch (err) {
            console.error("Error finding/creating contact:", err);
            // Fall back to default contact
          }
        }
        
        // Insert into quotes table with contact_id
        const quoteInsertQuery = {
          text: `
            INSERT INTO quotes (
              user_id, contact_id, quote_number, event_type, status, total_amount, 
              event_date, notes, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
            RETURNING id
          `,
          values: [
            userId, 
            contactId,
            quoteNumber, 
            eventType || '', 
            status, 
            amount,
            eventDate,
            notes
          ]
        };
        
        // Execute quote insert
        const quoteResult = await client.query(quoteInsertQuery);
        
        if (quoteResult.rows.length > 0) {
          const quoteId = quoteResult.rows[0].id;
          
          // Insert a quote item
          const itemInsertQuery = {
            text: `
              INSERT INTO quote_items (
                quote_id, name, price, quantity, created_at
              ) VALUES ($1, $2, $3, $4, NOW())
            `,
            values: [
              quoteId, 
              'Imported Item', 
              amount, 
              1
            ]
          };
          
          // Execute item insert
          await client.query(itemInsertQuery);
          
          // Commit transaction
          await client.query('COMMIT');
          
          results.successCount++;
          results.successDetails.push({
            quoteId,
            quoteNumber,
            contactName,
            eventType,
            status,
            amount
          });
        } else {
          await client.query('ROLLBACK');
          throw new Error('Failed to insert quote record');
        }
      } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`Error importing row ${index + 1}:`, error);
        results.errorCount++;
        results.errors.push({
          row: index + 1,
          message: error.message || 'Unknown error occurred while processing this row',
        });
      } finally {
        client.release();
      }
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

// Create a default contact if one doesn't exist yet
async function ensureDefaultContact(userId: number): Promise<number> {
  const client = await pool.connect();
  try {
    // Check if default contact exists
    const checkResult = await client.query(
      `SELECT id FROM contacts WHERE user_id = $1 AND first_name = $2 LIMIT 1`,
      [userId, 'Imported']
    );
    
    if (checkResult.rows.length > 0) {
      return checkResult.rows[0].id;
    }
    
    // Create default contact if none exists
    const insertResult = await client.query(
      `INSERT INTO contacts (user_id, first_name, last_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
      [userId, 'Imported', 'Contact']
    );
    
    return insertResult.rows[0].id;
  } finally {
    client.release();
  }
}

// Find or create a contact based on the provided name
async function findOrCreateContact(client: any, userId: number, contactName: string): Promise<number> {
  if (!contactName) {
    throw new Error('Contact name is required');
  }
  
  // Split name into first and last
  const parts = contactName.trim().split(' ');
  const firstName = parts[0] || 'Unknown';
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  
  // Check if contact exists
  const checkQuery = {
    text: `SELECT id FROM contacts WHERE user_id = $1 AND 
           LOWER(first_name) = LOWER($2) AND 
           LOWER(last_name) = LOWER($3) LIMIT 1`,
    values: [userId, firstName, lastName]
  };
  
  const checkResult = await client.query(checkQuery);
  
  if (checkResult.rows.length > 0) {
    return checkResult.rows[0].id;
  }
  
  // Create new contact
  const insertQuery = {
    text: `INSERT INTO contacts (user_id, first_name, last_name, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id`,
    values: [userId, firstName, lastName]
  };
  
  const insertResult = await client.query(insertQuery);
  return insertResult.rows[0].id;
}

export default router;