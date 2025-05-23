import { Request, Response } from "express";
import { db } from "../db";
import { eq, and, between, gte, lte, like, sql } from "drizzle-orm";
import { 
  orders, 
  orderItems, 
  quotes,
  quoteItems,
  contacts, 
  tasks, 
  expenses, 
  income,
  recipes,
  recipeIngredients,
  ingredients,
  payments,
  productBundles,
  bundleItems
} from "@shared/schema";

// Interface to define request with date range filters
interface DateRangeRequest extends Request {
  query: {
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  };
}

// Helper functions
const getDateRange = (req: DateRangeRequest) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(1)); // Default to first day of current month
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date(); // Default to today
  return { startDate, endDate };
};

// Order List Report
export const getOrderListReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Using direct SQL for better compatibility
    const result = await db.execute(sql`
      SELECT 
        o.id,
        o.order_number as "orderNumber", 
        o.event_date as "eventDate",
        CONCAT(c.first_name, ' ', c.last_name) as "customerName",
        o.event_type as "eventType",
        o.status,
        o.total,
        o.created_at as "createdAt"
      FROM orders o
      LEFT JOIN contacts c ON o.contact_id = c.id
      WHERE o.event_date >= ${startDate.toISOString()}
        AND o.event_date <= ${endDate.toISOString()}
      ORDER BY o.event_date
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching order list report:", error);
    res.status(500).json({ error: "Failed to generate order list report" });
  }
};

// Quote List Report
export const getQuoteListReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Using direct SQL for better compatibility
    const result = await db.execute(sql`
      SELECT 
        o.id,
        o.order_number as "quoteNumber",
        o.created_at as "createdAt",
        CONCAT(c.first_name, ' ', c.last_name) as "customerName",
        o.event_type as "eventType",
        o.status,
        o.total
      FROM orders o
      LEFT JOIN contacts c ON o.contact_id = c.id
      WHERE o.status = 'Quote'
        AND o.created_at >= ${startDate.toISOString()}
        AND o.created_at <= ${endDate.toISOString()}
      ORDER BY o.created_at
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching quote list report:", error);
    res.status(500).json({ error: "Failed to generate quote list report" });
  }
};

// Baking List Report
export const getBakingListReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Get all order items with recipe or product info for upcoming orders
    // Using direct SQL for better compatibility
    const result = await db.execute(sql`
      SELECT 
        oi.id,
        o.order_number as "orderNumber",
        o.event_date as "eventDate",
        CONCAT(c.first_name, ' ', c.last_name) as "customerName",
        oi.name as "itemName",
        oi.quantity as quantity,
        oi.notes as notes
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN contacts c ON o.contact_id = c.id
      WHERE o.event_date >= ${startDate.toISOString()}
        AND o.event_date <= ${endDate.toISOString()}
      ORDER BY o.event_date
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching baking list report:", error);
    res.status(500).json({ error: "Failed to generate baking list report" });
  }
};

// Baking List by Type Report
export const getBakingListByTypeReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Using direct SQL for better compatibility
    const result = await db.execute(sql`
      SELECT 
        oi.id,
        o.order_number as "orderNumber",
        o.event_date as "eventDate",
        CONCAT(c.first_name, ' ', c.last_name) as "customerName",
        oi.name as "itemName",
        oi.quantity,
        oi.notes,
        oi.type as "productType"
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN contacts c ON o.contact_id = c.id
      WHERE o.status != 'Quote'
        AND o.event_date >= ${startDate.toISOString()}
        AND o.event_date <= ${endDate.toISOString()}
      ORDER BY oi.type, o.event_date
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching baking list by type report:", error);
    res.status(500).json({ error: "Failed to generate baking list by type report" });
  }
};

// Shopping List Report
export const getShoppingListReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Using direct SQL for shopping list report
    const result = await db.execute(sql`
      SELECT 
        i.id,
        i.name as ingredient,
        SUM(ri.quantity) as quantity,
        i.unit,
        i.notes as supplier
      FROM ingredients i
      JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      JOIN recipes r ON ri.recipe_id = r.id
      JOIN order_items oi ON oi.name ILIKE CONCAT('%', r.name, '%')
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'Quote'
        AND o.event_date >= ${startDate.toISOString()}
        AND o.event_date <= ${endDate.toISOString()}
      GROUP BY i.id, i.name, i.unit, i.notes
      ORDER BY i.name
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching shopping list report:", error);
    res.status(500).json({ error: "Failed to generate shopping list report" });
  }
};

// Task List Report
export const getTaskListReport = async (req: Request, res: Response) => {
  try {
    // Using direct SQL for better compatibility
    const result = await db.execute(sql`
      SELECT 
        t.id,
        t.title,
        t.due_date as "dueDate",
        t.priority,
        t.completed as status,
        t.order_id as "relatedOrderId",
        o.order_number as "relatedOrderNumber"
      FROM tasks t
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE t.completed = false
      ORDER BY t.due_date
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching task list report:", error);
    res.status(500).json({ error: "Failed to generate task list report" });
  }
};

// Deliveries List Report
export const getDeliveriesListReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Using direct SQL for better compatibility
    const result = await db.execute(sql`
      SELECT 
        o.id,
        o.order_number as "orderNumber",
        o.event_date as "eventDate",
        CONCAT(c.first_name, ' ', c.last_name) as "customerName",
        o.delivery_details as address,
        o.event_date as "deliveryDate",
        o.status
      FROM orders o
      LEFT JOIN contacts c ON o.contact_id = c.id
      WHERE o.status != 'Quote'
        AND o.delivery_type = 'Delivery'
        AND o.event_date >= ${startDate.toISOString()}
        AND o.event_date <= ${endDate.toISOString()}
      ORDER BY o.event_date
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching deliveries list report:", error);
    res.status(500).json({ error: "Failed to generate deliveries list report" });
  }
};

// Income Statement Report
export const getIncomeStatementReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Using direct SQL to get income from orders
    const ordersResult = await db.execute(sql`
      SELECT SUM(total) as "orderIncome"
      FROM orders
      WHERE status != 'Quote'
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
    `);
    
    // Using direct SQL to get additional income
    const additionalIncomeResult = await db.execute(sql`
      SELECT SUM(amount) as "additionalIncome"
      FROM income
      WHERE date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
    `);
    
    // Using direct SQL to get expenses
    const expensesResult = await db.execute(sql`
      SELECT SUM(amount) as "totalExpenses"
      FROM expenses
      WHERE date >= ${startDate.toISOString()}
        AND date <= ${endDate.toISOString()}
    `);
    
    // Extract values, handling null cases
    const orderIncome = Number(ordersResult.rows[0]?.orderIncome || 0);
    const additionalIncome = Number(additionalIncomeResult.rows[0]?.additionalIncome || 0);
    const totalExpenses = Number(expensesResult.rows[0]?.totalExpenses || 0);
    
    // Calculate total income and net profit
    const totalIncome = orderIncome + additionalIncome;
    const netProfit = totalIncome - totalExpenses;
    
    // Format the income statement
    const incomeStatement = {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      income: {
        orderIncome,
        additionalIncome,
        totalIncome
      },
      expenses: {
        totalExpenses
      },
      summary: {
        netProfit,
        profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0
      }
    };
    
    res.status(200).json(incomeStatement);
  } catch (error) {
    console.error("Error fetching income statement report:", error);
    res.status(500).json({ error: "Failed to generate income statement report" });
  }
};

// Detailed Order Item Breakdown Report
export const getOrderItemBreakdownReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const orderItemsBreakdown = await db.select({
      id: orderItems.id,
      orderNumber: orders.orderNumber,
      eventDate: orders.eventDate,
      customerName: sql`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
      itemName: orderItems.name,
      description: orderItems.description,
      quantity: orderItems.quantity,
      price: orderItems.price,
      total: sql`${orderItems.quantity} * ${orderItems.price}`,
      notes: orderItems.notes
    })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(contacts, eq(orders.contactId, contacts.id))
    .where(
      and(
        eq(orders.isQuote, false),
        gte(orders.eventDate, startDate.toISOString()),
        lte(orders.eventDate, endDate.toISOString())
      )
    )
    .orderBy(orders.eventDate);
    
    res.status(200).json(orderItemsBreakdown);
  } catch (error) {
    console.error("Error fetching order item breakdown report:", error);
    res.status(500).json({ error: "Failed to generate order item breakdown report" });
  }
};

// Breakdown by Order Type Report
export const getBreakdownByOrderTypeReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const orderTypeBreakdown = await db.select({
      orderType: orders.status,
      count: sql`COUNT(*)`,
      totalValue: sql`SUM(${orders.total})`,
      averageValue: sql`AVG(${orders.total})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.isQuote, false),
        gte(orders.eventDate, startDate.toISOString()),
        lte(orders.eventDate, endDate.toISOString())
      )
    )
    .groupBy(orders.status)
    .orderBy(sql`totalValue DESC`);
    
    res.status(200).json(orderTypeBreakdown);
  } catch (error) {
    console.error("Error fetching breakdown by order type report:", error);
    res.status(500).json({ error: "Failed to generate breakdown by order type report" });
  }
};

// Breakdown by Event Type Report
export const getBreakdownByEventTypeReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const eventTypeBreakdown = await db.select({
      eventType: orders.eventType,
      count: sql`COUNT(*)`,
      totalValue: sql`SUM(${orders.total})`,
      averageValue: sql`AVG(${orders.total})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.isQuote, false),
        gte(orders.eventDate, startDate.toISOString()),
        lte(orders.eventDate, endDate.toISOString())
      )
    )
    .groupBy(orders.eventType)
    .orderBy(sql`totalValue DESC`);
    
    res.status(200).json(eventTypeBreakdown);
  } catch (error) {
    console.error("Error fetching breakdown by event type report:", error);
    res.status(500).json({ error: "Failed to generate breakdown by event type report" });
  }
};

// Payments by Period Report
export const getPaymentsByPeriodReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const paymentsList = await db.select({
      id: payments.id,
      date: payments.createdAt,
      orderNumber: orders.orderNumber,
      customerName: sql`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      type: payments.type,
      notes: payments.notes
    })
    .from(payments)
    .leftJoin(orders, eq(payments.orderId, orders.id))
    .leftJoin(contacts, eq(orders.contactId, contacts.id))
    .where(
      and(
        gte(payments.createdAt, startDate.toISOString()),
        lte(payments.createdAt, endDate.toISOString())
      )
    )
    .orderBy(payments.createdAt);
    
    res.status(200).json(paymentsList);
  } catch (error) {
    console.error("Error fetching payments by period report:", error);
    res.status(500).json({ error: "Failed to generate payments by period report" });
  }
};

// Expense Reports
export const getExpenseSummaryReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const expenseSummary = await db.select({
      category: expenses.category,
      count: sql`COUNT(*)`,
      totalAmount: sql`SUM(${expenses.amount})`
    })
    .from(expenses)
    .where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    )
    .groupBy(expenses.category)
    .orderBy(sql`totalAmount DESC`);
    
    res.status(200).json(expenseSummary);
  } catch (error) {
    console.error("Error fetching expense summary report:", error);
    res.status(500).json({ error: "Failed to generate expense summary report" });
  }
};

export const getExpenseDetailedReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const expensesList = await db.select({
      id: expenses.id,
      date: expenses.date,
      category: expenses.category,
      description: expenses.description,
      amount: expenses.amount
    })
    .from(expenses)
    .where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    )
    .orderBy(expenses.date);
    
    res.status(200).json(expensesList);
  } catch (error) {
    console.error("Error fetching detailed expense report:", error);
    res.status(500).json({ error: "Failed to generate detailed expense report" });
  }
};

export const getExpensesByCategoryReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const expensesByCategory = await db.select({
      category: expenses.category,
      count: sql`COUNT(*)`,
      totalAmount: sql`SUM(${expenses.amount})`
    })
    .from(expenses)
    .where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    )
    .groupBy(expenses.category)
    .orderBy(sql`totalAmount DESC`);
    
    res.status(200).json(expensesByCategory);
  } catch (error) {
    console.error("Error fetching expenses by category report:", error);
    res.status(500).json({ error: "Failed to generate expenses by category report" });
  }
};

// Income Reports
export const getIncomeDetailedReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const incomeList = await db.select({
      id: income.id,
      date: income.date,
      source: income.source,
      description: income.description,
      amount: income.amount
    })
    .from(income)
    .where(
      and(
        gte(income.date, startDate.toISOString()),
        lte(income.date, endDate.toISOString())
      )
    )
    .orderBy(income.date);
    
    res.status(200).json(incomeList);
  } catch (error) {
    console.error("Error fetching detailed income report:", error);
    res.status(500).json({ error: "Failed to generate detailed income report" });
  }
};

export const getIncomeByCategoryReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const incomeByCategory = await db.select({
      category: income.source,
      count: sql`COUNT(*)`,
      totalAmount: sql`SUM(${income.amount})`
    })
    .from(income)
    .where(
      and(
        gte(income.date, startDate.toISOString()),
        lte(income.date, endDate.toISOString())
      )
    )
    .groupBy(income.source)
    .orderBy(sql`totalAmount DESC`);
    
    res.status(200).json(incomeByCategory);
  } catch (error) {
    console.error("Error fetching income by category report:", error);
    res.status(500).json({ error: "Failed to generate income by category report" });
  }
};

// Business Performance Report
export const getBusinessPerformanceReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    // Get order metrics
    const orderMetrics = await db.select({
      totalOrders: sql`COUNT(*)`,
      totalRevenue: sql`SUM(${orders.total})`,
      averageOrderValue: sql`AVG(${orders.total})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.isQuote, false),
        gte(orders.createdAt, startDate.toISOString()),
        lte(orders.createdAt, endDate.toISOString())
      )
    );
    
    // Get expense metrics
    const expenseMetrics = await db.select({
      totalExpenses: sql`SUM(${expenses.amount})`
    })
    .from(expenses)
    .where(
      and(
        gte(expenses.date, startDate.toISOString()),
        lte(expenses.date, endDate.toISOString())
      )
    );
    
    // Get quote conversion metrics
    const quoteMetrics = await db.select({
      totalQuotes: sql`COUNT(*)`,
      convertedQuotes: sql`SUM(CASE WHEN ${orders.status} NOT IN ('Quote', 'Cancelled') THEN 1 ELSE 0 END)`
    })
    .from(orders)
    .where(
      and(
        eq(orders.isQuote, true),
        gte(orders.createdAt, startDate.toISOString()),
        lte(orders.createdAt, endDate.toISOString())
      )
    );
    
    // Get top event types
    const topEventTypes = await db.select({
      eventType: orders.eventType,
      count: sql`COUNT(*)`,
      totalRevenue: sql`SUM(${orders.total})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.isQuote, false),
        gte(orders.eventDate, startDate.toISOString()),
        lte(orders.eventDate, endDate.toISOString())
      )
    )
    .groupBy(orders.eventType)
    .orderBy(sql`totalRevenue DESC`)
    .limit(5);
    
    // Extract values safely
    const totalOrders = Number(orderMetrics[0]?.totalOrders || 0);
    const totalRevenue = Number(orderMetrics[0]?.totalRevenue || 0);
    const averageOrderValue = Number(orderMetrics[0]?.averageOrderValue || 0);
    const totalExpenses = Number(expenseMetrics[0]?.totalExpenses || 0);
    const totalQuotes = Number(quoteMetrics[0]?.totalQuotes || 0);
    const convertedQuotes = Number(quoteMetrics[0]?.convertedQuotes || 0);
    
    // Calculate derived metrics
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const quoteConversionRate = totalQuotes > 0 ? (convertedQuotes / totalQuotes) * 100 : 0;
    
    // Construct the performance report
    const performanceReport = {
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      orderMetrics: {
        totalOrders,
        totalRevenue,
        averageOrderValue
      },
      financialMetrics: {
        totalRevenue,
        totalExpenses,
        profit,
        profitMargin: parseFloat(profitMargin.toFixed(2))
      },
      salesMetrics: {
        totalQuotes,
        convertedQuotes,
        quoteConversionRate: parseFloat(quoteConversionRate.toFixed(2))
      },
      topEventTypes
    };
    
    res.status(200).json(performanceReport);
  } catch (error) {
    console.error("Error fetching business performance report:", error);
    res.status(500).json({ error: "Failed to generate business performance report" });
  }
};

// Customer Analytics Report
export const getCustomerAnalyticsReport = async (req: DateRangeRequest, res: Response) => {
  try {
    const { startDate, endDate } = getDateRange(req);
    
    const customerAnalytics = await db.select({
      id: contacts.id,
      customerName: sql`CONCAT(${contacts.firstName}, ' ', ${contacts.lastName})`,
      orderCount: sql`COUNT(${orders.id})`,
      totalSpent: sql`SUM(${orders.total})`,
      averageOrderValue: sql`AVG(${orders.total})`,
      firstOrderDate: sql`MIN(${orders.createdAt})`,
      lastOrderDate: sql`MAX(${orders.createdAt})`
    })
    .from(contacts)
    .leftJoin(orders, eq(contacts.id, orders.contactId))
    .where(
      and(
        eq(orders.isQuote, false),
        gte(orders.createdAt, startDate.toISOString()),
        lte(orders.createdAt, endDate.toISOString())
      )
    )
    .groupBy(contacts.id, contacts.firstName, contacts.lastName)
    .orderBy(sql`totalSpent DESC`);
    
    res.status(200).json(customerAnalytics);
  } catch (error) {
    console.error("Error fetching customer analytics report:", error);
    res.status(500).json({ error: "Failed to generate customer analytics report" });
  }
};

// Report Download Handlers
export const downloadReport = async (req: Request, res: Response) => {
  const { reportId, format } = req.params;
  const { startDate, endDate } = req.query as { startDate?: string, endDate?: string };
  
  try {
    // For now we'll simply return a success message
    // In a production implementation, this would generate and return a file for download
    res.status(200).json({ 
      message: `Report ${reportId} generated in ${format} format`,
      dateRange: {
        startDate: startDate || new Date(new Date().setDate(1)).toISOString(),
        endDate: endDate || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error downloading ${reportId} report:`, error);
    res.status(500).json({ error: `Failed to download ${reportId} report` });
  }
};