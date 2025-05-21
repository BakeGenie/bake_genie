import { db } from "../db";
import { 
  users, 
  contacts, 
  orders,
  orderItems,
  quotes,
  quoteItems,
  tasks,
  products,
  recipes,
  expenses,
  income,
  enquiries,
  settings,
  featureSettings,
  taxRates,
  integrations,
  productBundles,
  bundleItems,
  ingredients,
  recipeIngredients,
  reminderTemplates,
  reminderSchedules,
  reminderHistory,
  orderLogs,
  payments
} from "@shared/schema";

export interface ImportData {
  users?: any[];
  contacts?: any[];
  orders?: any[];
  orderItems?: any[];
  quotes?: any[];
  quoteItems?: any[];
  tasks?: any[];
  products?: any[];
  recipes?: any[];
  expenses?: any[];
  income?: any[];
  enquiries?: any[];
  settings?: any;
  featureSettings?: any[];
  taxRates?: any[];
  integrations?: any[];
  productBundles?: any[];
  bundleItems?: any[];
  ingredients?: any[];
  recipeIngredients?: any[];
  reminderTemplates?: any[];
  reminderSchedules?: any[];
  reminderHistory?: any[];
  orderLogs?: any[];
  payments?: any[];
}

export class ImportService {
  /**
   * Import data from a backup file
   */
  async importData(data: ImportData, userId: number): Promise<{ success: boolean; message: string }> {
    try {
      let importStats = {
        contacts: 0,
        orders: 0,
        orderItems: 0,
        quotes: 0,
        quoteItems: 0,
        tasks: 0,
        products: 0,
        recipes: 0,
        expenses: 0,
        income: 0,
        enquiries: 0,
        settings: false,
        features: 0,
        taxRates: 0
      };

      // Import contacts
      if (data.contacts && data.contacts.length > 0) {
        for (const contact of data.contacts) {
          const contactData = {
            userId,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            businessName: contact.businessName,
            notes: contact.notes
          };
          await db.insert(contacts).values(contactData);
          importStats.contacts++;
        }
      }

      // Import orders
      if (data.orders && data.orders.length > 0) {
        for (const order of data.orders) {
          const orderData = {
            userId,
            contactId: order.contactId,
            orderNumber: order.orderNumber,
            title: order.title,
            eventType: order.eventType,
            eventDate: order.eventDate,
            status: order.status,
            deliveryType: order.deliveryType,
            deliveryAddress: order.deliveryAddress,
            deliveryFee: order.deliveryFee,
            deliveryTime: order.deliveryTime,
            totalAmount: order.totalAmount,
            amountPaid: order.amountPaid,
            specialInstructions: order.specialInstructions,
            taxRate: order.taxRate,
            notes: order.notes
          };
          await db.insert(orders).values(orderData);
          importStats.orders++;
        }
      }

      // Import order items
      if (data.orderItems && data.orderItems.length > 0) {
        for (const item of data.orderItems) {
          const itemData = {
            orderId: item.orderId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            price: item.price
          };
          await db.insert(orderItems).values(itemData);
          importStats.orderItems++;
        }
      }

      // Import quotes
      if (data.quotes && data.quotes.length > 0) {
        for (const quote of data.quotes) {
          const quoteData = {
            userId,
            contactId: quote.contactId,
            quoteNumber: quote.quoteNumber,
            title: quote.title,
            eventType: quote.eventType,
            eventDate: quote.eventDate,
            status: quote.status,
            deliveryType: quote.deliveryType,
            deliveryAddress: quote.deliveryAddress,
            deliveryFee: quote.deliveryFee,
            totalAmount: quote.totalAmount,
            specialInstructions: quote.specialInstructions,
            expiryDate: quote.expiryDate,
            taxRate: quote.taxRate,
            notes: quote.notes
          };
          await db.insert(quotes).values(quoteData);
          importStats.quotes++;
        }
      }

      // Import quote items
      if (data.quoteItems && data.quoteItems.length > 0) {
        for (const item of data.quoteItems) {
          const itemData = {
            quoteId: item.quoteId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            price: item.price
          };
          await db.insert(quoteItems).values(itemData);
          importStats.quoteItems++;
        }
      }

      // Import products
      if (data.products && data.products.length > 0) {
        for (const product of data.products) {
          const productData = {
            userId,
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            sku: product.sku,
            active: product.active,
            imageUrl: product.imageUrl,
            productType: product.productType
          };
          await db.insert(products).values(productData);
          importStats.products++;
        }
      }

      // Import recipes
      if (data.recipes && data.recipes.length > 0) {
        for (const recipe of data.recipes) {
          const recipeData = {
            userId,
            name: recipe.name,
            description: recipe.description,
            category: recipe.category,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            yield: recipe.yield,
            instructions: recipe.instructions,
            notes: recipe.notes,
            isPublic: recipe.isPublic,
            imageUrl: recipe.imageUrl
          };
          await db.insert(recipes).values(recipeData);
          importStats.recipes++;
        }
      }

      // Import ingredients
      if (data.ingredients && data.ingredients.length > 0) {
        for (const ingredient of data.ingredients) {
          const ingredientData = {
            userId,
            name: ingredient.name,
            unit: ingredient.unit,
            costPerUnit: ingredient.costPerUnit,
            category: ingredient.category,
            inStock: ingredient.inStock,
            stockQuantity: ingredient.stockQuantity,
            supplier: ingredient.supplier
          };
          await db.insert(ingredients).values(ingredientData);
          importStats.ingredients++;
        }
      }

      // Import recipe ingredients
      if (data.recipeIngredients && data.recipeIngredients.length > 0) {
        for (const ri of data.recipeIngredients) {
          const riData = {
            recipeId: ri.recipeId,
            ingredientId: ri.ingredientId,
            quantity: ri.quantity,
            notes: ri.notes
          };
          await db.insert(recipeIngredients).values(riData);
        }
      }

      // Import expenses
      if (data.expenses && data.expenses.length > 0) {
        for (const expense of data.expenses) {
          const expenseData = {
            userId,
            date: expense.date,
            category: expense.category,
            amount: expense.amount,
            description: expense.description,
            receiptUrl: expense.receiptUrl,
            taxDeductible: expense.taxDeductible
          };
          await db.insert(expenses).values(expenseData);
          importStats.expenses++;
        }
      }

      // Import income
      if (data.income && data.income.length > 0) {
        for (const inc of data.income) {
          const incomeData = {
            userId,
            date: inc.date,
            category: inc.category,
            amount: inc.amount,
            description: inc.description,
            receiptUrl: inc.receiptUrl
          };
          await db.insert(income).values(incomeData);
          importStats.income++;
        }
      }

      // Import tasks
      if (data.tasks && data.tasks.length > 0) {
        for (const task of data.tasks) {
          const taskData = {
            userId,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            priority: task.priority,
            completed: task.completed,
            category: task.category,
            relatedTo: task.relatedTo,
            relatedId: task.relatedId
          };
          await db.insert(tasks).values(taskData);
          importStats.tasks++;
        }
      }

      // Import enquiries
      if (data.enquiries && data.enquiries.length > 0) {
        for (const enquiry of data.enquiries) {
          const enquiryData = {
            userId,
            firstName: enquiry.firstName,
            lastName: enquiry.lastName,
            email: enquiry.email,
            phone: enquiry.phone,
            eventType: enquiry.eventType,
            eventDate: enquiry.eventDate,
            message: enquiry.message,
            status: enquiry.status,
            source: enquiry.source
          };
          await db.insert(enquiries).values(enquiryData);
          importStats.enquiries++;
        }
      }

      // Import settings
      if (data.settings) {
        const settingsData = {
          userId,
          businessName: data.settings.businessName,
          businessEmail: data.settings.businessEmail,
          businessPhone: data.settings.businessPhone,
          businessAddress: data.settings.businessAddress,
          businessLogo: data.settings.businessLogo,
          invoicePrefix: data.settings.invoicePrefix,
          quotePrefix: data.settings.quotePrefix,
          taxRate: data.settings.taxRate,
          currency: data.settings.currency,
          dateFormat: data.settings.dateFormat,
          timeFormat: data.settings.timeFormat,
          theme: data.settings.theme,
          businessHours: data.settings.businessHours,
          notificationEmail: data.settings.notificationEmail,
          emailTemplate: data.settings.emailTemplate,
          documentFont: data.settings.documentFont,
          documentFontSize: data.settings.documentFontSize,
          emailSubject: data.settings.emailSubject,
          emailBody: data.settings.emailBody,
          emailSignature: data.settings.emailSignature,
          paymentTerms: data.settings.paymentTerms,
          weekStart: data.settings.weekStart
        };
        await db.insert(settings).values(settingsData);
        importStats.settings = true;
      }

      // Import tax rates
      if (data.taxRates && data.taxRates.length > 0) {
        for (const taxRate of data.taxRates) {
          const taxRateData = {
            userId,
            name: taxRate.name,
            rate: taxRate.rate,
            isDefault: taxRate.isDefault,
            description: taxRate.description
          };
          await db.insert(taxRates).values(taxRateData);
          importStats.taxRates++;
        }
      }

      // Import feature settings
      if (data.featureSettings && data.featureSettings.length > 0) {
        for (const feature of data.featureSettings) {
          const featureData = {
            id: feature.id,
            name: feature.name,
            enabled: feature.enabled,
            userId
          };
          await db.insert(featureSettings).values(featureData);
          importStats.features++;
        }
      }

      return {
        success: true,
        message: `
          Successfully imported the following data:
          - ${importStats.contacts} contacts
          - ${importStats.orders} orders (with ${importStats.orderItems} items)
          - ${importStats.quotes} quotes (with ${importStats.quoteItems} items)
          - ${importStats.products} products
          - ${importStats.recipes} recipes
          - ${importStats.tasks} tasks
          - ${importStats.expenses} expenses
          - ${importStats.income} income entries
          - ${importStats.enquiries} enquiries
          - ${importStats.settings ? 'Business settings' : 'No settings'}
          - ${importStats.features} feature settings
          - ${importStats.taxRates} tax rates
        `
      };
    } catch (error) {
      console.error("Import error:", error);
      return { 
        success: false, 
        message: `Import failed: ${(error as Error).message}` 
      };
    }
  }
}

export const importService = new ImportService();