import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CancelSubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCancelSubscription = () => {
    setIsSubmitting(true);
    
    // Mock API call for cancellation
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully. You will have access until the end of your billing period.",
      });
      
      // Redirect back to account after success
      setTimeout(() => setLocation("/account"), 1500);
    }, 1000);
  };
  
  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => setLocation("/manage-subscription")}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Subscription
        </Button>
        <h1 className="text-2xl font-bold">Cancel Subscription</h1>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cancel Your Subscription</CardTitle>
            <CardDescription>
              Please read the information below before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              You can cancel your subscription any time. To avoid being billed, you need to cancel before the end
              date of your current subscription.
            </p>
            <p>
              If you experience any problems, please contact us at <a href="mailto:support@bakegenie.co" className="text-primary hover:underline">support@bakegenie.co</a>
            </p>
          </CardContent>
          <CardFooter className="flex justify-start">
            <Button 
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Cancel Subscription"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}