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
    
    // Check if user has an active subscription
    const subscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
    
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
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    
    console.log(`Found ${existingSubscriptions.length} existing subscriptions`);
    
    const hadTrialBefore = existingSubscriptions.some(sub => 
      sub.trialStart !== null && sub.trialEnd !== null
    );
    
    if (hadTrialBefore) {
      console.log(`User has already used trial`);
      return res.status(400).json({ 
        error: 'You have already used your free trial period',
        hadTrialBefore: true 
      });
    }
    
    // Get the standard plan to associate with the trial (or create one if it doesn't exist)
    let [standardPlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, 'Standard'));
    
    if (!standardPlan) {
      console.log(`No standard plan found, creating one`);
      [standardPlan] = await db
        .insert(subscriptionPlans)
        .values({
          name: 'Standard',
          description: 'Standard plan with all features',
          price: '29.99',
          interval: 'monthly',
          features: ['All features included'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }
    
    // Calculate trial period (30 days)
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    
    console.log(`Creating trial subscription: start=${trialStart.toISOString()}, end=${trialEnd.toISOString()}`);
    
    // Create a trial subscription record
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId,
        planId: standardPlan.id,
        planName: standardPlan.name,
        status: 'trialing',
        trialStart,
        trialEnd,
        // isTrialUsed field is not in the database yet, remove it
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Trial started successfully: ${JSON.stringify(subscription)}`);
    
    res.json({
      success: true,
      message: 'Trial started successfully',
      trialEndDate: trialEnd,
      daysLeft: 30,
      subscription
    });
    
  } catch (error) {
    console.error('Error starting trial:', error);
    res.status(500).json({ error: 'Failed to start trial' });
  }
});

export default router;