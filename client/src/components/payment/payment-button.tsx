import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DollarSign } from 'lucide-react';
import PaymentModal from './payment-modal';

interface PaymentButtonProps {
  orderId: number;
  orderTotal: number;
  customerEmail?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  className?: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

export default function PaymentButton({
  orderId,
  orderTotal,
  customerEmail,
  disabled = false,
  variant = 'default',
  className = '',
  onPaymentSuccess,
}: PaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    toast({
      title: 'Payment Successful',
      description: 'The payment has been successfully processed.',
    });

    // Update the order payment status
    apiRequest({
      method: 'PATCH',
      url: `/api/orders/${orderId}/payment-status`,
      body: { status: 'paid', paymentId }
    })
      .then(() => {
        // Refresh order details by triggering query invalidation
        if (onPaymentSuccess) {
          onPaymentSuccess(paymentId);
        }
      })
      .catch(error => {
        console.error('Error updating order payment status:', error);
        toast({
          title: 'Update Error',
          description: 'Payment was successful, but we could not update the order status automatically.',
          variant: 'destructive',
        });
      });
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        disabled={disabled}
        variant={variant}
        className={className}
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Process Payment
      </Button>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        orderId={orderId}
        orderTotal={orderTotal}
        customerEmail={customerEmail}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
}