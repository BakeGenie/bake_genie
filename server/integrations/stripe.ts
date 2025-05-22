import Stripe from 'stripe';

// Check if we have the Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

// Initialize Stripe with the secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

/**
 * Creates a payment intent for processing payments
 * @param amount The amount to charge in the currency's smallest unit (e.g. cents for USD)
 * @param currency The currency code (default: USD)
 * @param metadata Additional metadata to attach to the payment intent
 * @returns The created payment intent
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'aud',
  metadata: Record<string, string> = {}
) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Make sure STRIPE_SECRET_KEY is set.');
  }

  return await stripe.paymentIntents.create({
    amount,
    currency,
    metadata,
    payment_method_types: ['card'],
  });
}

/**
 * Retrieves a payment intent by its ID
 * @param paymentIntentId The ID of the payment intent to retrieve
 * @returns The retrieved payment intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Make sure STRIPE_SECRET_KEY is set.');
  }

  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Creates a Stripe customer
 * @param email Customer's email address
 * @param name Customer's full name
 * @param metadata Additional metadata to attach to the customer
 * @returns The created customer
 */
export async function createCustomer(
  email: string,
  name: string,
  metadata: Record<string, string> = {}
) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Make sure STRIPE_SECRET_KEY is set.');
  }

  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

/**
 * Retrieves a customer by their ID
 * @param customerId The ID of the customer to retrieve
 * @returns The retrieved customer
 */
export async function retrieveCustomer(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Make sure STRIPE_SECRET_KEY is set.');
  }

  return await stripe.customers.retrieve(customerId);
}

/**
 * Gets all payment methods for a customer
 * @param customerId The ID of the customer
 * @returns The customer's payment methods
 */
export async function getPaymentMethods(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not initialized. Make sure STRIPE_SECRET_KEY is set.');
  }

  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}