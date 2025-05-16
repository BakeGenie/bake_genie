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