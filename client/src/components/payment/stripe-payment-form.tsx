import React, { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: (paymentId: string) => void;
  customerEmail?: string;
}

export default function StripePaymentForm({ 
  onSuccess,
  customerEmail 
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Complete payment when the submit button is clicked
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Include customer email if available
        ...(customerEmail && { receipt_email: customerEmail }),
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.');
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment has been confirmed and completed!
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully!',
      });
      onSuccess(paymentIntent.id);
    } else {
      setErrorMessage('Payment status: ' + (paymentIntent?.status || 'unknown'));
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show any payment errors */}
      {errorMessage && (
        <div className="p-4 bg-destructive/20 rounded-md text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Stripe Payment Element - UI for collecting payment details */}
      <PaymentElement />

      {/* Submit button */}
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isProcessing || !stripe || !elements}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
}