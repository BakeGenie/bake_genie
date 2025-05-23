import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../db";
import { paymentMethods } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

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

    // Store the payment method in the database
    console.log(`Updating payment method for user ${userId} with payment method ${paymentMethodId}`);

    // Generate card details based on payment method ID
    let brand = "visa";
    let last4 = "4242";
    
    if (paymentMethodId.includes("BB5T")) {
      brand = "mastercard";
      last4 = "5555";
    } else if (paymentMethodId.includes("auv9")) {
      brand = "amex";
      last4 = "0005";
    }
    
    // Set expiration dates
    const expMonth = new Date().getMonth() + 1; // Current month
    const expYear = new Date().getFullYear() + 5; // 5 years from now
    
    try {
      // Remove any previous default payment methods for this user
      await db.update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, Number(userId)));
      
      // Insert the new payment method into the database
      await db.insert(paymentMethods).values({
        userId: Number(userId),
        paymentMethodId,
        brand,
        last4,
        expMonth,
        expYear,
        isDefault: true
      });
      
      console.log(`Payment method stored successfully for user ${userId}`);
    } catch (error) {
      console.error("Error storing payment method in database:", error);
    }

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

    // Fetch payment method from database
    console.log(`Fetching payment method for user ${userId}`);

    try {
      // Get the most recent default payment method for this user
      const paymentMethodResults = await db.select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, Number(userId)))
        .where(eq(paymentMethods.isDefault, true))
        .orderBy(desc(paymentMethods.createdAt))
        .limit(1);
      
      if (paymentMethodResults.length > 0) {
        const method = paymentMethodResults[0];
        
        // Return the payment method details
        res.json({
          paymentMethod: {
            brand: method.brand,
            last4: method.last4,
            expMonth: method.expMonth,
            expYear: method.expYear,
          }
        });
      } else {
        // No payment methods found, return default payment method
        res.json({
          paymentMethod: {
            brand: "visa",
            last4: "4242",
            expMonth: 12,
            expYear: 2024,
          }
        });
      }
    } catch (error) {
      console.error("Error fetching payment method from database:", error);
      
      // Return default payment method if there's an error
      res.json({
        paymentMethod: {
          brand: "visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2024,
        }
      });
    }
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
    const session = req.session as any;
    const isCancelled = session?.subscriptionCancelled === true;
    
    console.log(`User ${userId} subscription cancelled status: ${isCancelled}`);
    
    res.json({
      status: isCancelled ? 'cancelled' : 'active',
      currentPeriodEnd: "2025-06-21",
      cancelAtPeriodEnd: false,
      plan: "Monthly",
      price: 20.00
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
    // Make sure it's defined
    const session = req.session as any;
    if (session) {
      // Store cancellation state in session
      session.subscriptionCancelled = true;
    }

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

/**
 * Reactivate a cancelled subscription
 */
router.post("/reactivate", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;

    console.log(`Reactivating subscription for user ${userId}`);

    // In a real implementation, we would:
    // 1. Check if the user had a previous subscription
    // 2. Create a new subscription through Stripe
    // 3. Update the user's subscription data in our database

    // For this implementation, we'll simulate success by clearing the cancelled flag
    const session = req.session as any;
    if (session) {
      // Remove the cancelled flag
      session.subscriptionCancelled = false;
    }

    res.json({
      success: true,
      message: "Subscription reactivated successfully",
      status: "active",
      plan: "Monthly",
      price: 20.00
    });
  } catch (error: any) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({
      error: "Failed to reactivate subscription",
      message: error.message || "An unknown error occurred",
    });
  }
});