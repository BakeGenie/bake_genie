import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import UpdatePaymentMethodDialog from "@/components/payment/update-payment-method-dialog";
import CancelSubscriptionDialog from "@/components/payment/cancel-subscription-dialog";
import { format } from "date-fns";

// Define interfaces for the API responses
interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface PaymentMethodResponse {
  paymentMethod: PaymentMethod;
  isDefault: boolean;
}

interface SubscriptionStatus {
  status: 'active' | 'cancelled' | 'paused';
  plan?: string;
  price?: number;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export default function ManageSubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUpdatePaymentDialogOpen, setIsUpdatePaymentDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  
  // Fetch user data to get account creation date
  const { data: userData, isLoading } = useQuery<User>({
    queryKey: ['/api/users/current'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch current payment method information
  const { data: paymentMethodData, isLoading: isLoadingPaymentMethod, refetch: refetchPaymentMethod } = useQuery<PaymentMethodResponse>({
    queryKey: ['/api/subscription/payment-method'],
    refetchOnWindowFocus: false,
  });
  
  // Fetch subscription status
  const { data: subscriptionData, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
    refetchOnWindowFocus: false,
  });
  
  // Safe access with default fallback values to prevent TypeScript errors
  const subscriptionStatus = subscriptionData?.status === 'cancelled'
    ? { text: "Cancelled", color: "bg-red-500", textClass: "text-red-600" }
    : { text: "Active", color: "bg-green-500", textClass: "text-green-600" };
    
  // Derive subscription status
  const isSubscriptionActive = subscriptionData?.status !== 'cancelled';
  
  const handleChangePlan = async () => {
    try {
      const response = await fetch('/api/subscription/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }
      
      await refetchSubscription();
      
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been successfully reactivated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reactivate your subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelSubscription = () => {
    setIsCancelDialogOpen(true);
  };
  
  const handleSubscriptionCancelled = () => {
    // Refresh data after successful cancellation
    refetchPaymentMethod();
    refetchSubscription();
    toast({
      title: "Subscription Cancelled",
      description: "Your subscription has been cancelled successfully.",
    });
  };
  
  const handleUpdatePaymentMethod = () => {
    setIsUpdatePaymentDialogOpen(true);
  };
  
  // State to override the fetched payment method data
  const [localPaymentMethod, setLocalPaymentMethod] = useState<PaymentMethod | null>(null);
  
  // Updated to handle the new payment method information
  const handlePaymentMethodUpdated = (updatedMethod?: any) => {
    // If we received updated method details, store them locally 
    if (updatedMethod) {
      setLocalPaymentMethod(updatedMethod);
    }
    
    // Refresh data from server
    refetchPaymentMethod();
    
    toast({
      title: "Payment Method Updated",
      description: "Your payment information has been successfully updated.",
    });
  };

  return (
    <div className="container py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => setLocation("/account")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Account
        </Button>
        <h1 className="text-2xl font-bold">Billing</h1>
      </div>
      
      {/* Update Payment Method Dialog */}
      <UpdatePaymentMethodDialog 
        open={isUpdatePaymentDialogOpen} 
        onOpenChange={setIsUpdatePaymentDialogOpen}
        onSuccess={handlePaymentMethodUpdated}
      />
      
      {/* Cancel Subscription Dialog */}
      <CancelSubscriptionDialog 
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        onCancelled={handleSubscriptionCancelled}
      />
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment details
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className={`inline-block w-2 h-2 ${subscriptionStatus.color} rounded-full mr-2`}></span>
                <span className={`${subscriptionStatus.textClass} font-medium`}>
                  {subscriptionStatus.text}
                </span>
              </div>
              {isSubscriptionActive ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive h-8"
                  onClick={handleCancelSubscription}
                >
                  Cancel
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-primary h-8"
                  onClick={handleChangePlan}
                >
                  Reactivate
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium mb-4">Plan Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-sm font-medium">$20.00/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next billing</span>
                  <span className="text-sm font-medium">
                    {isLoading ? "Loading..." : "Jun 21, 2025"}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-4">Payment Method</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  <div>
                    <p className="text-sm font-medium">
                      {paymentMethodData?.paymentMethod 
                        ? `${paymentMethodData.paymentMethod.brand} •••• ${paymentMethodData.paymentMethod.last4}` 
                        : "Visa •••• 4242"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expires {paymentMethodData?.paymentMethod 
                        ? `${paymentMethodData.paymentMethod.expMonth}/${paymentMethodData.paymentMethod.expYear}`
                        : "12/2024"}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleUpdatePaymentMethod}
                >
                  Change
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            {isSubscriptionActive ? (
              <Button 
                variant="outline" 
                className="text-destructive"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="text-primary"
                onClick={handleChangePlan}
              >
                Reactivate Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your past invoices and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>No billing history available yet.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}