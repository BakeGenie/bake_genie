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
  settings
} from '@shared/schema';
import { eq } from 'drizzle-orm';
import { stringify } from 'csv-stringify/sync';
import { format } from 'date-fns';

/**
 * Service for exporting data from the database
 */
export class ExportService {
  /**
   * Export all data for a specific user
   */
  async exportAllData(userId: number) {
    try {
      const userData = await this.gatherUserData(userId);
      return userData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Export orders for a specific user
   */
  async exportOrders(userId: number) {
    try {
      const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
      
      // Get order items for each order
      const orderIds = userOrders.map(order => order.id);
      const orderItemsData = orderIds.length > 0 
        ? await db.select().from(orderItems).where(item => item.orderId.in(orderIds))
        : [];
      
      // Group order items by order ID
      const itemsByOrder = orderItemsData.reduce((acc, item) => {
        if (!acc[item.orderId]) {
          acc[item.orderId] = [];
        }
        acc[item.orderId].push(item);
        return acc;
      }, {} as Record<number, typeof orderItemsData>);
      
      // Combine orders with their items
      const ordersWithItems = userOrders.map(order => ({
        ...order,
        items: itemsByOrder[order.id] || []
      }));
      
      return ordersWithItems;
    } catch (error) {
      console.error('Error exporting orders:', error);
      throw new Error('Failed to export orders');
    }
  }
  
  /**
   * Export orders as CSV for a specific user
   */
  async exportOrdersAsCsv(userId: number) {
    try {
      const ordersWithItems = await this.exportOrders(userId);
      
      // Prepare data for CSV export - flatten the order structure
      const csvData = ordersWithItems.map(order => {
        return {
          'Order Number': order.orderNumber,
          'Status': order.status,
          'Order Date': format(new Date(order.createdAt || new Date()), 'yyyy-MM-dd'),
          'Event Type': order.eventType,
          'Event Date': order.eventDate,
          'Delivery Type': order.deliveryType,
          'Delivery Address': order.deliveryDetails || '',
          'Delivery Time': order.deliveryTime || '',
          'Total Amount': order.total,
          'Discount': order.discount || 0,
          'Discount Type': order.discountType || '%',
          'Setup Fee': order.setupFee || 0,
          'Notes': order.notes || ''
        };
      });
      
      // Generate CSV from the data
      return stringify(csvData, { 
        header: true,
        columns: Object.keys(csvData[0] || {}),
        cast: {
          date: (value) => format(new Date(value), 'yyyy-MM-dd')
        }
      });
    } catch (error) {
      console.error('Error exporting orders as CSV:', error);
      throw new Error('Failed to export orders as CSV');
    }
  }

  /**
   * Export contacts for a specific user
   */
  async exportContacts(userId: number) {
    try {
      return await db.select().from(contacts).where(eq(contacts.userId, userId));
    } catch (error) {
      console.error('Error exporting contacts:', error);
      throw new Error('Failed to export contacts');
    }
  }
  
  /**
   * Export contacts as CSV for a specific user
   */
  async exportContactsAsCsv(userId: number) {
    try {
      const contactsData = await this.exportContacts(userId);
      
      // Prepare data for CSV export
      const csvData = contactsData.map(contact => {
        return {
          'First Name': contact.firstName,
          'Last Name': contact.lastName,
          'Business Name': contact.businessName || '',
          'Email': contact.email || '',
          'Phone': contact.phone || '',
          'Address': contact.address || '',
          'City': contact.city || '',
          'State': contact.state || '',
          'Zip': contact.zip || '',
          'Country': contact.country || '',
          'Notes': contact.notes || ''
        };
      });
      
      // Generate CSV from the data
      return stringify(csvData, { 
        header: true,
        columns: Object.keys(csvData[0] || {})
      });
    } catch (error) {
      console.error('Error exporting contacts as CSV:', error);
      throw new Error('Failed to export contacts as CSV');
    }
  }

  /**
   * Export recipes for a specific user
   */
  async exportRecipes(userId: number) {
    try {
      const userRecipes = await db.select().from(recipes).where(eq(recipes.userId, userId));
      
      // Get recipe ingredients
      const recipeIds = userRecipes.map(recipe => recipe.id);
      const recipeIngredientsData = recipeIds.length > 0
        ? await db.select().from(recipeIngredients).where(item => item.recipeId.in(recipeIds))
        : [];
      
      // Get all ingredients for this user
      const userIngredients = await db.select().from(ingredients).where(eq(ingredients.userId, userId));
      
      // Create lookup map for ingredients
      const ingredientsMap = userIngredients.reduce((acc, ingredient) => {
        acc[ingredient.id] = ingredient;
        return acc;
      }, {} as Record<number, typeof userIngredients[0]>);
      
      // Group recipe ingredients by recipe ID
      const ingredientsByRecipe = recipeIngredientsData.reduce((acc, item) => {
        if (!acc[item.recipeId]) {
          acc[item.recipeId] = [];
        }
        
        // Add the actual ingredient data
        const fullItem = {
          ...item,
          ingredient: ingredientsMap[item.ingredientId] || null
        };
        
        acc[item.recipeId].push(fullItem);
        return acc;
      }, {} as Record<number, any[]>);
      
      // Combine recipes with their ingredients
      const recipesWithIngredients = userRecipes.map(recipe => ({
        ...recipe,
        ingredients: ingredientsByRecipe[recipe.id] || []
      }));
      
      return recipesWithIngredients;
    } catch (error) {
      console.error('Error exporting recipes:', error);
      throw new Error('Failed to export recipes');
    }
  }
  
  /**
   * Export recipes as CSV for a specific user
   */
  async exportRecipesAsCsv(userId: number) {
    try {
      const recipesWithIngredients = await this.exportRecipes(userId);
      
      // Prepare data for CSV export - create rows for each recipe with their ingredients
      const csvData: any[] = [];
      
      recipesWithIngredients.forEach(recipe => {
        // Create a row for the recipe itself
        csvData.push({
          'Recipe Name': recipe.name,
          'Description': recipe.description || '',
          'Notes': recipe.notes || '',
          'Preparation Time': recipe.prepTime || '',
          'Cooking Time': recipe.cookTime || '',
          'Serving Size': recipe.servingSize || '',
          'Category': recipe.category || '',
          'Price': recipe.price || '',
          'Ingredient': '',
          'Quantity': '',
          'Unit': '',
          'Cost': ''
        });
        
        // Create rows for each ingredient in the recipe
        recipe.ingredients.forEach(ingredient => {
          csvData.push({
            'Recipe Name': recipe.name,
            'Description': '',
            'Notes': '',
            'Preparation Time': '',
            'Cooking Time': '',
            'Serving Size': '',
            'Category': '',
            'Price': '',
            'Ingredient': ingredient.ingredient?.name || '',
            'Quantity': ingredient.quantity || '',
            'Unit': ingredient.ingredient?.unit || '',
            'Cost': ingredient.ingredient?.price || ''
          });
        });
      });
      
      // Generate CSV from the data
      return stringify(csvData, { 
        header: true,
        columns: Object.keys(csvData[0] || {})
      });
    } catch (error) {
      console.error('Error exporting recipes as CSV:', error);
      throw new Error('Failed to export recipes as CSV');
    }
  }

  /**
   * Export products for a specific user
   */
  async exportProducts(userId: number) {
    try {
      return await db.select().from(products).where(eq(products.userId, userId));
    } catch (error) {
      console.error('Error exporting products:', error);
      throw new Error('Failed to export products');
    }
  }
  
  /**
   * Export products as CSV for a specific user
   */
  async exportProductsAsCsv(userId: number) {
    try {
      const productsData = await this.exportProducts(userId);
      
      // Prepare data for CSV export
      const csvData = productsData.map(product => {
        return {
          'Product Name': product.name,
          'Description': product.description || '',
          'Price': product.price || '',
          'Category': product.category || '',
          'Image URL': product.imageUrl || '',
          'Notes': product.notes || '',
          'Last Updated': product.updatedAt ? format(new Date(product.updatedAt), 'yyyy-MM-dd') : ''
        };
      });
      
      // Generate CSV from the data
      return stringify(csvData, { 
        header: true,
        columns: Object.keys(csvData[0] || {})
      });
    } catch (error) {
      console.error('Error exporting products as CSV:', error);
      throw new Error('Failed to export products as CSV');
    }
  }

  /**
   * Export financial data for a specific user
   */
  async exportFinancials(userId: number) {
    try {
      const userExpenses = await db.select().from(expenses).where(eq(expenses.userId, userId));
      const userIncome = await db.select().from(income).where(eq(income.userId, userId));
      
      return {
        expenses: userExpenses,
        income: userIncome
      };
    } catch (error) {
      console.error('Error exporting financials:', error);
      throw new Error('Failed to export financial data');
    }
  }
  
  /**
   * Export financial data as CSV for a specific user
   */
  async exportFinancialsAsCsv(userId: number) {
    try {
      const { expenses: userExpenses, income: userIncome } = await this.exportFinancials(userId);
      
      // Prepare expenses data for CSV export
      const expensesData = userExpenses.map(expense => {
        return {
          'Record Type': 'Expense',
          'Date': format(new Date(expense.date), 'yyyy-MM-dd'),
          'Category': expense.category || '',
          'Description': expense.description || '',
          'Amount': expense.amount || 0,
          'Notes': expense.notes || '',
          'Tax Deductible': expense.taxDeductible ? 'Yes' : 'No'
        };
      });
      
      // Prepare income data for CSV export
      const incomeData = userIncome.map(inc => {
        return {
          'Record Type': 'Income',
          'Date': format(new Date(inc.date), 'yyyy-MM-dd'),
          'Category': inc.category || '',
          'Description': inc.description || '',
          'Amount': inc.amount || 0,
          'Notes': inc.notes || '',
          'Tax Deductible': 'N/A'
        };
      });
      
      // Combine both datasets
      const combinedData = [...expensesData, ...incomeData];
      
      // Sort by date
      combinedData.sort((a, b) => {
        return new Date(a.Date).getTime() - new Date(b.Date).getTime();
      });
      
      // Generate CSV from the data
      return stringify(combinedData, { 
        header: true,
        columns: Object.keys(combinedData[0] || {})
      });
    } catch (error) {
      console.error('Error exporting financial data as CSV:', error);
      throw new Error('Failed to export financial data as CSV');
    }
  }

  /**
   * Export tasks for a specific user
   */
  async exportTasks(userId: number) {
    try {
      return await db.select().from(tasks).where(eq(tasks.userId, userId));
    } catch (error) {
      console.error('Error exporting tasks:', error);
      throw new Error('Failed to export tasks');
    }
  }
  
  /**
   * Export tasks as CSV for a specific user
   */
  async exportTasksAsCsv(userId: number) {
    try {
      const tasksData = await this.exportTasks(userId);
      
      // Prepare data for CSV export
      const csvData = tasksData.map(task => {
        return {
          'Title': task.title,
          'Description': task.description || '',
          'Due Date': task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
          'Priority': task.priority || 'Normal',
          'Status': task.status,
          'Related To': task.relatedTo || '',
          'Related ID': task.relatedId || '',
          'Created': format(new Date(task.createdAt), 'yyyy-MM-dd')
        };
      });
      
      // Generate CSV from the data
      return stringify(csvData, { 
        header: true,
        columns: Object.keys(csvData[0] || {})
      });
    } catch (error) {
      console.error('Error exporting tasks as CSV:', error);
      throw new Error('Failed to export tasks as CSV');
    }
  }

  /**
   * Export enquiries for a specific user
   */
  async exportEnquiries(userId: number) {
    try {
      return await db.select().from(enquiries).where(eq(enquiries.userId, userId));
    } catch (error) {
      console.error('Error exporting enquiries:', error);
      throw new Error('Failed to export enquiries');
    }
  }
  
  /**
   * Export enquiries as CSV for a specific user
   */
  async exportEnquiriesAsCsv(userId: number) {
    try {
      const enquiriesData = await this.exportEnquiries(userId);
      
      // Prepare data for CSV export
      const csvData = enquiriesData.map(enquiry => {
        return {
          'Name': enquiry.name,
          'Email': enquiry.email,
          'Phone': enquiry.phone || '',
          'Event Type': enquiry.eventType || '',
          'Event Date': enquiry.eventDate ? format(new Date(enquiry.eventDate), 'yyyy-MM-dd') : '',
          'Budget': enquiry.budget || '',
          'Message': enquiry.message || '',
          'Status': enquiry.status || 'New',
          'Created': format(new Date(enquiry.createdAt), 'yyyy-MM-dd'),
          'Last Updated': enquiry.updatedAt ? format(new Date(enquiry.updatedAt), 'yyyy-MM-dd') : ''
        };
      });
      
      // Generate CSV from the data
      return stringify(csvData, { 
        header: true,
        columns: Object.keys(csvData[0] || {})
      });
    } catch (error) {
      console.error('Error exporting enquiries as CSV:', error);
      throw new Error('Failed to export enquiries as CSV');
    }
  }

  /**
   * Export user settings
   */
  async exportSettings(userId: number) {
    try {
      const userSettings = await db.select().from(settings).where(eq(settings.userId, userId));
      return userSettings[0] || null;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  /**
   * Gather all user data for export
   */
  private async gatherUserData(userId: number) {
    const [
      ordersData,
      contactsData,
      recipesData,
      productsData,
      financialsData,
      tasksData,
      enquiriesData,
      settingsData
    ] = await Promise.all([
      this.exportOrders(userId),
      this.exportContacts(userId),
      this.exportRecipes(userId),
      this.exportProducts(userId),
      this.exportFinancials(userId),
      this.exportTasks(userId),
      this.exportEnquiries(userId),
      this.exportSettings(userId)
    ]);
    
    return {
      orders: ordersData,
      contacts: contactsData,
      recipes: recipesData,
      products: productsData,
      financials: financialsData,
      tasks: tasksData,
      enquiries: enquiriesData,
      settings: settingsData,
      exportDate: new Date().toISOString()
    };
  }
}

export const exportService = new ExportService();