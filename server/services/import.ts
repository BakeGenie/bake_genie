import { db } from '../db';
import {
  orders,
  orderItems,
  contacts,
  recipes,
  ingredients,
  recipeIngredients,
  tasks,
  products,
  expenses,
  income,
  enquiries,
  settings,
  InsertOrder,
  InsertOrderItem,
  InsertContact,
  InsertRecipe,
  InsertIngredient,
  InsertRecipeIngredient,
  InsertTask,
  InsertProduct,
  InsertExpense,
  InsertIncome,
  InsertEnquiry,
  InsertSettings
} from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Types for validating imported data
 */
export interface ImportData {
  orders?: any[];
  contacts?: any[];
  recipes?: any[];
  products?: any[];
  financials?: {
    expenses?: any[];
    income?: any[];
  };
  tasks?: any[];
  enquiries?: any[];
  settings?: any;
  version?: string;
  sourceSystem?: string;
}

/**
 * Service for importing data into the database
 */
export class ImportService {
  /**
   * Import all data for a specific user
   */
  async importAllData(userId: number, data: ImportData) {
    try {
      // Validate the import data
      if (!this.validateImportData(data)) {
        throw new Error('Invalid import data format');
      }

      // Begin import process
      const importSummary = await this.processImportData(userId, data);
      return importSummary;
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error(`Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate the import data format
   */
  private validateImportData(data: ImportData): boolean {
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check if at least one valid data section exists
    return !!(
      Array.isArray(data.orders) ||
      Array.isArray(data.contacts) ||
      Array.isArray(data.recipes) ||
      Array.isArray(data.products) ||
      (data.financials && (
        Array.isArray(data.financials.expenses) ||
        Array.isArray(data.financials.income)
      )) ||
      Array.isArray(data.tasks) ||
      Array.isArray(data.enquiries) ||
      (data.settings && typeof data.settings === 'object')
    );
  }

  /**
   * Process and import all data
   */
  private async processImportData(userId: number, data: ImportData) {
    // Track import counts
    const importSummary: Record<string, { imported: number; errors: number }> = {
      contacts: { imported: 0, errors: 0 },
      orders: { imported: 0, errors: 0 },
      recipes: { imported: 0, errors: 0 },
      ingredients: { imported: 0, errors: 0 },
      products: { imported: 0, errors: 0 },
      expenses: { imported: 0, errors: 0 },
      income: { imported: 0, errors: 0 },
      tasks: { imported: 0, errors: 0 },
      enquiries: { imported: 0, errors: 0 },
      settings: { imported: 0, errors: 0 }
    };

    // Import contacts first as they're referenced by orders
    if (Array.isArray(data.contacts) && data.contacts.length > 0) {
      const { imported, errors } = await this.importContacts(userId, data.contacts);
      importSummary.contacts.imported = imported;
      importSummary.contacts.errors = errors;
    }

    // Import recipes and ingredients
    if (Array.isArray(data.recipes) && data.recipes.length > 0) {
      const recipeResult = await this.importRecipes(userId, data.recipes);
      importSummary.recipes.imported = recipeResult.recipes.imported;
      importSummary.recipes.errors = recipeResult.recipes.errors;
      importSummary.ingredients.imported = recipeResult.ingredients.imported;
      importSummary.ingredients.errors = recipeResult.ingredients.errors;
    }

    // Import orders
    if (Array.isArray(data.orders) && data.orders.length > 0) {
      const { imported, errors } = await this.importOrders(userId, data.orders);
      importSummary.orders.imported = imported;
      importSummary.orders.errors = errors;
    }

    // Import products
    if (Array.isArray(data.products) && data.products.length > 0) {
      const { imported, errors } = await this.importProducts(userId, data.products);
      importSummary.products.imported = imported;
      importSummary.products.errors = errors;
    }

    // Import financials
    if (data.financials) {
      if (Array.isArray(data.financials.expenses) && data.financials.expenses.length > 0) {
        const { imported, errors } = await this.importExpenses(userId, data.financials.expenses);
        importSummary.expenses.imported = imported;
        importSummary.expenses.errors = errors;
      }

      if (Array.isArray(data.financials.income) && data.financials.income.length > 0) {
        const { imported, errors } = await this.importIncome(userId, data.financials.income);
        importSummary.income.imported = imported;
        importSummary.income.errors = errors;
      }
    }

    // Import tasks
    if (Array.isArray(data.tasks) && data.tasks.length > 0) {
      const { imported, errors } = await this.importTasks(userId, data.tasks);
      importSummary.tasks.imported = imported;
      importSummary.tasks.errors = errors;
    }

    // Import enquiries
    if (Array.isArray(data.enquiries) && data.enquiries.length > 0) {
      const { imported, errors } = await this.importEnquiries(userId, data.enquiries);
      importSummary.enquiries.imported = imported;
      importSummary.enquiries.errors = errors;
    }

    // Import settings
    if (data.settings && typeof data.settings === 'object') {
      const { imported, errors } = await this.importSettings(userId, data.settings);
      importSummary.settings.imported = imported;
      importSummary.settings.errors = errors;
    }

    return {
      success: true,
      summary: importSummary,
      importDate: new Date().toISOString(),
      sourceSystem: data.sourceSystem || 'unknown'
    };
  }

  /**
   * Import contacts
   */
  private async importContacts(userId: number, contactsData: any[]) {
    let imported = 0;
    let errors = 0;

    try {
      // Create a map of imported contact IDs to new database IDs
      const contactIdMap = new Map<number | string, number>();

      for (const contactData of contactsData) {
        try {
          // Prepare contact data for insertion
          const contactToInsert: Partial<InsertContact> = {
            userId,
            firstName: contactData.firstName || '',
            lastName: contactData.lastName || '',
            email: contactData.email || null,
            phone: contactData.phone || null,
            company: contactData.company || null,
            address: contactData.address || null,
            city: contactData.city || null,
            state: contactData.state || null,
            zip: contactData.zip || null,
            country: contactData.country || null,
            notes: contactData.notes || null
          };

          // Insert contact
          const [newContact] = await db.insert(contacts).values(contactToInsert).returning({ id: contacts.id });

          // Store mapping of old ID to new ID if original ID exists
          if (contactData.id !== undefined) {
            contactIdMap.set(contactData.id, newContact.id);
          }

          imported++;
        } catch (error) {
          console.error('Error importing contact:', error);
          errors++;
        }
      }

      // Store contact ID mapping for reference by other imports
      process.env.CONTACT_ID_MAPPING = JSON.stringify(Object.fromEntries(contactIdMap));

      return { imported, errors, contactIdMap };
    } catch (error) {
      console.error('Error importing contacts:', error);
      return { imported, errors, contactIdMap: new Map() };
    }
  }

  /**
   * Import recipes and ingredients
   */
  private async importRecipes(userId: number, recipesData: any[]) {
    let recipesImported = 0;
    let recipesErrors = 0;
    let ingredientsImported = 0;
    let ingredientsErrors = 0;

    try {
      // Keep track of imported ingredients
      const ingredientIdMap = new Map<number | string, number>();
      
      // First pass: import all ingredients
      const uniqueIngredients = new Map<string, any>();
      
      // Collect all unique ingredients from recipes
      for (const recipeData of recipesData) {
        if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
          for (const ingredientData of recipeData.ingredients) {
            const ingredient = ingredientData.ingredient;
            if (ingredient && ingredient.name) {
              // Use name as unique key for ingredients
              const key = ingredient.name.toLowerCase();
              if (!uniqueIngredients.has(key)) {
                uniqueIngredients.set(key, ingredient);
              }
            }
          }
        }
      }
      
      // Import all unique ingredients
      for (const [key, ingredientData] of uniqueIngredients.entries()) {
        try {
          const ingredientToInsert: Partial<InsertIngredient> = {
            userId,
            name: ingredientData.name,
            unit: ingredientData.unit || 'unit',
            unitCost: ingredientData.unitCost?.toString() || null,
            packSize: ingredientData.packSize?.toString() || null,
            packCost: ingredientData.packCost?.toString() || null
          };
          
          const [newIngredient] = await db.insert(ingredients).values(ingredientToInsert).returning({ id: ingredients.id });
          
          // Map old ID to new ID
          if (ingredientData.id !== undefined) {
            ingredientIdMap.set(ingredientData.id, newIngredient.id);
          }
          
          // Also map by name for ingredients without IDs
          ingredientIdMap.set(key, newIngredient.id);
          
          ingredientsImported++;
        } catch (error) {
          console.error('Error importing ingredient:', error);
          ingredientsErrors++;
        }
      }
      
      // Second pass: import recipes
      const recipeIdMap = new Map<number | string, number>();
      
      for (const recipeData of recipesData) {
        try {
          const recipeToInsert: Partial<InsertRecipe> = {
            userId,
            name: recipeData.name || '',
            description: recipeData.description || null,
            servings: recipeData.servings || 1,
            instructions: recipeData.instructions || null,
            totalCost: recipeData.totalCost?.toString() || null,
            prepTime: recipeData.prepTime || null,
            cookTime: recipeData.cookTime || null,
            imageUrl: recipeData.imageUrl || null,
            category: recipeData.category || null
          };
          
          const [newRecipe] = await db.insert(recipes).values(recipeToInsert).returning({ id: recipes.id });
          
          // Map old ID to new ID
          if (recipeData.id !== undefined) {
            recipeIdMap.set(recipeData.id, newRecipe.id);
          }
          
          // Import recipe ingredients
          if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
            for (const ingredientData of recipeData.ingredients) {
              try {
                const ingredient = ingredientData.ingredient;
                let ingredientId: number | undefined;
                
                // Try to find the ingredient ID from the map
                if (ingredient) {
                  if (ingredient.id !== undefined && ingredientIdMap.has(ingredient.id)) {
                    ingredientId = ingredientIdMap.get(ingredient.id);
                  } else if (ingredient.name) {
                    // Try looking up by name
                    const key = ingredient.name.toLowerCase();
                    if (ingredientIdMap.has(key)) {
                      ingredientId = ingredientIdMap.get(key);
                    }
                  }
                }
                
                // If ingredient ID is valid, add the recipe-ingredient relationship
                if (ingredientId) {
                  const recipeIngredientToInsert: InsertRecipeIngredient = {
                    recipeId: newRecipe.id,
                    ingredientId,
                    quantity: ingredientData.quantity?.toString() || '0',
                    notes: ingredientData.notes || null
                  };
                  
                  await db.insert(recipeIngredients).values(recipeIngredientToInsert);
                }
              } catch (error) {
                console.error('Error importing recipe ingredient:', error);
                ingredientsErrors++;
              }
            }
          }
          
          recipesImported++;
        } catch (error) {
          console.error('Error importing recipe:', error);
          recipesErrors++;
        }
      }
      
      return {
        recipes: { imported: recipesImported, errors: recipesErrors },
        ingredients: { imported: ingredientsImported, errors: ingredientsErrors }
      };
      
    } catch (error) {
      console.error('Error importing recipes:', error);
      return {
        recipes: { imported: recipesImported, errors: recipesErrors },
        ingredients: { imported: ingredientsImported, errors: ingredientsErrors }
      };
    }
  }

  /**
   * Import orders
   */
  private async importOrders(userId: number, ordersData: any[]) {
    let imported = 0;
    let errors = 0;
    
    try {
      // Get contact ID mapping if available
      const contactIdMapping = process.env.CONTACT_ID_MAPPING 
        ? JSON.parse(process.env.CONTACT_ID_MAPPING) 
        : {};
      
      for (const orderData of ordersData) {
        try {
          // Map the contact ID to the new ID if available
          let contactId = null;
          if (orderData.contactId) {
            contactId = contactIdMapping[orderData.contactId] || null;
          }
          
          // If no mapped contact ID, skip this order
          if (!contactId) {
            console.warn('Skipping order import - no valid contact ID', orderData);
            errors++;
            continue;
          }
          
          const orderToInsert: Partial<InsertOrder> = {
            userId,
            orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
            contactId,
            eventType: orderData.eventType || 'Other',
            eventDate: orderData.eventDate ? new Date(orderData.eventDate) : new Date(),
            status: orderData.status || 'Quote',
            theme: orderData.theme || null,
            deliveryType: orderData.deliveryType || 'Pickup',
            deliveryDetails: orderData.deliveryDetails || null,
            discount: orderData.discount?.toString() || '0',
            discountType: orderData.discountType || '%',
            setupFee: orderData.setupFee?.toString() || '0',
            taxRate: orderData.taxRate?.toString() || '0',
            total: orderData.total?.toString() || '0',
            notes: orderData.notes || null,
            jobSheetNotes: orderData.jobSheetNotes || null,
            imageUrls: orderData.imageUrls || []
          };
          
          const [newOrder] = await db.insert(orders).values(orderToInsert).returning({ id: orders.id });
          
          // Import order items
          if (orderData.items && Array.isArray(orderData.items)) {
            for (const itemData of orderData.items) {
              try {
                const orderItemToInsert: InsertOrderItem = {
                  orderId: newOrder.id,
                  productId: null, // We won't try to map product IDs for simplicity
                  type: itemData.type || 'Other',
                  name: itemData.name || '',
                  description: itemData.description || null,
                  quantity: itemData.quantity || 1,
                  unitPrice: itemData.unitPrice?.toString() || '0',
                  price: itemData.price?.toString() || '0',
                  notes: itemData.notes || null
                };
                
                await db.insert(orderItems).values(orderItemToInsert);
              } catch (error) {
                console.error('Error importing order item:', error);
                errors++;
              }
            }
          }
          
          imported++;
        } catch (error) {
          console.error('Error importing order:', error);
          errors++;
        }
      }
      
      return { imported, errors };
    } catch (error) {
      console.error('Error importing orders:', error);
      return { imported, errors };
    }
  }

  /**
   * Import products
   */
  private async importProducts(userId: number, productsData: any[]) {
    let imported = 0;
    let errors = 0;
    
    try {
      for (const productData of productsData) {
        try {
          const productToInsert: Partial<InsertProduct> = {
            userId,
            type: productData.type || 'Other',
            name: productData.name || '',
            description: productData.description || null,
            servings: productData.servings || null,
            price: productData.price?.toString() || '0',
            cost: productData.cost?.toString() || null,
            taxRate: productData.taxRate?.toString() || '0',
            laborHours: productData.laborHours?.toString() || '0',
            laborRate: productData.laborRate?.toString() || '0',
            overhead: productData.overhead?.toString() || '0',
            imageUrl: productData.imageUrl || null,
            active: productData.active !== false
          };
          
          await db.insert(products).values(productToInsert);
          imported++;
        } catch (error) {
          console.error('Error importing product:', error);
          errors++;
        }
      }
      
      return { imported, errors };
    } catch (error) {
      console.error('Error importing products:', error);
      return { imported, errors };
    }
  }

  /**
   * Import expenses
   */
  private async importExpenses(userId: number, expensesData: any[]) {
    let imported = 0;
    let errors = 0;
    
    try {
      for (const expenseData of expensesData) {
        try {
          const expenseToInsert: Partial<InsertExpense> = {
            userId,
            category: expenseData.category || 'Other',
            amount: expenseData.amount?.toString() || '0',
            date: expenseData.date ? new Date(expenseData.date) : new Date(),
            description: expenseData.description || null,
            receiptUrl: expenseData.receiptUrl || null,
            taxDeductible: expenseData.taxDeductible === true
          };
          
          await db.insert(expenses).values(expenseToInsert);
          imported++;
        } catch (error) {
          console.error('Error importing expense:', error);
          errors++;
        }
      }
      
      return { imported, errors };
    } catch (error) {
      console.error('Error importing expenses:', error);
      return { imported, errors };
    }
  }

  /**
   * Import income
   */
  private async importIncome(userId: number, incomeData: any[]) {
    let imported = 0;
    let errors = 0;
    
    try {
      for (const income of incomeData) {
        try {
          const incomeToInsert: Partial<InsertIncome> = {
            userId,
            category: income.category || 'Other',
            amount: income.amount?.toString() || '0',
            date: income.date ? new Date(income.date) : new Date(),
            description: income.description || null
          };
          
          await db.insert(income).values(incomeToInsert);
          imported++;
        } catch (error) {
          console.error('Error importing income:', error);
          errors++;
        }
      }
      
      return { imported, errors };
    } catch (error) {
      console.error('Error importing income entries:', error);
      return { imported, errors };
    }
  }

  /**
   * Import tasks
   */
  private async importTasks(userId: number, tasksData: any[]) {
    let imported = 0;
    let errors = 0;
    
    try {
      for (const taskData of tasksData) {
        try {
          const taskToInsert: Partial<InsertTask> = {
            userId,
            orderId: null, // We don't try to map order IDs for simplicity
            title: taskData.title || '',
            description: taskData.description || null,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            completed: taskData.completed === true,
            priority: taskData.priority || 'Medium'
          };
          
          await db.insert(tasks).values(taskToInsert);
          imported++;
        } catch (error) {
          console.error('Error importing task:', error);
          errors++;
        }
      }
      
      return { imported, errors };
    } catch (error) {
      console.error('Error importing tasks:', error);
      return { imported, errors };
    }
  }

  /**
   * Import enquiries
   */
  private async importEnquiries(userId: number, enquiriesData: any[]) {
    let imported = 0;
    let errors = 0;
    
    try {
      for (const enquiryData of enquiriesData) {
        try {
          const enquiryToInsert: Partial<InsertEnquiry> = {
            userId,
            name: enquiryData.name || '',
            email: enquiryData.email || '',
            phone: enquiryData.phone || null,
            eventType: enquiryData.eventType || null,
            eventDate: enquiryData.eventDate ? new Date(enquiryData.eventDate) : null,
            message: enquiryData.message || '',
            status: enquiryData.status || 'New'
          };
          
          await db.insert(enquiries).values(enquiryToInsert);
          imported++;
        } catch (error) {
          console.error('Error importing enquiry:', error);
          errors++;
        }
      }
      
      return { imported, errors };
    } catch (error) {
      console.error('Error importing enquiries:', error);
      return { imported, errors };
    }
  }

  /**
   * Import settings
   */
  private async importSettings(userId: number, settingsData: any) {
    let imported = 0;
    let errors = 0;
    
    try {
      // Check if settings already exist for this user
      const existingSettings = await db.select({ id: settings.id }).from(settings)
        .where(eq(settings.userId, userId));
      
      // Prepare settings data
      const settingsToInsert: Partial<InsertSettings> = {
        userId,
        currency: settingsData.currency || 'USD',
        defaultTaxRate: settingsData.defaultTaxRate?.toString() || '0',
        businessHours: settingsData.businessHours || null,
        invoiceFooter: settingsData.invoiceFooter || null,
        quoteFooter: settingsData.quoteFooter || null,
        orderNumberPrefix: settingsData.orderNumberPrefix || '',
        quoteNumberPrefix: settingsData.quoteNumberPrefix || '',
        laborRate: settingsData.laborRate?.toString() || '0'
      };
      
      if (existingSettings.length > 0) {
        // Update existing settings
        await db.update(settings)
          .set(settingsToInsert)
          .where(eq(settings.id, existingSettings[0].id));
      } else {
        // Insert new settings
        await db.insert(settings).values(settingsToInsert);
      }
      
      imported = 1;
    } catch (error) {
      console.error('Error importing settings:', error);
      errors = 1;
    }
    
    return { imported, errors };
  }
}

export const importService = new ImportService();