import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";

const CreateTestOrderPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Create a test order with minimal required data
  const createTestOrder = async () => {
    try {
      setIsSubmitting(true);
      
      // Create an order object with all required fields
      const orderData = {
        userId: 1,
        contactId: 12, // Using an existing contact
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        eventType: "Birthday",
        eventDate: new Date().toISOString(),
        status: "Quote",
        deliveryType: "Pickup",
        deliveryAddress: "",
        deliveryTime: "",
        deliveryFee: "0",
        notes: "Test order created via direct API",
        specialInstructions: "Test instructions",
        taxRate: "0",
        amountPaid: "0",
        total_amount: "49.99", // Use total_amount as in the database
        items: [
          {
            description: "Test cake",
            quantity: 1,
            price: "49.99",
            name: "Test Cake"
          }
        ]
      };

      console.log("Submitting test order data:", JSON.stringify(orderData, null, 2));

      // Submit the order directly to the API endpoint
      const response = await fetch("/api/orders-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Order created successfully:", result);

      // Refresh the orders list
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });

      toast({
        title: "Test Order Created",
        description: `Order #${orderData.orderNumber} has been created successfully.`,
      });

      // Navigate to orders list
      navigate("/orders");
    } catch (error) {
      console.error("Error creating test order:", error);
      toast({
        title: "Error",
        description: "Failed to create test order. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Create Test Order" backLink="/orders" backLabel="Orders" />

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            <p className="text-gray-500">
              This page creates a test order directly via the API endpoint, bypassing the form.
              Click the button below to create a test order with pre-filled data.
            </p>
            
            <Button
              onClick={createTestOrder}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? "Creating..." : "Create Test Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTestOrderPage;