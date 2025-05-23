import { Router } from 'express';
import { db } from '../db';

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
    
    // Process each record individually without a transaction to simplify
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      
      try {
        // Generate quote information
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
        
        // Insert directly into the quotes table using a simpler approach
        const query = `
          INSERT INTO quotes (
            user_id, quote_number, event_type, status, price, description, 
            notes, created_at, updated_at
          ) VALUES (
            ${userId}, 
            '${quoteNumber}', 
            '${eventType || ''}', 
            '${status}', 
            ${price}, 
            '${description.replace(/'/g, "''")}', 
            '${notes.replace(/'/g, "''")}', 
            NOW(), NOW()
          ) RETURNING id
        `;
        
        // Execute the query
        const result = await db.execute(query);
        
        if (result && result.rows && result.rows.length > 0) {
          const quoteId = result.rows[0].id;
          
          // Insert a quote item
          const itemQuery = `
            INSERT INTO quote_items (
              quote_id, name, price, quantity, created_at, updated_at
            ) VALUES (
              ${quoteId}, 
              'Imported Item', 
              ${price}, 
              1, 
              NOW(), NOW()
            )
          `;
          
          await db.execute(itemQuery);
          
          results.successCount++;
          results.successDetails.push({
            quoteId,
            quoteNumber,
            eventType,
            status,
            price
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