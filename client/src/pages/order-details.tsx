import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import PageHeader from "@/components/ui/page-header";
import OrderDetails from "@/components/order/order-details";
import OrderActions from "@/components/order/order-actions";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import OrderForm from "@/components/order/order-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { OrderFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import EmailInvoiceButton from "@/components/order/email-invoice-button";
import PaymentReminderSettings from "@/components/order/payment-reminder-settings";

const OrderDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const orderId = parseInt(params.id);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch order details
  const { data: order, isLoading, error } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !isNaN(orderId),
  });

  // Handle order update
  const handleUpdateOrder = async (data: OrderFormData) => {
    if (!order) return;
    
    setIsSubmitting(true);
    
    try {
      await apiRequest("PATCH", `/api/orders/${orderId}`, {
        ...data,
        orderNumber: order.orderNumber,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${orderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Close dialog and show success message
      setIsEditDialogOpen(false);
      
      toast({
        title: "Order Updated",
        description: `Order #${order.orderNumber} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Order Details"
          backLink="/orders"
          backLabel="Orders"
        />
        <div className="p-6">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg md:col-span-2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <div className="flex flex-col h-full">
        <PageHeader
          title="Order Details"
          backLink="/orders"
          backLabel="Orders"
        />
        <div className="p-6">
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-lg font-medium text-red-800">Error Loading Order</h3>
            <p className="mt-2 text-sm text-red-700">
              There was an error loading the order details. Please try again or go back to the orders list.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`${order.orderNumber.startsWith("Q") ? "Quote" : "Order"} Details`}
        backLink="/orders"
        backLabel="Orders"
        actions={<OrderActions order={order} onEdit={() => setIsEditDialogOpen(true)} />}
      />
      
      <OrderDetails order={order} />

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Edit Order</h2>
            <OrderForm
              initialData={{
                contactId: order.contactId,
                eventType: order.eventType as any,
                eventDate: new Date(order.eventDate),
                status: order.status as any,
                theme: order.theme || "",
                deliveryType: order.deliveryType as any,
                deliveryDetails: order.deliveryDetails || "",
                discount: Number(order.discount),
                discountType: order.discountType as any,
                setupFee: Number(order.setupFee),
                notes: order.notes || "",
                jobSheetNotes: order.jobSheetNotes || "",
                items: order.items.map(item => ({
                  id: item.id,
                  productId: item.productId,
                  type: item.type,
                  name: item.name,
                  description: item.description || "",
                  quantity: item.quantity,
                  unitPrice: Number(item.unitPrice),
                  price: Number(item.price),
                  notes: item.notes || "",
                })),
              }}
              onSubmit={handleUpdateOrder}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailsPage;
