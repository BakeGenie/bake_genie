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
    
    // Check if user already has an active subscription
    const existingSubscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    
    // Check if user already has an active subscription or trial
    const hasActiveSubscription = existingSubscriptions.some(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    );
    
    if (hasActiveSubscription) {
      return res.status(400).json({ 
        error: 'You already have an active subscription or trial' 
      });
    }
    
    // Check if user already used their trial (even if it's expired)
    const usedTrial = existingSubscriptions.some(sub => 
      sub.trialStart !== null && sub.trialEnd !== null
    );
    
    if (usedTrial) {
      return res.status(400).json({ 
        error: 'You have already used your free trial period' 
      });
    }
    
    // Try to find Standard plan
    let standardPlan;
    try {
      [standardPlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, 'Standard'));
    } catch (err) {
      console.error('Error finding subscription plan:', err);
    }
    
    // If there's no Standard plan, try to find any plan
    if (!standardPlan) {
      try {
        [standardPlan] = await db
          .select()
          .from(subscriptionPlans)
          .limit(1);
      } catch (err) {
        console.error('Error finding any subscription plan:', err);
      }
    }
    
    // If still no plan found, use hard-coded default
    if (!standardPlan) {
      console.log('No subscription plans found, using default values');
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
    let subscription;
    try {
      // Ensure variable names match DB field names using snake_case
      [subscription] = await db
        .insert(userSubscriptions)
        .values({
          user_id: userId,
          plan_id: standardPlan.id,
          plan_name: standardPlan.name,
          status: 'trialing',
          trial_start: trialStart,
          trial_end: trialEnd,
          price: standardPlan.price,
          cancel_at_period_end: false,
          current_period_start: trialStart,
          current_period_end: trialEnd,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      console.log('Trial subscription created:', subscription);
    } catch (insertError) {
      console.error('Error inserting trial subscription:', insertError);
      return res.status(500).json({ 
        error: 'Database error when creating trial subscription' 
      });
    }
    
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
    res.status(500).json({ 
      error: 'Failed to start free trial', 
      details: error.message 
    });
  }
});

export default router;