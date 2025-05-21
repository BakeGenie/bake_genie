import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

export default function ManageSubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch user data to get account creation date
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/users/current'],
    refetchOnWindowFocus: false,
  });
  
  const handleChangePlan = () => {
    toast({
      title: "Change Plan",
      description: "This feature will allow changing your subscription plan.",
    });
  };

  const handleCancelSubscription = () => {
    setLocation("/cancel-subscription");
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Your subscription will automatically renew itself unless you cancel it or your card expires.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <Button 
                  variant="outline" 
                  className="w-full text-destructive border-destructive/20 hover:bg-destructive/10"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </Button>
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
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Active
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
                  onClick={() => {
                    toast({
                      title: "Update Payment",
                      description: "This feature will allow updating your payment method.",
                    });
                  }}
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