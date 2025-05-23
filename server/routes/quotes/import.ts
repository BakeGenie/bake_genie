import { Router } from 'express';
import { db } from '../../db';
import { quotes } from '@shared/schema';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { records, columnMapping, userId } = req.body;
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid records provided',
      });
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ row: number; message: string }> = [];

    // Loop through records and import them
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Map CSV columns to database fields
        const quoteData: any = {
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
        };
        
        // Map fields from the CSV based on the column mapping
        Object.keys(columnMapping).forEach(dbField => {
          const csvColumn = columnMapping[dbField];
          if (csvColumn && csvColumn !== '_none_') {
            let value = record[csvColumn];
            
            // Handle special field transformations
            if (dbField === 'event_date' || dbField === 'expiry_date') {
              // Try to parse date strings in various formats
              if (value) {
                try {
                  const dateValue = new Date(value);
                  if (!isNaN(dateValue.getTime())) {
                    value = dateValue.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                  }
                } catch (e) {
                  // If date parsing fails, keep original value
                }
              }
            } else if (dbField === 'price') {
              // Try to parse price as a number
              if (value) {
                value = parseFloat(value.toString().replace(/[^0-9.-]+/g, ''));
                if (isNaN(value)) {
                  value = 0;
                }
              }
            }
            
            quoteData[dbField] = value || null;
          }
        });
        
        // Ensure quote_number is set
        if (!quoteData.quote_number) {
          // Generate a quote number if not provided
          quoteData.quote_number = `Q${new Date().getFullYear()}-${(successCount + 1).toString().padStart(3, '0')}`;
        }
        
        // Insert the quote into the database
        await db.insert(quotes).values(quoteData);
        successCount++;
      } catch (err: any) {
        console.error(`Error importing quote at row ${i + 1}:`, err);
        errorCount++;
        errors.push({
          row: i + 1,
          message: err.message || 'Unknown error',
        });
      }
    }

    return res.json({
      success: true,
      successCount,
      errorCount,
      errors,
      message: `Successfully imported ${successCount} quotes with ${errorCount} errors.`,
    });
  } catch (error: any) {
    console.error('Error importing quotes:', error);
    return res.status(500).json({
      success: false, 
      message: `Server error: ${error.message || 'Unknown error'}`,
    });
  }
});

export default router;