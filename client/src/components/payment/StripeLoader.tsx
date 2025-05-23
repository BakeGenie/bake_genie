import React, { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';

interface StripeLoaderProps {
  children: React.ReactNode;
  clientSecret?: string;
}

export const StripeLoader: React.FC<StripeLoaderProps> = ({ 
  children, 
  clientSecret
}) => {
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStripe() {
      try {
        const stripe = await getStripe();
        setStripePromise(stripe);
      } catch (err) {
        console.error('Failed to load Stripe:', err);
        setError('Failed to load payment system');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStripe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        {error}
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="p-4 bg-amber-100 text-amber-800 rounded-md">
        Payment system is currently unavailable. Please try again later.
      </div>
    );
  }

  const options = clientSecret 
    ? { clientSecret } 
    : {};

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};