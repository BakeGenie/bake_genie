import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, CreditCardIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ManageSubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleChangePlan = () => {
    toast({
      title: "Change Plan",
      description: "This feature will allow changing your subscription plan.",
    });
  };

  const handleCancelSubscription = () => {
    toast({
      title: "Cancel Subscription",
      description: "Starting the cancellation process.",
      variant: "destructive",
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
                  className="w-full"
                  onClick={handleChangePlan}
                >
                  Change Plan
                </Button>
              </div>
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
                    <p className="font-medium">Pro Annual - $99.00</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">Mon, 21 May 2025</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Next Billing Amount</p>
                    <p className="font-medium">$99.00</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Next Billing Date</p>
                    <p className="font-medium">Thu, 21 May 2026</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex flex-col items-start">
              <p className="text-sm text-muted-foreground mb-4">
                Your subscription renews automatically. You can cancel or change your subscription at any time.
              </p>
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