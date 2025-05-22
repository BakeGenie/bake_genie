import React, { useState, useEffect, Suspense } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Wallet, Loader2 } from 'lucide-react';

// Import Stripe payment form component with lazy loading
const StripePaymentForm = React.lazy(() => import('./stripe-payment-form'));

// Make sure we have the Stripe public key
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Load the Stripe.js SDK client
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

// Payment form schema
const paymentFormSchema = z.object({
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  orderTotal?: number;
  customerEmail?: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

export default function PaymentModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderTotal, 
  customerEmail,
  onPaymentSuccess 
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form definition
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: orderTotal || 0,
      description: orderId ? `Payment for Order #${orderId}` : 'Payment',
    },
  });

  // Check if Stripe is configured
  useEffect(() => {
    if (isOpen && !stripePublicKey) {
      toast({
        title: 'Payment Not Available',
        description: 'Payment processing is not configured. Please contact support.',
        variant: 'destructive',
      });
      onClose();
    }
  }, [isOpen, onClose, toast]);

  // Create payment intent when submitting the form
  const onSubmit = async (data: PaymentFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest({ 
        method: 'POST', 
        url: '/api/payments/create-intent', 
        body: {
          amount: data.amount,
          currency: 'aud', // Using AUD for Australian bakery
          metadata: {
            ...(orderId && { orderId: orderId.toString() }),
            ...(data.description && { description: data.description }),
          }
        }
      });
      
      const { clientSecret } = await response.json();
      
      if (clientSecret) {
        setClientSecret(clientSecret);
      } else {
        throw new Error('Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast({
        title: 'Payment Error',
        description: 'Could not initiate payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed successfully.',
    });
    
    if (onPaymentSuccess) {
      onPaymentSuccess(paymentId);
    }
    onClose();
  };

  // Reset modal state when closed
  const handleClose = () => {
    setClientSecret(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <span>Process Payment</span>
          </DialogTitle>
          <DialogDescription>
            Enter payment details to process a payment for this order.
          </DialogDescription>
        </DialogHeader>

        {!clientSecret ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.50"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Payment description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-4">
            {stripePromise && clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm 
                  onSuccess={handlePaymentSuccess}
                  customerEmail={customerEmail}
                />
              </Elements>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}