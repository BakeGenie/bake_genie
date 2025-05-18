import React from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/page-header";
import OrderForm from "@/components/order/order-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { OrderFormData } from "@/types";

const NewOrderPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Parse URL parameters to get pre-selected date if any
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const preselectedDate = searchParams.get('date');
  
  // Handle form submission for a new order
  const handleNewOrderSubmit = async (data: OrderFormData) => {
    try {
      setIsSubmitting(true);
      
      // Create a unique order number (in a real app, this would be generated server-side)
      const orderNumber = `ORD-${Date.now().toString().substr(-6)}`;
      
      // Format the form data for the API request
      const formattedData = {
        ...data,
        orderNumber,
        userId: 1, // In a real app, this would be the current user's ID
        // Convert Date objects to ISO strings
        eventDate: data.eventDate instanceof Date ? data.eventDate.toISOString() : data.eventDate,
        orderDate: data.orderDate instanceof Date ? data.orderDate.toISOString() : data.orderDate,
        deliveryDate: data.deliveryDate instanceof Date ? data.deliveryDate.toISOString() : data.deliveryDate,
      };
      
      const response = await apiRequest("POST", "/api/orders", formattedData);
      
      const newOrder = await response.json();
      
      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      toast({
        title: "Order Created",
        description: `Order #${orderNumber} has been created successfully.`,
      });
      
      // Navigate to the new order details page
      navigate(`/orders/${newOrder.id}`);
    } catch (error) {
      console.error("Order creation error:", error);
      toast({
        title: "Error",
        description: "There was an error creating the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="New Order"
        backLink="/orders"
        backLabel="Orders"
      />
      
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <OrderForm
              onSubmit={handleNewOrderSubmit}
              initialData={preselectedDate ? { eventDate: new Date(preselectedDate) } : undefined}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;