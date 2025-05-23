import { Router, Request, Response } from 'express';
import { db } from '../db';
import { subscriptionPlans, userSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export const router = Router();

// Create a simple trial subscription without requiring payment upfront
router.post('/create-trial-subscription', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = Number(req.session.userId);

    // Check if user already has an active subscription
    const [existingSubscription] = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (existingSubscription) {
      return res.status(400).json({ 
        error: 'User already has a subscription', 
        message: 'You already have a subscription or trial.' 
      });
    }

    // Get default plan (we'll just use ID 1 for now as the default plan)
    const defaultPlanId = 1;
    
    // Calculate trial period dates
    const now = new Date();
    const trialStart = now;
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial
    
    console.log(`Creating trial for user ${userId} from ${trialStart} to ${trialEnd}`);

    // Create a trial record in the database
    const [userSubscription] = await db.insert(userSubscriptions)
      .values({
        userId,
        planId: defaultPlanId,
        status: 'trialing',
        currentPeriodStart: trialStart,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        trialStart: trialStart,
        trialEnd: trialEnd,
        createdAt: new Date(),
      })
      .returning();

    console.log(`Trial created successfully: ${JSON.stringify(userSubscription)}`);

    res.json({
      success: true,
      subscription: userSubscription
    });
  } catch (error: any) {
    console.error('Error creating trial subscription:', error);
    res.status(500).json({ error: 'Failed to create trial subscription', message: error.message });
  }
});

// Check trial status endpoint
router.get('/trial-status', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = Number(req.session.userId);

    // Get user's subscription
    const [subscription] = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .where(eq(userSubscriptions.status, 'active'))
      .orderBy((subscriptions) => subscriptions.createdAt, 'desc');

    if (!subscription) {
      return res.json({ 
        isInTrial: false,
        trialEnded: false,
        hasActiveSubscription: false
      });
    }

    const now = new Date();
    const trialEnd = subscription.trialEnd;
    
    // Check if user is in trial period
    const isInTrial = trialEnd ? now < trialEnd : false;
    
    // Check if trial has ended
    const trialEnded = trialEnd ? now >= trialEnd : false;

    res.json({
      isInTrial,
      trialEnded,
      hasActiveSubscription: subscription.status === 'active',
      daysLeft: isInTrial ? Math.ceil((trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      subscription
    });
  } catch (error: any) {
    console.error('Error checking trial status:', error);
    res.status(500).json({ error: 'Failed to check trial status', message: error.message });
  }
});

export default router;