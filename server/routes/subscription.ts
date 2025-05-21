import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { sendCancellationEmail } from '../services/email-service';
import { eq } from 'drizzle-orm';

const router = Router();

// Route to cancel a subscription
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    // Get the user ID from the session
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user details for the email
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate effective end date (end of current billing period)
    // For this demo, we'll use the user's creation date to calculate the next billing date
    const createdDate = new Date(user.createdAt);
    const today = new Date();
    
    // Calculate months difference between creation date and today
    const monthsDiff = (today.getFullYear() - createdDate.getFullYear()) * 12 + 
                       today.getMonth() - createdDate.getMonth();
    
    // Get the next billing date by adding one more month to the pattern
    const effectiveEndDate = new Date(createdDate);
    effectiveEndDate.setMonth(createdDate.getMonth() + monthsDiff + 1);
    
    // Preserve the day from the original creation date
    effectiveEndDate.setDate(createdDate.getDate());

    // In a real system, we would update a subscriptions table to mark this subscription as cancelled
    // but still active until the effective end date
    
    // Send cancellation confirmation email
    const userName = `${user.firstName} ${user.lastName}`;
    const emailResult = await sendCancellationEmail(
      user.email || '',  // Use empty string as fallback if email is null
      userName,
      effectiveEndDate
    );

    if (!emailResult) {
      // Even if email fails, we still consider the cancellation successful
      console.error('Failed to send cancellation email');
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      effectiveEndDate
    });
    
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;