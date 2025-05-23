import { Request, Response } from 'express';
import { pool } from '../db';
import { format, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns';

/**
 * Get dashboard statistics including orders, quotes, revenue, and tasks
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // For a real authentication system we would use req.user.id
    // But for now we'll use a default user ID
    const userId = 1; // Default to user ID 1 for development
    
    // Get total orders count
    const totalOrdersQuery = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE user_id = $1',
      [userId]
    );
    const totalOrders = parseInt(totalOrdersQuery.rows[0].count);
    
    // Get total quotes count
    const totalQuotesQuery = await pool.query(
      'SELECT COUNT(*) FROM quotes WHERE user_id = $1',
      [userId]
    );
    const totalQuotes = parseInt(totalQuotesQuery.rows[0].count);
    
    // Get active quotes (not expired, not converted to orders)
    const activeQuotesQuery = await pool.query(
      `SELECT COUNT(*) FROM quotes 
       WHERE user_id = $1 
       AND status = 'Draft' 
       AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)`,
      [userId]
    );
    const activeQuotes = parseInt(activeQuotesQuery.rows[0].count);
    
    // Get total revenue
    const revenueQuery = await pool.query(
      `SELECT COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as total
       FROM orders 
       WHERE user_id = $1 
       AND status IN ('Paid', 'Delivered', 'Completed')`,
      [userId]
    );
    const totalRevenue = parseFloat(revenueQuery.rows[0].total);
    
    // Get upcoming orders (next 7 days)
    const today = new Date();
    const nextWeek = addDays(today, 7);
    const upcomingOrdersQuery = await pool.query(
      `SELECT COUNT(*) FROM orders 
       WHERE user_id = $1 
       AND event_date BETWEEN $2 AND $3 
       AND status NOT IN ('Cancelled', 'Completed')`,
      [userId, today.toISOString(), nextWeek.toISOString()]
    );
    const upcomingOrders = parseInt(upcomingOrdersQuery.rows[0].count);
    
    // Get pending tasks count
    const pendingTasksQuery = await pool.query(
      `SELECT COUNT(*) FROM tasks 
       WHERE user_id = $1 AND completed = false`,
      [userId]
    );
    const pendingTasks = parseInt(pendingTasksQuery.rows[0].count);
    
    // Get monthly revenue for the past 6 months
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(subMonths(today, i));
      
      const monthRevenueQuery = await pool.query(
        `SELECT COALESCE(SUM(CAST(total_amount AS DECIMAL)), 0) as revenue 
         FROM orders 
         WHERE user_id = $1 
         AND event_date BETWEEN $2 AND $3 
         AND status IN ('Paid', 'Delivered', 'Completed')`,
        [userId, monthStart.toISOString(), monthEnd.toISOString()]
      );
      
      const monthLabel = format(monthStart, 'MMM');
      monthlyRevenue.push({
        month: monthLabel,
        revenue: parseFloat(monthRevenueQuery.rows[0].revenue)
      });
    }
    
    // Get orders by event type
    const ordersByTypeQuery = await pool.query(
      `SELECT event_type as type, COUNT(*) as count 
       FROM orders 
       WHERE user_id = $1 AND event_type IS NOT NULL 
       GROUP BY event_type 
       ORDER BY count DESC 
       LIMIT 5`,
      [userId]
    );
    const ordersByType = ordersByTypeQuery.rows.map(row => ({
      type: row.type || 'Other',
      count: parseInt(row.count)
    }));
    
    // Get quotes by event type
    const quotesByTypeQuery = await pool.query(
      `SELECT event_type as type, COUNT(*) as count 
       FROM quotes 
       WHERE user_id = $1 AND event_type IS NOT NULL 
       GROUP BY event_type 
       ORDER BY count DESC 
       LIMIT 5`,
      [userId]
    );
    const quotesByType = quotesByTypeQuery.rows.map(row => ({
      type: row.type || 'Other',
      count: parseInt(row.count)
    }));
    
    // Combine all the statistics
    res.json({
      totalOrders,
      totalQuotes,
      activeQuotes,
      totalRevenue,
      upcomingOrders,
      pendingTasks,
      monthlyRevenue,
      ordersByType,
      quotesByType
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to retrieve dashboard statistics' });
  }
};