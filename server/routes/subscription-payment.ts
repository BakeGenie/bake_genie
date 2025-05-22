import { Router, Request, Response } from "express";
import Stripe from "stripe";

// Create a router
export const router = Router();

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set!");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

// Authentication middleware for subscription routes
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

/**
 * Update a payment method for a subscription
 */
router.post("/update-payment-method", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ error: "Payment method ID is required" });
    }

    // In a real implementation, we would:
    // 1. Get the user's Stripe customer ID from our database
    // 2. Attach the payment method to the customer
    // 3. Update the default payment method for the customer
    // 4. Update the default payment method on their subscription

    // For this implementation, we'll simulate success
    console.log(`Updating payment method for user ${userId} with payment method ${paymentMethodId}`);

    // Add actual Stripe integration here when ready
    // Example (commented out until Stripe is fully configured):
    /*
    // Get user's customer ID from your database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: "User or Stripe customer not found" });
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // If the user has an active subscription, update it too
    if (user.stripeSubscriptionId) {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      });
    }
    */

    res.json({
      success: true,
      message: "Payment method updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating payment method:", error);
    res.status(500).json({
      error: "Failed to update payment method",
      message: error.message || "An unknown error occurred",
    });
  }
});

/**
 * Get current payment method details
 */
router.get("/payment-method", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;

    // In a real implementation, we would:
    // 1. Get the user's Stripe customer ID from our database
    // 2. Fetch their default payment method
    // 3. Return masked details about that payment method

    // For this implementation, we'll return simulated data
    console.log(`Fetching payment method for user ${userId}`);

    // Example of what we would return with real Stripe integration:
    res.json({
      paymentMethod: {
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2024,
      }
    });
  } catch (error: any) {
    console.error("Error fetching payment method:", error);
    res.status(500).json({
      error: "Failed to fetch payment method",
      message: error.message || "An unknown error occurred",
    });
  }
});

/**
 * Get current subscription status
 */
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    
    // In a real implementation, we would:
    // 1. Get the user's subscription ID from the database
    // 2. Fetch subscription status from Stripe

    console.log(`Fetching subscription status for user ${userId}`);
    
    // For this implementation, check if the user has recently cancelled
    // We'll store cancelled subscriptions in the session temporarily
    const isCancelled = req.session.subscriptionCancelled === true;
    
    res.json({
      status: isCancelled ? 'cancelled' : 'active',
      currentPeriodEnd: "2025-06-21",
      cancelAtPeriodEnd: false,
    });
  } catch (error: any) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({
      error: "Failed to fetch subscription status",
      message: error.message || "An unknown error occurred",
    });
  }
});

/**
 * Cancel a subscription
 */
router.post("/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { cancelImmediately = false } = req.body;

    console.log(`Cancelling subscription for user ${userId}. Immediate: ${cancelImmediately}`);

    // In a real implementation, we would:
    // 1. Get the user's subscription ID from the database
    // 2. Call Stripe's API to cancel the subscription
    // 3. Update the subscription status in our database

    /*
    // Get user's subscription ID from your database
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || !user.stripeSubscriptionId) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Cancel the subscription with Stripe
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: !cancelImmediately,
    });

    // If cancelling immediately, update the status in our database
    if (cancelImmediately) {
      await db.update(users)
        .set({ 
          stripeSubscriptionId: null,
          subscriptionStatus: 'cancelled'
        })
        .where(eq(users.id, userId));
    } else {
      await db.update(users)
        .set({ 
          subscriptionStatus: 'cancelling'
        })
        .where(eq(users.id, userId));
    }
    */

    // For this implementation, we'll simulate success by storing in session
    if (!req.session) {
      req.session = {} as any;
    }
    req.session.subscriptionCancelled = true;

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      cancelledAt: cancelImmediately ? "immediately" : "end of billing period"
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      error: "Failed to cancel subscription",
      message: error.message || "An unknown error occurred",
    });
  }
});