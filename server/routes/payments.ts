import { Router } from 'express';
import { z } from 'zod';
import * as stripeIntegration from '../integrations/stripe';
import * as squareIntegration from '../integrations/square';

const router = Router();

// Schema validation for Stripe payment request
const createStripePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  metadata: z.record(z.string()).optional(),
  orderId: z.number().optional(),
});

// Schema validation for Square payment request
const createSquarePaymentSchema = z.object({
  sourceId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  note: z.string().optional(),
  referenceId: z.string().optional(),
  orderId: z.number().optional(),
});

// Create Stripe payment intent
router.post('/stripe/create-payment-intent', async (req, res) => {
  try {
    const validation = createStripePaymentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.format() });
    }
    
    const { amount, currency, metadata, orderId } = validation.data;
    
    // Add order ID to metadata if provided
    const paymentMetadata = {
      ...metadata,
      ...(orderId ? { orderId: orderId.toString() } : {}),
    };
    
    const paymentIntent = await stripeIntegration.createPaymentIntent(
      amount,
      currency,
      paymentMetadata
    );
    
    res.json({ 
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id 
    });
  } catch (error: any) {
    console.error('Error creating Stripe payment intent:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Retrieve Stripe payment intent
router.get('/stripe/payment-intent/:id', async (req, res) => {
  try {
    const paymentIntentId = req.params.id;
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }
    
    const paymentIntent = await stripeIntegration.retrievePaymentIntent(paymentIntentId);
    res.json(paymentIntent);
  } catch (error: any) {
    console.error('Error retrieving Stripe payment intent:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Create Square payment
router.post('/square/create-payment', async (req, res) => {
  try {
    const validation = createSquarePaymentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.format() });
    }
    
    const { sourceId, amount, currency, note, referenceId, orderId } = validation.data;
    
    // Create a reference ID that includes order ID if provided
    const paymentReferenceId = orderId 
      ? `order-${orderId}-${referenceId || Date.now().toString()}`
      : (referenceId || Date.now().toString());
    
    const payment = await squareIntegration.createPayment(
      sourceId,
      amount,
      currency,
      note || '',
      paymentReferenceId
    );
    
    res.json(payment);
  } catch (error: any) {
    console.error('Error creating Square payment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Retrieve Square payment
router.get('/square/payment/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }
    
    const payment = await squareIntegration.getPayment(paymentId);
    res.json(payment);
  } catch (error: any) {
    console.error('Error retrieving Square payment:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get payment provider settings (to determine which payment provider to use)
router.get('/settings', async (req, res) => {
  try {
    // In a real application, you might fetch this from a settings database
    // For now, we'll return both Stripe and Square based on environment variables
    const providers = {
      stripe: {
        enabled: !!process.env.STRIPE_SECRET_KEY,
        public_key: process.env.VITE_STRIPE_PUBLIC_KEY || null
      },
      square: {
        enabled: !!(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_APPLICATION_ID && process.env.SQUARE_LOCATION_ID),
        application_id: process.env.SQUARE_APPLICATION_ID || null,
        location_id: process.env.SQUARE_LOCATION_ID || null
      }
    };
    
    res.json(providers);
  } catch (error: any) {
    console.error('Error retrieving payment settings:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;