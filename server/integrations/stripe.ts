import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY not found in environment variables');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

export async function createPaymentIntent(amount: number, currency: string = 'usd', metadata: Record<string, any> = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error.message);
    throw error;
  }
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error.message);
    throw error;
  }
}

export async function createCustomer(email: string, name?: string, metadata: Record<string, any> = {}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  } catch (error: any) {
    console.error('Error creating customer:', error.message);
    throw error;
  }
}

export async function retrieveCustomer(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.customers.retrieve(customerId);
  } catch (error: any) {
    console.error('Error retrieving customer:', error.message);
    throw error;
  }
}

export async function getPaymentMethods(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  } catch (error: any) {
    console.error('Error retrieving payment methods:', error.message);
    throw error;
  }
}

export default stripe;