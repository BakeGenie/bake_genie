import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

// Simple order form with minimal fields to ensure it works
const SimpleOrderPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    eventType: "Birthday",
    description: "Birthday Cake",
    quantity: 1,
    price: "49.99",
    notes: "",
    specialInstructions: ""
  });
  
  // Get customers for dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Update form field
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Create an order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      
      // Create the order data with all required fields
      const orderData = {
        userId: 1,
        contactId: 12, // Using a default contact
        orderNumber,
        eventType: formData.eventType,
        eventDate: new Date().toISOString(),
        status: "Quote",
        deliveryType: "Pickup",
        deliveryAddress: "",
        deliveryTime: "",
        deliveryFee: "0",
        notes: formData.notes,
        specialInstructions: formData.specialInstructions,
        taxRate: "0",
        amountPaid: "0",
        total_amount: formData.price, // Using exact database field name
        items: [
          {
            description: formData.description,
            quantity: formData.quantity,
            price: formData.price,
            name: formData.description
          }
        ]
      };
      
      console.log("Submitting order data:", orderData);
      
      // Submit to API
      const response = await fetch("/api/orders-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Order created successfully:", result);
      
      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Show success message
      toast({
        title: "Order Created",
        description: `Order #${orderNumber} has been created successfully.`,
      });
      
      // Navigate to orders list
      navigate("/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order. See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Simple Order Form" backLink="/orders" backLabel="Orders" />
      
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Order (Simplified)</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Event Type */}
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select
                    value={formData.eventType}
                    onValueChange={(value) => handleSelectChange("eventType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Birthday">Birthday</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Anniversary">Anniversary</SelectItem>
                      <SelectItem value="Graduation">Graduation</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Product Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Product Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter product description"
                  />
                </div>
                
                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
                
                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="49.99"
                  />
                </div>
                
                {/* Notes */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter any additional notes"
                    rows={3}
                  />
                </div>
                
                {/* Special Instructions */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={handleChange}
                    placeholder="Enter any special instructions"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/orders")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleOrderPage;