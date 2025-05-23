import express from 'express';
import { db } from '../db';
import { eq, sql, and, desc } from 'drizzle-orm';
import { userSubscriptions, subscriptionPlans } from '@shared/schema';
import Stripe from 'stripe';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Stripe secret key not found in environment variables');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
}) : null;

const router = express.Router();

// Get trial status
router.get('/trial/status', async (req: any, res) => {
  try {
    // For development, use a demo user if not authenticated
    const userId = req.user?.id || 1; // Use ID 1 as demo user fallback
    console.log(`Getting trial status for user ID: ${userId}`);
    
    // Check if user has an active subscription
    const subscriptions = await db
      .select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        planId: userSubscriptions.planId,
        planName: userSubscriptions.planName,
        status: userSubscriptions.status,
        currentPeriodStart: userSubscriptions.currentPeriodStart,
        currentPeriodEnd: userSubscriptions.currentPeriodEnd,
        trialStart: userSubscriptions.trialStart,
        trialEnd: userSubscriptions.trialEnd,
        createdAt: userSubscriptions.createdAt
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
    
    console.log(`Found ${subscriptions.length} subscriptions`);
    
    const activeSubscription = subscriptions.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    // If user has an active paid subscription, return that info
    if (activeSubscription && activeSubscription.status === 'active') {
      return res.json({
        isInTrial: false,
        trialEnded: false,
        hasActiveSubscription: true,
        daysLeft: 0,
        subscriptionId: activeSubscription.id,
        currentPeriodEnd: activeSubscription.currentPeriodEnd
      });
    }
    
    // If user is currently in trial
    if (activeSubscription && activeSubscription.status === 'trialing') {
      const currentDate = new Date();
      const trialEndDate = new Date(activeSubscription.trialEnd || '');
      
      // Calculate days left in trial
      const timeDiff = trialEndDate.getTime() - currentDate.getTime();
      const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      
      return res.json({
        isInTrial: true,
        trialEnded: daysLeft === 0,
        hasActiveSubscription: false,
        daysLeft,
        trialStartDate: activeSubscription.trialStart,
        trialEndDate: activeSubscription.trialEnd
      });
    }
    
    // Check if user had a trial before
    const previousTrial = subscriptions.find(sub => 
      sub.trialStart !== null && sub.trialEnd !== null
    );
    
    // If user had a trial before and it ended
    if (previousTrial) {
      const currentDate = new Date();
      const trialEndDate = new Date(previousTrial.trialEnd || '');
      
      if (currentDate > trialEndDate) {
        return res.json({
          isInTrial: false,
          trialEnded: true,
          hasActiveSubscription: false,
          daysLeft: 0
        });
      }
    }
    
    // User never had a trial
    return res.json({
      isInTrial: false,
      trialEnded: false,
      hasActiveSubscription: false,
      daysLeft: 30, // Default trial length
      eligibleForTrial: true
    });
    
  } catch (error) {
    console.error('Error getting trial status:', error);
    res.status(500).json({ error: 'Failed to get trial status' });
  }
});

// Start a trial
router.post('/trial/start', async (req: any, res) => {
  try {
    // For development, use a demo user if not authenticated
    const userId = req.user?.id || 1; // Use ID 1 as demo user fallback
    console.log(`Starting trial for user ID: ${userId}`);
    
    // Check if user is eligible for a trial
    const existingSubscriptions = await db
      .select({
        id: userSubscriptions.id,
        userId: userSubscriptions.userId,
        trialStart: userSubscriptions.trialStart,
        trialEnd: userSubscriptions.trialEnd
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    
    // Check if user already had a trial
    const hadTrial = existingSubscriptions.some(sub => 
      sub.trialStart !== null && sub.trialEnd !== null
    );
    
    if (hadTrial) {
      return res.status(400).json({ 
        error: 'You have already used your free trial period' 
      });
    }
    
    // Get the standard plan from the database
    const [standardPlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, 'Standard'));
    
    // Use a default plan if we can't find one
    if (!standardPlan) {
      console.log('Could not find a standard subscription plan, using default values');
      standardPlan = {
        id: 1,
        name: 'Standard',
        description: 'Complete baking business management',
        price: '19.99',
        interval: 'monthly'
      };
    }
    
    // Start date is now
    const trialStart = new Date();
    
    // End date is 30 days from now
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    
    // Create a trial subscription
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        planId: standardPlan.id,
        planName: standardPlan.name,
        status: 'trialing',
        trialStart,
        trialEnd,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // Return trial info
    return res.json({
      success: true,
      message: 'Free trial started successfully',
      trialStart,
      trialEnd,
      daysLeft: 30,
      subscription
    });
    
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ error: 'Failed to start free trial' });
  }
});

export default router;