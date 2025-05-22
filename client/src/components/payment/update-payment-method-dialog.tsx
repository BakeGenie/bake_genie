import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCardIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

interface UpdatePaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const UpdatePaymentMethodForm: React.FC<UpdatePaymentMethodFormProps> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the CardElement
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create a payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!paymentMethod) {
        throw new Error("Failed to create payment method");
      }

      // Send the payment method to the server
      const response = await apiRequest("POST", "/api/subscription/update-payment-method", {
        paymentMethodId: paymentMethod.id
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update payment method");
      }

      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been successfully updated.",
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your payment method.");
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update payment method.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="p-4 border rounded-md">
          <div className="mb-1 text-sm font-medium">Card Information</div>
          <CardElement options={cardElementOptions} />
        </div>

        <div className="text-sm text-muted-foreground">
          Your card information is securely processed by Stripe. We don't store your full card details.
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CreditCardIcon className="mr-2 h-4 w-4" />
              Update Payment Method
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

interface UpdatePaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdatePaymentMethodDialog: React.FC<UpdatePaymentMethodDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Payment Method</DialogTitle>
          <DialogDescription>
            Enter your new card details to update your payment method.
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <UpdatePaymentMethodForm 
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatePaymentMethodDialog;