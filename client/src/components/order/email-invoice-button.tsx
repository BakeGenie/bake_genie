import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailInvoiceButtonProps {
  orderId: number;
}

const EmailInvoiceButton: React.FC<EmailInvoiceButtonProps> = ({ orderId }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Mutation for sending invoice email
  const emailInvoiceMutation = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${orderId}/send`, { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send invoice");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice Sent",
        description: "The invoice has been emailed to the customer successfully.",
      });
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send invoice. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const handleEmailInvoice = async () => {
    emailInvoiceMutation.mutate();
  };

  return (
    <Button
      onClick={handleEmailInvoice}
      disabled={isLoading}
      variant="outline"
      className="flex items-center"
    >
      <Mail className="h-4 w-4 mr-2" />
      {isLoading ? "Sending..." : "Email Invoice"}
    </Button>
  );
};

export default EmailInvoiceButton;