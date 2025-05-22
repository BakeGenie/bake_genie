import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangleIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled: () => void;
}

export const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  onCancelled
}) => {
  const [cancellationType, setCancellationType] = useState<"end_of_period" | "immediate">("end_of_period");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfirmed) {
      setError("Please confirm that you understand the consequences of cancellation");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/subscription/cancel", {
        cancelImmediately: cancellationType === "immediate"
      });
      
      // Handle the response properly
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        // If response is not JSON, use response text instead
        const text = await response.text();
        responseData = { success: response.ok, message: text };
      }

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to cancel subscription");
      }

      toast({
        title: "Subscription Cancelled",
        description: cancellationType === "immediate" 
          ? "Your subscription has been cancelled immediately." 
          : "Your subscription will be cancelled at the end of the current billing period.",
      });

      onCancelled();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "An error occurred while cancelling your subscription.");
      toast({
        title: "Cancellation Failed",
        description: err.message || "Failed to cancel subscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setCancellationType("end_of_period");
    setIsConfirmed(false);
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby="cancel-subscription-description">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription id="cancel-subscription-description">
            We're sorry to see you go. Please let us know how you'd like to proceed with your cancellation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Cancellation Options</h3>
              <RadioGroup 
                value={cancellationType} 
                onValueChange={(value) => setCancellationType(value as "end_of_period" | "immediate")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="end_of_period" id="end_of_period" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="end_of_period" className="font-medium">
                      Cancel at end of billing period
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Your subscription will remain active until the end of the current billing period.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="immediate" className="font-medium">
                      Cancel immediately
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Your subscription will be cancelled right away and you'll lose access immediately.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="confirm-cancellation" 
                checked={isConfirmed}
                onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="confirm-cancellation" className="text-sm">
                  I understand that by cancelling my subscription, I may lose access to features and my data may be subject to the terms outlined in the service agreement.
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Keep Subscription
            </Button>
            <Button 
              type="submit"
              variant="destructive" 
              disabled={isLoading || !isConfirmed}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;