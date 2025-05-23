import { loadStripe } from '@stripe/stripe-js';

// Only load Stripe when the public key is available
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = async () => {
  if (!stripePromise) {
    // Check if the key exists before trying to load Stripe
    if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      console.warn('Stripe public key not found in environment variables');
      return null;
    }
    
    try {
      stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    } catch (error) {
      console.error('Error loading Stripe:', error);
      return null;
    }
  }
  return stripePromise;
};