import { Router } from 'express';
import { db } from '../db';

const router = Router();

// Direct import endpoint specifically for quotes CSV format
router.post('/api/quotes/import', async (req, res) => {
  try {
    // Pre-process the request body to handle potential HTML content or malformed JSON
    let parsedBody;
    let items;
    
    try {
      // Check if the body is already parsed as JSON
      if (typeof req.body === 'object') {
        parsedBody = req.body;
      } 
      // If it's a string (possibly containing HTML), clean it and parse it
      else if (typeof req.body === 'string') {
        // Remove any HTML or DOCTYPE declarations
        const cleanedBody = req.body.replace(/<[^>]*>|<!DOCTYPE[^>]*>/g, '');
        parsedBody = JSON.parse(cleanedBody);
      } else {
        throw new Error("Invalid request body format");
      }
      
      items = parsedBody.items;
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return res.status(400).json({
        success: false,
        message: "Failed to parse the request body",
        error: parseError.message
      });
    }
    
    console.log(`QUOTE IMPORT: Received ${items?.length || 0} quotes for import`);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items found in the request"
      });
    }
    
    // Define a mapping from CSV column names to database field names
    const fieldMapping = {
      'Order Number': 'quote_number',
      'Contact': 'name', // Will be used to find/create contact
      'Event Date': 'event_date',
      'Event Type': 'event_type',
      'Theme': 'title',
      'Order Total': 'total_amount',
      // Add more mappings as needed
    };
    
    // Create a lookup table for contacts to avoid duplicate queries
    let contactsCache = {};
    
    // Get default contact as fallback
    let defaultContactId = null;
    try {
      const contactResult = await db.execute('SELECT id FROM contacts LIMIT 1');
      if (contactResult?.[0]?.rows?.length > 0) {
        defaultContactId = contactResult[0].rows[0].id;
        console.log(`Using default contact ID: ${defaultContactId}`);
      } else {
        // If no contacts exist, create a placeholder contact
        const createContactResult = await db.execute(`
          INSERT INTO contacts (
            user_id, first_name, last_name, email, created_at, type
          ) VALUES (
            ${req.session?.userId || 1}, 'Default', 'Contact', 'placeholder@example.com', NOW(), 'customer'
          ) RETURNING id
        `);
        
        if (createContactResult?.[0]?.rows?.length > 0) {
          defaultContactId = createContactResult[0].rows[0].id;
          console.log(`Created placeholder contact with ID: ${defaultContactId}`);
        }
      }
    } catch (contactErr) {
      console.error('Error getting/creating default contact:', contactErr);
      defaultContactId = 1; // Fallback
    }
    
    // Process the items and insert them into the database
    const successes = [];
    const errors = [];
    const userId = req.session?.userId || 1; // Default to 1 for development
    
    for (const item of items) {
      try {
        // Extract and clean the fields from the item
        const quoteNumber = item['Order Number'] || generateQuoteNumber();
        const contactName = item['Contact'] || '';
        const eventDate = item['Event Date'] || new Date().toISOString().split('T')[0];
        const eventType = item['Event Type'] || 'Other';
        const title = item['Theme'] || 'Imported Quote';
        const totalAmount = item['Order Total'] || '0';
        
        // Set default expiry date (30 days from now)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiryDate = thirtyDaysFromNow.toISOString().split('T')[0];
        
        // Check if the contact exists or create a new one
        let contactId = defaultContactId;
        
        if (contactName && contactName.trim() !== '') {
          if (contactsCache[contactName]) {
            contactId = contactsCache[contactName];
          } else {
            // First check if the contact already exists
            const contactQuery = await db.execute(`
              SELECT id FROM contacts 
              WHERE user_id = ${userId} 
              AND (
                first_name ILIKE '%${contactName.replace(/'/g, "''")}%' 
                OR last_name ILIKE '%${contactName.replace(/'/g, "''")}%'
                OR business_name ILIKE '%${contactName.replace(/'/g, "''")}%'
              )
              LIMIT 1
            `);
            
            if (contactQuery?.[0]?.rows?.length > 0) {
              contactId = contactQuery[0].rows[0].id;
              contactsCache[contactName] = contactId;
            } else {
              // Create a new contact
              try {
                const nameParts = contactName.split(' ');
                const firstName = nameParts[0] || 'Import';
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Contact';
                
                const newContactQuery = await db.execute(`
                  INSERT INTO contacts (
                    user_id, first_name, last_name, created_at, type
                  ) VALUES (
                    ${userId}, 
                    '${firstName.replace(/'/g, "''")}', 
                    '${lastName.replace(/'/g, "''")}', 
                    NOW(),
                    'customer'
                  ) RETURNING id
                `);
                
                if (newContactQuery?.[0]?.rows?.length > 0) {
                  contactId = newContactQuery[0].rows[0].id;
                  contactsCache[contactName] = contactId;
                }
              } catch (newContactErr) {
                console.error('Error creating new contact:', newContactErr);
                // Fallback to default contact
              }
            }
          }
        }
        
        // INSERT INTO quotes
        const quoteInsertQuery = `
          INSERT INTO quotes (
            user_id, contact_id, quote_number, title, 
            event_type, event_date, status, delivery_type,
            delivery_fee, total_amount, expiry_date, 
            tax_rate, created_at, updated_at
          ) VALUES (
            ${userId},
            ${contactId},
            '${quoteNumber.replace(/'/g, "''")}',
            '${title.replace(/'/g, "''")}',
            '${eventType.replace(/'/g, "''")}',
            '${eventDate}',
            'pending',
            'pickup',
            '0',
            '${totalAmount.replace(/'/g, "''")}',
            '${expiryDate}',
            '0',
            NOW(),
            NOW()
          ) RETURNING id
        `;
        
        const result = await db.execute(quoteInsertQuery);
        
        if (result?.[0]?.rows?.length > 0) {
          const insertedId = result[0].rows[0].id;
          successes.push({
            id: insertedId,
            quoteNumber,
            contactName,
            eventDate,
            eventType,
            title,
            totalAmount
          });
        } else {
          throw new Error("Failed to insert quote");
        }
      } catch (err) {
        console.error('ERROR importing quote:', err);
        errors.push({
          item,
          error: err.message || "Unknown error"
        });
      }
    }
    
    // Return the result
    return res.json({
      success: true,
      inserted: successes.length,
      errors: errors.length,
      errorDetails: errors,
      successDetails: successes,
      message: `Successfully imported ${successes.length} quotes. Failed to import ${errors.length} quotes.`
    });
    
  } catch (err) {
    console.error('Error in quote import endpoint:', err);
    return res.status(500).json({
      success: false,
      message: "Server error processing the import",
      error: err.message
    });
  }
});

// Helper function to generate a unique quote number
function generateQuoteNumber() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `Q-${timestamp}-${random}`;
}

export default router;