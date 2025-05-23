import { Router } from 'express';
import { db } from '../db';
import { expenses } from '@shared/schema';
import { isAuthenticated } from '../middleware/auth';
import { sql } from 'drizzle-orm';

const router = Router();

// Import expenses from CSV
router.post('/api/expenses/import', isAuthenticated, async (req, res) => {
  try {
    const { expenses: expensesData } = req.body;
    
    if (!expensesData || !Array.isArray(expensesData) || expensesData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No expense data provided or invalid format' 
      });
    }
    
    const userId = req.user.id;
    let importedCount = 0;
    let failedCount = 0;
    
    // Process each expense record
    for (const expense of expensesData) {
      try {
        // Add userId to each expense
        expense.userId = userId;
        
        // Insert expense into database
        await db.insert(expenses).values({
          userId: userId,
          category: expense.category || 'Other',
          amount: expense.amount || 0,
          date: expense.date || new Date().toISOString().split('T')[0],
          description: expense.description || '',
          taxDeductible: expense.taxDeductible || false,
          supplier: expense.supplier || null,
          paymentSource: expense.paymentSource || null,
          vat: expense.vat || null,
          totalIncTax: expense.totalIncTax || null,
          isRecurring: expense.isRecurring || false
        });
        
        importedCount++;
      } catch (error) {
        console.error('Error importing expense:', error);
        failedCount++;
      }
    }
    
    return res.status(201).json({
      success: true,
      message: `Successfully imported ${importedCount} expenses. ${failedCount > 0 ? `Failed to import ${failedCount} expenses.` : ''}`,
      data: {
        imported: importedCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('Error in expense import:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to import expenses' 
    });
  }
});

export default router;