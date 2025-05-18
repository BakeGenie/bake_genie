import React from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/page-header";
import OrderForm from "@/components/order/order-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Import type from the form component 
// We'll use the type from the actual form to ensure compatibility
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";

// Define customer schema (simplified version of what's in order-form.tsx)
const customerSchema = z.object({
  userId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  businessName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Define schema for order item with product details
const orderItemSchema = z.object({
  id: z.number().optional(),
  productId: z.number().optional(),
  description: z.string(),
  quantity: z.number(),
  price: z.number(),
  total: z.number(),
  // Additional fields for product information
  imageUrl: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
});

// Extend the insert order schema with necessary fields for form validation
const orderFormSchema = insertOrderSchema.extend({
  customer: customerSchema,
  items: z.array(orderItemSchema),
  // Make these fields required
  orderDate: z.date({ required_error: "Order date is required" }),
  customerName: z.string(),
  status: z.string(),
  eventType: z.string(),
});

// Define the form value types
type OrderFormValues = z.infer<typeof orderFormSchema>;

const NewOrderPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Parse URL parameters to get pre-selected date if any
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const preselectedDate = searchParams.get('date');
  
  // Handle form submission for a new order
  const handleNewOrderSubmit = async (data: OrderFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create a unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      
      // Format the form data for the API request
      const formattedData = {
        ...data,
        orderNumber,
        // Convert Date objects to ISO strings for API
        eventDate: data.eventDate ? data.eventDate.toISOString() : new Date().toISOString(),
        orderDate: data.orderDate ? data.orderDate.toISOString() : new Date().toISOString(),
        deliveryDate: data.deliveryDate ? data.deliveryDate.toISOString() : undefined,
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

  // Create initialValues object for the form based on preselected date
  const initialValues = React.useMemo(() => {
    const values: Partial<OrderFormValues> = {};
    
    // If we have a preselected date from the calendar, use it
    if (preselectedDate) {
      try {
        const selectedDate = new Date(preselectedDate);
        // Set both the event date and order date
        values.eventDate = selectedDate;
        // Also set order date to today
        values.orderDate = new Date();
        
        console.log("Pre-populating date:", selectedDate);
      } catch (e) {
        console.error("Invalid date format:", preselectedDate);
      }
    }
    
    return values;
  }, [preselectedDate]);

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
              initialValues={initialValues}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;