import { Router } from 'express';
import { z } from 'zod';
import stripeService from '../integrations/stripe';

// Create payment intent schema
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('AUD'),
  metadata: z.record(z.string(), z.any()).optional(),
  orderId: z.number().optional(),
  description: z.string().optional()
});

// Create customer schema
const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});

const router = Router();

/**
 * Route to get payment provider information
 */
router.get('/providers', (req, res) => {
  res.json({
    providers: [
      {
        id: 'stripe',
        name: 'Stripe',
        isConfigured: stripeService.isConfigured,
        publicKey: stripeService.publicKey || null
      }
    ]
  });
});

/**
 * Route to create a payment intent
 */
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency, metadata, orderId, description } = createPaymentIntentSchema.parse(req.body);

    // Additional metadata with order info
    const paymentMetadata = {
      ...(metadata || {}),
      ...(orderId ? { orderId: orderId.toString() } : {}),
      ...(req.user ? { userId: req.user.id.toString() } : {})
    };

    // Create Stripe payment intent
    const intent = await stripeService.createPaymentIntent(amount, currency, paymentMetadata);
    
    return res.json({
      clientSecret: intent.client_secret,
      intentId: intent.id
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Route to create a customer
 */
router.post('/create-customer', async (req, res) => {
  try {
    const { email, name } = createCustomerSchema.parse(req.body);

    // Create Stripe customer
    const customer = await stripeService.createCustomer(email, name);
    
    return res.json({
      customerId: customer.id,
      email: customer.email
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * Route to get payment status
 */
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const intent = await stripeService.retrievePaymentIntent(id);
    return res.json({
      id: intent.id,
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency
    });
  } catch (error: any) {
    console.error('Error retrieving payment status:', error);
    return res.status(404).json({ error: error.message });
  }
});

export default router;