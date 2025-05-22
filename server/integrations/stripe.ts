// Stripe payment integration for the bakery business system
import Stripe from "stripe";

// Get Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("Warning: Stripe secret key not found in environment variables");
}

// Initialize Stripe client
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
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
  currency: string = 'usd', 
  metadata: Record<string, any> = {}
) {
  if (!stripe) {
    throw new Error("Stripe is not configured properly. Please check your environment variables.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error: any) {
    console.error("Error creating Stripe payment intent:", error);
    throw error;
  }
}

/**
 * Retrieves a payment intent by its ID
 * @param paymentIntentId The ID of the payment intent to retrieve
 * @returns The retrieved payment intent
 */
export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured properly. Please check your environment variables.");
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error: any) {
    console.error("Error retrieving Stripe payment intent:", error);
    throw error;
  }
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
  name?: string, 
  metadata: Record<string, any> = {}
) {
  if (!stripe) {
    throw new Error("Stripe is not configured properly. Please check your environment variables.");
  }

  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer;
  } catch (error: any) {
    console.error("Error creating Stripe customer:", error);
    throw error;
  }
}

/**
 * Retrieves a customer by their ID
 * @param customerId The ID of the customer to retrieve
 * @returns The retrieved customer
 */
export async function retrieveCustomer(customerId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured properly. Please check your environment variables.");
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error: any) {
    console.error("Error retrieving Stripe customer:", error);
    throw error;
  }
}

/**
 * Gets all payment methods for a customer
 * @param customerId The ID of the customer
 * @returns The customer's payment methods
 */
export async function getPaymentMethods(customerId: string) {
  if (!stripe) {
    throw new Error("Stripe is not configured properly. Please check your environment variables.");
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error: any) {
    console.error("Error retrieving payment methods:", error);
    throw error;
  }
}

export default {
  publicKey: process.env.VITE_STRIPE_PUBLIC_KEY,
  isConfigured: !!stripe,
  createPaymentIntent,
  retrievePaymentIntent,
  createCustomer,
  retrieveCustomer,
  getPaymentMethods
};