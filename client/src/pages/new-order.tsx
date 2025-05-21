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
  // Allow both string and date for eventDate to prevent validation issues
  eventDate: z.union([
    z.string({ required_error: "Event date is required" }),
    z.date({ required_error: "Event date is required" })
  ]),
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
  
  // Function to calculate total amount for an order
  const totalAmount = (items: any[], discount = 0, setupFee = 0, deliveryFee = 0, discountType = '%') => {
    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return sum + (quantity * price);
    }, 0);
    
    // Apply discount
    let discountAmount = 0;
    if (discountType === '%') {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }
    
    // Calculate final total
    const total = subtotal - discountAmount + setupFee + deliveryFee;
    
    // Return as string with 2 decimal places
    return total.toFixed(2);
  };
  
  // Parse URL parameters to get pre-selected date if any
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  // Check for both 'eventDate' and 'date' params to support both formats
  const preselectedDate = searchParams.get('eventDate') || searchParams.get('date');
  
  // Handle form submission for a new order
  const handleNewOrderSubmit = async (data: OrderFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create a unique order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      
      // Log the complete form data we received
      console.log("STEP 1 - Raw form data received:", JSON.stringify(data, null, 2));
      
      // Format the form data for the API request to match what the server expects
      const formattedData = {
        contactId: data.customer?.id || data.contactId || 12, // Make sure contactId is properly sent
        orderNumber,
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate ? new Date(data.eventDate).toISOString() : new Date().toISOString(),
        status: data.status || 'Quote',
        deliveryType: data.deliveryType || 'Pickup',
        deliveryAddress: data.deliveryAddress || '',
        deliveryTime: data.deliveryTime || '',
        deliveryFee: data.deliveryFee?.toString() || '0',
        notes: data.notes || '',
        specialInstructions: data.notes || '',
        taxRate: data.taxRate?.toString() || '0',
        amountPaid: '0',
        total: totalAmount(data.items, data.discount || 0, data.setupFee || 0, data.deliveryFee || 0, data.discountType || '%'),
        items: data.items.map(item => ({
          description: item.description || '',
          quantity: item.quantity || 1,
          price: item.price?.toString() || '0',
          name: item.productName || item.description || 'Product',
          type: 'Product',
          unitPrice: item.price?.toString() || '0',
          productId: item.productId || null
        }))
      };
      
      // Log the formatted data before sending to API
      console.log("STEP 2 - Formatted data for API:", JSON.stringify(formattedData, null, 2));
      
      // Make the API request
      const response = await apiRequest("POST", "/api/orders", formattedData);
      console.log("STEP 3 - API response status:", response.status);
      
      const newOrder = await response.json();
      console.log("STEP 4 - API response data:", JSON.stringify(newOrder, null, 2));
      
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

  // Create initialValues object for the form
  const initialValues = React.useMemo(() => {
    // Start with today's date as the order date
    const today = new Date();
    const values: Partial<OrderFormValues> = {
      orderDate: today
    };
    
    // First check localStorage for a date that might have been set from the calendar
    const storedEventDate = localStorage.getItem('pendingEventDate');
    
    if (storedEventDate) {
      try {
        console.log("Found stored event date:", storedEventDate);
        // Parse as a string date in the format "yyyy-MM-dd"
        // The form will handle the conversion to Date as needed
        const selectedDate = new Date(storedEventDate);
        
        if (!isNaN(selectedDate.getTime())) {
          // Use the stored event date
          values.eventDate = selectedDate;
          console.log("Using stored event date:", selectedDate);
          
          // Clear the localStorage item now that we've used it
          localStorage.removeItem('pendingEventDate');
        }
      } catch (e) {
        console.error("Invalid stored date format:", storedEventDate);
      }
    }
    // If there's nothing in localStorage, try URL parameter as fallback
    else if (preselectedDate) {
      try {
        console.log("Using URL parameter date:", preselectedDate);
        const selectedDate = new Date(preselectedDate);
        
        if (!isNaN(selectedDate.getTime())) {
          values.eventDate = selectedDate;
        }
      } catch (e) {
        console.error("Invalid date format from URL:", preselectedDate);
      }
    }
    
    // Log the complete values being passed to form
    console.log("Initial values being passed to form:", values);
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