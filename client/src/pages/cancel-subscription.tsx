import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import React, { useState } from "react";

export default function CancelSubscription() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancellationProcessing, setCancellationProcessing] = useState(false);
  const [cancellationComplete, setCancellationComplete] = useState(false);
  const [effectiveEndDate, setEffectiveEndDate] = useState<Date | null>(null);

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/subscription/cancel", {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      setCancellationComplete(true);
      setEffectiveEndDate(new Date(data.effectiveEndDate));
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully and will end at the end of your current billing period.",
      });
    },
    onError: (error) => {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "There was an error cancelling your subscription. Please try again or contact support.",
        variant: "destructive",
      });
      setCancellationProcessing(false);
    }
  });

  const handleCancelSubscription = () => {
    setCancellationProcessing(true);
    cancelSubscriptionMutation.mutate();
  };

  const handleBack = () => {
    window.location.href = "/manage-subscription";
  };

  // Format date to display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Cancel Subscription</h1>
      </div>

      <div className="grid gap-6">
        {cancellationComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Cancelled</CardTitle>
              <CardDescription>
                Your subscription has been cancelled successfully
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-gray-700">
                  Your subscription will remain active until the end of your current billing period on{" "}
                  <strong>{effectiveEndDate ? formatDate(effectiveEndDate) : 'loading...'}</strong>.
                </p>
                <p className="text-gray-700 mt-4">
                  Until then, you'll continue to have full access to all BakeGenie features and services.
                </p>
                <p className="text-gray-700 mt-4">
                  If you change your mind or cancelled by mistake, please contact our support team at{" "}
                  <a href="mailto:support@bakegenie.co" className="text-blue-600 hover:underline">
                    support@bakegenie.co
                  </a>{" "}
                  as soon as possible.
                </p>
              </div>
              <Button onClick={() => window.location.href = "/account"} className="mt-4">
                Return to Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" /> 
                Cancel Your Subscription
              </CardTitle>
              <CardDescription>
                Please read this information carefully before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <h3 className="font-medium mb-2">Important Information</h3>
                <p className="text-sm text-gray-700">
                  Cancelling your subscription will take effect at the end of your current billing period. 
                  You will continue to have access to all features until that time.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">What happens when you cancel:</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  <li>Your subscription will remain active until the end of your current billing period</li>
                  <li>You will not be charged again after your current subscription ends</li>
                  <li>All your data will remain accessible until your subscription expires</li>
                  <li>After expiration, your account will be limited to view-only access</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Need assistance?</h3>
                <p className="text-sm text-gray-700">
                  If you're having any issues or would like to provide feedback, please contact our support team at{" "}
                  <a href="mailto:support@bakegenie.co" className="text-blue-600 hover:underline">
                    support@bakegenie.co
                  </a>
                </p>
              </div>

              <Separator className="my-4" />

              <div className="pt-2 flex justify-between items-center">
                <Button variant="outline" onClick={handleBack}>
                  Keep My Subscription
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  disabled={cancellationProcessing}
                >
                  {cancellationProcessing ? (
                    <>
                      <Skeleton className="h-4 w-4 rounded-full mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Cancellation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}