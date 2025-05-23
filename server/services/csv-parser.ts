import { parse } from 'csv-parse';
import { promisify } from 'util';
import { contacts } from '@shared/schema';
import { db } from '../db';

const parseCSVAsync = promisify(parse);

/**
 * Special parser for Bake Diary contacts CSV format
 * Known fields: Type, First Name, Last Name, Supplier Name, Email, Number, Allow Marketing, Website, Source
 */
export async function parseBakeDiaryContacts(csvContent: string, userId: number) {
  try {
    console.log('Parsing Bake Diary contacts CSV...');
    console.log('CSV preview:', csvContent.substring(0, 200));
    
    // Parse the CSV content
    const records = await parseCSVAsync(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    console.log(`Found ${records.length} contact records`);
    
    if (records.length === 0) {
      return { 
        success: false, 
        message: 'No contacts found in the CSV file' 
      };
    }
    
    // Print first record to debug
    console.log('First record keys:', Object.keys(records[0]));
    console.log('First record:', records[0]);
    
    let imported = 0;
    let failed = 0;
    
    for (const record of records) {
      try {
        // Extract and map fields from the CSV
        // The headers in your CSV have spaces that need to be trimmed
        const type = record['Type'] || 'Customer';
        const firstName = record['First Name'] || '';
        const lastName = record['Last Name'] || '';
        const email = record['Email'] || '';
        const phone = record['Number'] || '';
        const businessName = record['Supplier Name'] || '';
        
        console.log(`Processing contact: ${firstName} ${lastName}, ${email}, ${phone}`);
        
        // Insert the contact into the database
        await db.insert(contacts).values({
          userId: userId,
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          businessName: businessName,
          address: '',
          notes: '',
          createdAt: new Date()
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing contact record:', error);
        failed++;
      }
    }
    
    return {
      success: true,
      imported,
      failed,
      message: `Successfully imported ${imported} contacts, with ${failed} failures.`
    };
  } catch (error) {
    console.error('Error parsing contacts CSV:', error);
    return {
      success: false,
      message: `Error parsing CSV: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}