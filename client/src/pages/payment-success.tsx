import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentSuccessPage() {
  const [location, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<{
    id: string;
    status: string;
    amount: number;
    currency: string;
  } | null>(null);
  const { toast } = useToast();

  // Extract payment_intent from URL query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (!paymentIntentId) {
      toast({
        title: 'Payment Information Missing',
        description: 'No payment information found. Please try again.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    if (redirectStatus !== 'succeeded') {
      toast({
        title: 'Payment Not Completed',
        description: 'Your payment has not been completed. Please try again.',
        variant: 'destructive',
      });
      navigate('/dashboard');
      return;
    }

    // Fetch payment details
    const fetchPaymentDetails = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest({ 
          method: 'GET', 
          url: `/api/payments/status/${paymentIntentId}` 
        });
        const data = await response.json();
        
        if (response.ok) {
          setPaymentInfo(data);
          toast({
            title: 'Payment Successful',
            description: 'Your payment has been processed successfully.',
          });
        } else {
          throw new Error(data.error || 'Failed to verify payment');
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        toast({
          title: 'Verification Failed',
          description: 'Could not verify payment status. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [navigate, toast]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Payment Status</CardTitle>
          <CardDescription>
            {isLoading ? 'Verifying your payment...' : 'Thank you for your payment'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : paymentInfo ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/20 p-3">
                  <Check className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-medium">Payment Complete</h3>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Payment ID: {paymentInfo.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {paymentInfo.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Payment information not available
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => navigate('/dashboard')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}