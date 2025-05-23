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
  
  const handlePaymentMethodUpdated = () => {
    refetchPaymentMethod();
    toast({
      title: "Payment Method Updated",
      description: "Your payment information has been successfully updated.",
    });
  };

  return (
    <div className="container py-6">
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
        <h1 className="text-2xl font-bold">Manage Subscription</h1>
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Your subscription will automatically renew itself unless you cancel it or your card expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method */}
              <div>
                <h3 className="text-sm font-medium mb-2">Payment Method</h3>
                <div className="p-3 border rounded-md">
                  {isLoadingPaymentMethod ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading payment information...</span>
                    </div>
                  ) : paymentMethodData?.paymentMethod ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {paymentMethodData.paymentMethod.brand} **** {paymentMethodData.paymentMethod.last4}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {paymentMethodData.paymentMethod.expMonth}/{paymentMethodData.paymentMethod.expYear}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleUpdatePaymentMethod}
                      >
                        Update
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Visa **** 4242</p>
                          <p className="text-xs text-muted-foreground">Expires 12/2025</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleUpdatePaymentMethod}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                {isSubscriptionActive ? (
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                    onClick={handleCancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <div className="w-full space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-center">
                        Your subscription has been cancelled
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full text-primary border-primary/20 hover:bg-primary/10"
                      onClick={handleChangePlan}
                    >
                      Resubscribe
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Your subscription will automatically renew itself unless you cancel it or your card expires.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium flex items-center">
                      <span className={`inline-block w-2 h-2 ${subscriptionStatus.color} rounded-full mr-2`}></span>
                      <span className={subscriptionStatus.textClass}>
                        {subscriptionStatus.text}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription Plan</p>
                    <p className="font-medium">Monthly - $20.00</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {isLoading ? (
                        <span className="text-muted-foreground">Loading...</span>
                      ) : userData?.createdAt ? (
                        format(new Date(userData.createdAt), 'EEE, dd MMM yyyy')
                      ) : (
                        "Mon, 21 May 2025"
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Next Billing Amount</p>
                    <p className="font-medium">$20.00</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Next Billing Date</p>
                    <p className="font-medium">
                      {isLoading ? (
                        <span className="text-muted-foreground">Loading...</span>
                      ) : userData?.createdAt ? (
                        (() => {
                          const createdDate = new Date(userData.createdAt);
                          const today = new Date();
                          
                          // Calculate how many months since the initial billing date
                          const monthsDiff = (today.getFullYear() - createdDate.getFullYear()) * 12 + 
                                             today.getMonth() - createdDate.getMonth();
                          
                          // Get the next billing date by preserving the day of month from creation date
                          const nextBillingDate = new Date(createdDate);
                          nextBillingDate.setMonth(createdDate.getMonth() + monthsDiff + 1);
                          
                          // Preserve the day from the original creation date
                          nextBillingDate.setDate(createdDate.getDate());
                          
                          return format(nextBillingDate, 'EEE, dd MMM yyyy');
                        })()
                      ) : (
                        "Fri, 21 Jun 2025"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col items-start">
              <div className="flex justify-start gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleUpdatePaymentMethod}
                >
                  <CreditCardIcon className="h-4 w-4 mr-2" /> Update Payment Method
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}