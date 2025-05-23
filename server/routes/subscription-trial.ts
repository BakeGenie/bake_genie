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

// Create a subscription with a 30-day trial period
router.post('/create-trial-subscription', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = Number(req.session.userId);
    const { planId, paymentMethodId } = req.body;

    // Get the plan details
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId));

    if (!plan) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    // Check if user already has an active subscription
    const [existingSubscription] = await db.select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .where(eq(userSubscriptions.status, 'active'));

    if (existingSubscription) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Get or create Stripe customer
    let customerId;
    const [existingUser] = await db.select({
      stripeCustomerId: userSubscriptions.stripeCustomerId,
    })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (existingUser?.stripeCustomerId) {
      customerId = existingUser.stripeCustomerId;
    } else {
      // Get user info for creating a customer
      const [user] = await db.execute(
        `SELECT email, CONCAT(first_name, ' ', last_name) as name FROM users WHERE id = $1`,
        [userId]
      );

      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.name,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      customerId = customer.id;
    }

    // Create a subscription with a trial period
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: plan.stripePriceId, // This should be set in your subscription_plans table
        },
      ],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      trial_period_days: 30, // 30-day free trial
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription info to database
    const [userSubscription] = await db.insert(userSubscriptions)
      .values({
        userId,
        planId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        createdAt: new Date(),
      })
      .returning();

    res.json({
      subscription: userSubscription,
      clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
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