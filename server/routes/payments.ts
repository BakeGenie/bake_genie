import { Router } from 'express';
import { db } from '../db';
import { orders, payments } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createPaymentIntent, retrievePaymentIntent } from '../integrations/stripe';
import { z } from 'zod';

const router = Router();

// Schema for validating payment intent creation requests
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('aud'),
  metadata: z.object({
    orderId: z.string().optional(),
    description: z.string().optional(),
  }).optional(),
});

// Create a payment intent
router.post('/create-intent', async (req, res) => {
  try {
    // Validate the request body
    const validatedData = createPaymentIntentSchema.parse(req.body);
    
    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(validatedData.amount * 100);
    
    // Create the payment intent
    const paymentIntent = await createPaymentIntent(
      amountInCents,
      validatedData.currency,
      validatedData.metadata || {}
    );
    
    // Return the client secret to the client
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({ 
      message: 'Failed to create payment intent', 
      error: error.message 
    });
  }
});

// Get payment status
router.get('/status/:paymentIntentId', async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    
    // Retrieve the payment intent from Stripe
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);
    
    // Update order payment status if this payment is linked to an order
    if (
      paymentIntent.status === 'succeeded' && 
      paymentIntent.metadata?.orderId
    ) {
      const orderId = parseInt(paymentIntent.metadata.orderId);
      
      if (!isNaN(orderId)) {
        // Record the payment in our database
        const [payment] = await db.insert(payments).values({
          orderId,
          userId: req.user?.id || 1, // Fallback to default user if not authenticated
          amount: paymentIntent.amount / 100, // Convert back from cents
          paymentMethod: 'stripe',
          paymentId: paymentIntentId,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata || {},
          paymentDate: new Date(),
        }).returning();
        
        // Update order payment status if needed
        await db.update(orders)
          .set({ 
            paymentStatus: 'paid',
            updatedAt: new Date() 
          })
          .where(eq(orders.id, orderId));
      }
    }
    
    // Return payment details
    res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    });
  } catch (error: any) {
    console.error('Error retrieving payment status:', error);
    res.status(400).json({ 
      message: 'Failed to retrieve payment status', 
      error: error.message 
    });
  }
});

// List payments for an order
router.get('/order/:orderId', async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    
    if (isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    // Get all payments for this order
    const orderPayments = await db.select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
    
    res.json(orderPayments);
  } catch (error: any) {
    console.error('Error retrieving order payments:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve order payments', 
      error: error.message 
    });
  }
});

export default router;