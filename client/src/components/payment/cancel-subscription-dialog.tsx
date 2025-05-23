import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircleIcon, LoaderIcon, AlertTriangleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from '@tanstack/react-query';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [confirmInput, setConfirmInput] = useState('');

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/subscription/cancel', {});
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been successfully cancelled.",
      });
      setConfirmInput('');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error("Cancel subscription error:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error cancelling your subscription.",
        variant: "destructive",
      });
    }
  });

  const handleCancel = () => {
    if (confirmInput.toLowerCase() !== 'cancel') {
      toast({
        title: "Error",
        description: "Please type 'cancel' to confirm.",
        variant: "destructive",
      });
      return;
    }
    
    cancelSubscriptionMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertTriangleIcon className="h-5 w-5 mr-2" />
            Cancel Your Subscription
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm mb-4">
            Type <strong>cancel</strong> below to confirm:
          </p>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Type 'cancel' to confirm"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmInput('');
              onOpenChange(false);
            }}
          >
            Keep Subscription
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelSubscriptionMutation.isPending || confirmInput.toLowerCase() !== 'cancel'}
          >
            {cancelSubscriptionMutation.isPending ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 mr-2" /> Cancel Subscription
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;