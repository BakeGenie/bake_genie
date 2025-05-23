import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../db';
import {
  contacts,
  orders,
  orderItems,
  quotes,
  expenses,
  ingredients,
  recipes,
  supplies
} from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Generic CSV import service
 */
class ImportService {
  
  /**
   * Import contacts directly from JSON data
   */
  async importContactsFromJson(data: any[], userId: number) {
    try {
      console.log(`Importing ${data.length} contacts from JSON for user ${userId}`);
      
      if (data.length === 0) {
        return { success: false, message: 'No records provided' };
      }
      
      // Make sure each record has the userId field
      const contactsToInsert = data.map(contact => ({
        ...contact,
        userId
      }));
      
      console.log(`Prepared ${contactsToInsert.length} contacts for insert`);
      
      // Insert contacts into database
      const result = await db.insert(contacts).values(contactsToInsert);
      
      return {
        success: true,
        message: `Successfully imported ${contactsToInsert.length} contacts`,
        data: { imported: contactsToInsert.length }
      };
    } catch (error) {
      console.error('Error importing contacts from JSON:', error);
      return {
        success: false,
        message: `Error importing contacts: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Import contacts from CSV file
   */
  async importContacts(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing contacts from ${filePath} for user ${userId} with mappings:`, mappings);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          // If CSV field exists in record, use its value, otherwise use the default value
          if (csvField && record[csvField] !== undefined) {
            mappedRecord[dbField] = record[csvField];
          } else if (csvField === '') {
            // If mapping is an empty string, use an empty string as default
            mappedRecord[dbField] = '';
          }
        });
        
        return mappedRecord;
      });
      
      console.log(`Mapped ${mappedRecords.length} records for insert`);
      
      // Insert contacts into database
      const result = await db.insert(contacts).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} contacts`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing contacts:', error);
      return {
        success: false,
        message: `Error importing contacts: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import orders from CSV file
   */
  async importOrders(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing orders from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in orders CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            // Handle date fields
            if (dbField === 'orderDate' || dbField === 'deliveryDate') {
              mappedRecord[dbField] = new Date(record[csvField]);
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use an empty string as default
            mappedRecord[dbField] = '';
          }
        });
        
        return mappedRecord;
      });
      
      // Insert orders into database
      const result = await db.insert(orders).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} orders`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing orders:', error);
      return {
        success: false,
        message: `Error importing orders: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import order items from CSV file
   */
  async importOrderItems(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing order items from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in order items CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            // Convert numeric fields
            if (dbField === 'quantity' || dbField === 'unitPrice') {
              mappedRecord[dbField] = parseFloat(record[csvField]);
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use an empty string as default
            mappedRecord[dbField] = '';
          }
        });
        
        return mappedRecord;
      });
      
      // Insert order items into database
      const result = await db.insert(orderItems).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} order items`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing order items:', error);
      return {
        success: false,
        message: `Error importing order items: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import quotes from CSV file
   */
  async importQuotes(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing quotes from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in quotes CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            // Handle date fields
            if (dbField === 'eventDate' || dbField === 'createdDate' || dbField === 'expiryDate') {
              mappedRecord[dbField] = new Date(record[csvField]);
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use an empty string as default
            mappedRecord[dbField] = '';
          }
        });
        
        return mappedRecord;
      });
      
      // Insert quotes into database
      const result = await db.insert(quotes).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} quotes`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing quotes:', error);
      return {
        success: false,
        message: `Error importing quotes: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import expenses from CSV file
   */
  async importExpenses(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing expenses from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in expenses CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            if (dbField === 'date') {
              mappedRecord[dbField] = new Date(record[csvField]);
            } else if (dbField === 'taxDeductible' || dbField === 'isRecurring') {
              // Convert string 'true'/'false' to boolean
              mappedRecord[dbField] = record[csvField].toLowerCase() === 'true';
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use a default value
            if (dbField === 'taxDeductible' || dbField === 'isRecurring') {
              mappedRecord[dbField] = false;
            } else {
              mappedRecord[dbField] = '';
            }
          }
        });
        
        return mappedRecord;
      });
      
      // Insert expenses into database
      const result = await db.insert(expenses).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} expenses`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing expenses:', error);
      return {
        success: false,
        message: `Error importing expenses: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import ingredients from CSV file
   */
  async importIngredients(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing ingredients from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in ingredients CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            if (dbField === 'costPerUnit' || dbField === 'stockLevel' || dbField === 'reorderPoint') {
              mappedRecord[dbField] = parseFloat(record[csvField]);
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use a default value
            if (dbField === 'costPerUnit' || dbField === 'stockLevel' || dbField === 'reorderPoint') {
              mappedRecord[dbField] = 0;
            } else {
              mappedRecord[dbField] = '';
            }
          }
        });
        
        return mappedRecord;
      });
      
      // Insert ingredients into database
      const result = await db.insert(ingredients).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} ingredients`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing ingredients:', error);
      return {
        success: false,
        message: `Error importing ingredients: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import recipes from CSV file
   */
  async importRecipes(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing recipes from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in recipes CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            if (dbField === 'prepTime' || dbField === 'cookTime') {
              mappedRecord[dbField] = parseInt(record[csvField]);
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use a default value
            if (dbField === 'prepTime' || dbField === 'cookTime') {
              mappedRecord[dbField] = 0;
            } else {
              mappedRecord[dbField] = '';
            }
          }
        });
        
        return mappedRecord;
      });
      
      // Insert recipes into database
      const result = await db.insert(recipes).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} recipes`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing recipes:', error);
      return {
        success: false,
        message: `Error importing recipes: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Import supplies from CSV file
   */
  async importSupplies(filePath: string, userId: number, mappings: Record<string, string> = {}) {
    try {
      console.log(`Importing supplies from ${filePath} for user ${userId}`);
      
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
      
      console.log(`Found ${records.length} records in supplies CSV file`);
      
      if (records.length === 0) {
        return { success: false, message: 'No records found in CSV file' };
      }
      
      // Map CSV fields to database fields
      const mappedRecords = records.map((record: any) => {
        const mappedRecord: Record<string, any> = { userId };
        
        // Map fields using provided mappings
        Object.entries(mappings).forEach(([dbField, csvField]) => {
          if (csvField && record[csvField] !== undefined) {
            if (dbField === 'costPerUnit' || dbField === 'stockLevel' || dbField === 'reorderPoint') {
              mappedRecord[dbField] = parseFloat(record[csvField]);
            } else {
              mappedRecord[dbField] = record[csvField];
            }
          } else if (csvField === '') {
            // If mapping is an empty string, use a default value
            if (dbField === 'costPerUnit' || dbField === 'stockLevel' || dbField === 'reorderPoint') {
              mappedRecord[dbField] = 0;
            } else {
              mappedRecord[dbField] = '';
            }
          }
        });
        
        return mappedRecord;
      });
      
      // Insert supplies into database
      const result = await db.insert(supplies).values(mappedRecords);
      
      return {
        success: true,
        message: `Successfully imported ${mappedRecords.length} supplies`,
        data: { imported: mappedRecords.length }
      };
    } catch (error) {
      console.error('Error importing supplies:', error);
      return {
        success: false,
        message: `Error importing supplies: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

export const importService = new ImportService();