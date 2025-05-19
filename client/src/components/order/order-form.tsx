import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Product, Recipe } from "@shared/schema";
import ProductSelector from "./product-selector";
import RecipeSelector from "./recipe-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { queryCacheKey } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertOrderSchema, orderStatusTypes, deliveryTypes, eventTypes } from "@shared/schema";
import { eventTypeColors } from "@/lib/constants";
import { HexColorPicker } from "react-colorful";
import { Badge } from "@/components/ui/badge";

// A unique key to invalidate order queries
const ORDERS_QUERY_KEY = queryCacheKey('orders');

// Define the schema for customer selection
const customerSchema = z.object({
  id: z.number().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  businessName: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  userId: z.number(),
});

// Define schema for order item with product details
const orderItemSchema = z.object({
  id: z.number().optional(),
  productId: z.number().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity is required"),
  price: z.number().min(0, "Price is required"),
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
  status: z.string().min(1, "Status is required"),
  eventType: z.string().min(1, "Event type is required"),
  deliveryAddress: z.string().optional(),
});

// Define the form value types
type OrderFormValues = z.infer<typeof orderFormSchema>;

// Custom event type dialog state
interface CustomEventTypeState {
  name: string;
  color: string;
}

// Custom event types in local storage
interface CustomEventType {
  name: string;
  color: string;
}

// Initial form values
const defaultValues: Partial<OrderFormValues> = {
  orderDate: new Date(),
  status: "Quote",
  deliveryType: "Pickup",
  deliveryAddress: "",
  eventType: "Birthday",
  items: [
    {
      description: "",
      quantity: 1,
      price: 0,
      total: 0,
    },
  ],
  customer: {
    firstName: "",
    lastName: "",
    userId: 1, // Default user ID
  },
  userId: 1, // Default user ID
};

// OrderForm component
export default function OrderForm({ onSubmit, initialValues }: { onSubmit: (data: OrderFormValues) => void, initialValues?: Partial<OrderFormValues> }) {
  const { toast } = useToast();
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isCustomEventDialogOpen, setIsCustomEventDialogOpen] = useState(false);
  const [customEventType, setCustomEventType] = useState("");
  const [customEventColor, setCustomEventColor] = useState("#ff0000");
  const [customEventTypes, setCustomEventTypes] = useState<CustomEventType[]>(() => {
    // Get custom event types from local storage
    const savedCustomEventTypes = localStorage.getItem("customEventTypes");
    return savedCustomEventTypes ? JSON.parse(savedCustomEventTypes) : [];
  });

  // Initialize form with default or initial values
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  // Destructure form methods
  const { control, watch, setValue, getValues, formState: { isSubmitting } } = form;

  // Initialize items field array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch form values for calculations
  const items = watch("items");
  const totalAmount = items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

  // Create a new custom event type
  const handleCustomEventTypeCreate = () => {
    if (!customEventType.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event type name",
        variant: "destructive",
      });
      return;
    }

    const newCustomEventType = {
      name: customEventType.trim(),
      color: customEventColor,
    };

    // Add to state
    const updatedCustomEventTypes = [...customEventTypes, newCustomEventType];
    setCustomEventTypes(updatedCustomEventTypes);
    
    // Save to local storage
    localStorage.setItem("customEventTypes", JSON.stringify(updatedCustomEventTypes));
    
    // Set the form value
    setValue("eventType", newCustomEventType.name);
    
    // Reset the dialog
    setCustomEventType("");
    setCustomEventColor("#ff0000");
    setIsCustomEventDialogOpen(false);
    
    toast({
      title: "Success",
      description: `Custom event type "${newCustomEventType.name}" created`,
    });
  };

  // Handle adding a new line item
  const handleAddItem = () => {
    append({
      description: "",
      quantity: 1,
      price: 0,
      total: 0,
      productId: undefined,
      imageUrl: null,
      productName: null
    });
  };

  // Handle product selection for an item
  const handleProductSelect = (index: number, product: Product) => {
    const currentItems = getValues("items");
    const item = currentItems[index];
    
    // Update item with product details
    item.productId = product.id;
    item.recipeId = undefined; // Clear recipe ID if previously selected
    item.itemType = 'product';
    item.description = product.name;
    item.productName = product.name;
    
    // Handle price conversion safely for any type
    let productPrice = 0;
    if (product.price) {
      productPrice = typeof product.price === 'string' 
        ? parseFloat(product.price) 
        : typeof product.price === 'number'
          ? product.price
          : parseFloat(String(product.price)); // Handle decimal type
    }
    
    item.price = productPrice;
    item.imageUrl = product.imageUrl || null;
    
    // Calculate the total
    item.total = item.quantity * item.price;
    
    // Update the entire items array
    setValue("items", currentItems);
    
    // Trigger form validation
    form.trigger(`items.${index}`);
  };
  
  // Handle recipe selection for an item
  const handleRecipeSelect = (index: number, recipe: Recipe) => {
    const currentItems = getValues("items");
    const item = currentItems[index];
    
    // Update item with recipe details
    item.recipeId = recipe.id;
    item.productId = undefined; // Clear product ID if previously selected
    item.itemType = 'recipe';
    item.description = recipe.name;
    item.productName = recipe.name;
    
    // Handle price conversion safely for any type
    let recipePrice = 0;
    if (recipe.totalCost) {
      recipePrice = typeof recipe.totalCost === 'string' 
        ? parseFloat(recipe.totalCost) 
        : typeof recipe.totalCost === 'number'
          ? recipe.totalCost
          : parseFloat(String(recipe.totalCost)); // Handle decimal type
    }
    
    item.price = recipePrice;
    item.imageUrl = recipe.imageUrl || null;
    
    // Include recipe servings in description if available
    if (recipe.servings) {
      item.description += ` (${recipe.servings} servings)`;
    }
    
    // Calculate the total
    item.total = item.quantity * item.price;
    
    // Update the entire items array
    setValue("items", currentItems);
    
    // Trigger form validation
    form.trigger(`items.${index}`);
  };

  // Handle item changes and calculate totals
  const handleItemChange = (index: number, field: "quantity" | "price", value: number) => {
    const currentItems = getValues("items");
    const item = currentItems[index];
    
    if (field === "quantity") {
      item.quantity = value;
    } else if (field === "price") {
      item.price = value;
    }
    
    // Calculate the total for this item
    item.total = item.quantity * item.price;
    
    // Update the entire items array
    setValue("items", currentItems);
  };

  // Form submission handler
  const onSubmitForm = async (data: OrderFormValues) => {
    try {
      // Ensure all required fields are present
      if (!data.customer.firstName || !data.customer.lastName) {
        toast({
          title: "Error",
          description: "Customer name is required",
          variant: "destructive",
        });
        return;
      }

      // Format the data for submission with date conversion
      const formattedData = {
        ...data,
        total: totalAmount,
        // Ensure dates are properly formatted for API submission
        orderDate: data.orderDate instanceof Date ? data.orderDate.toISOString() : new Date().toISOString(),
        eventDate: data.eventDate instanceof Date ? data.eventDate.toISOString() : new Date().toISOString(),
        // Generate a customer name for display
        customerName: `${data.customer.firstName} ${data.customer.lastName}`,
        // Add additional defaults
        userId: 1,
      };
      
      // Log the data being sent (for debugging)
      console.log("Submitting order data:", formattedData);
      
      // Send data to parent component for submission
      onSubmit(formattedData);

      // Show success message on form submit
      toast({
        title: "Processing Order",
        description: "Saving order information...",
      });
    } catch (error) {
      console.error("Order submission error:", error);
      toast({
        title: "Error",
        description: "Failed to save order. Please check form fields and try again.",
        variant: "destructive",
      });
    }
  };

  // Get the current color for an event type
  const getEventTypeColor = (eventType: string) => {
    // Check if it's a standard event type
    if (eventType in eventTypeColors) {
      return eventTypeColors[eventType as keyof typeof eventTypeColors];
    }
    
    // Check if it's a custom event type
    const customEvent = customEventTypes.find(e => e.name === eventType);
    return customEvent ? customEvent.color : "#808080"; // Default to gray if not found
  };

  // Render color badge for event type selection
  const renderEventTypeOption = (eventType: string) => {
    const color = getEventTypeColor(eventType);
    return (
      <div className="flex items-center">
        <div 
          className="w-4 h-4 rounded-full mr-2" 
          style={{ backgroundColor: color }}
        />
        {eventType}
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Date */}
          <FormField
            control={control}
            name="orderDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Event Date */}
          <FormField
            control={control}
            name="eventDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Event Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          

          {/* Event Type */}
          <FormField
            control={control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <div className="flex space-x-2">
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {field.value && (
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: getEventTypeColor(field.value) }}
                              />
                              {field.value}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* Standard event types */}
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {renderEventTypeOption(type)}
                        </SelectItem>
                      ))}
                      
                      {/* Custom event types */}
                      {customEventTypes.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-medium">
                            Custom Event Types
                          </div>
                          {customEventTypes.map((type) => (
                            <SelectItem key={type.name} value={type.name}>
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 rounded-full mr-2" 
                                  style={{ backgroundColor: type.color }}
                                />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Dialog to add custom event type */}
                  <Dialog open={isCustomEventDialogOpen} onOpenChange={setIsCustomEventDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add Custom Event Type</DialogTitle>
                        <DialogDescription>
                          Create a new custom event type with a color.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="customEventType">Event Type Name</Label>
                          <Input
                            id="customEventType"
                            value={customEventType}
                            onChange={(e) => setCustomEventType(e.target.value)}
                            placeholder="Enter event type name"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Event Color</Label>
                          <div className="flex justify-center p-2">
                            <HexColorPicker 
                              color={customEventColor} 
                              onChange={setCustomEventColor} 
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div 
                              className="w-8 h-8 rounded-full" 
                              style={{ backgroundColor: customEventColor }}
                            />
                            <Input
                              value={customEventColor}
                              onChange={(e) => setCustomEventColor(e.target.value)}
                              className="w-36 ml-2"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCustomEventDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button" 
                          onClick={handleCustomEventTypeCreate}
                        >
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {orderStatusTypes.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery Type and Address */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={control}
              name="deliveryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deliveryTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Delivery Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter delivery address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Customer Section */}
          <div className="col-span-1 md:col-span-2 border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Customer Details</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
              >
                {isNewCustomer ? "Select Existing" : "New Customer"}
              </Button>
            </div>

            {isNewCustomer ? (
              /* New Customer Form - More compact layout */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                <FormField
                  control={control}
                  name="customer.firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">First Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customer.lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customer.businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customer.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="h-8" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customer.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Phone</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="customer.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Address</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              /* Existing Customer Selection */
              <div>
                <FormField
                  control={control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Search for customer..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Line Items Section */}
          <div className="col-span-1 md:col-span-2 border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Order Items</h3>
            
            <div className="space-y-4">
              {/* Headers */}
              <div className="grid grid-cols-12 gap-2 font-medium">
                <div className="col-span-3">Product</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Total</div>
              </div>
              
              {/* Items */}
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  {/* Product/Recipe Selection */}
                  <div className="col-span-3">
                    <div className="mb-2">
                      <Select
                        value={watch(`items.${index}.itemType`) || 'product'} 
                        onValueChange={(value) => {
                          setValue(`items.${index}.itemType`, value);
                          // Clear existing selections when changing type
                          setValue(`items.${index}.productId`, undefined);
                          setValue(`items.${index}.recipeId`, undefined);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="recipe">Recipe</SelectItem>
                          <SelectItem value="custom">Custom Item</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(watch(`items.${index}.itemType`) === 'product' || !watch(`items.${index}.itemType`)) && (
                      <FormField
                        control={control}
                        name={`items.${index}.productId`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-col space-y-1">
                              <ProductSelector 
                                value={field.value as number} 
                                onSelect={(product) => {
                                  handleProductSelect(index, product);
                                }}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {watch(`items.${index}.itemType`) === 'recipe' && (
                      <FormField
                        control={control}
                        name={`items.${index}.recipeId`}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex flex-col space-y-1">
                              <RecipeSelector 
                                value={field.value as number} 
                                onSelect={(recipe) => {
                                  handleRecipeSelect(index, recipe);
                                }}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {watch(`items.${index}.imageUrl`) && (
                      <div className="w-12 h-12 border rounded overflow-hidden mt-1">
                        <img 
                          src={watch(`items.${index}.imageUrl`) || ''} 
                          alt={watch(`items.${index}.description`) || 'Item'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="col-span-3">
                    <FormField
                      control={control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-2">
                    <FormField
                      control={control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                field.onChange(value);
                                handleItemChange(index, "quantity", value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Price */}
                  <div className="col-span-2">
                    <FormField
                      control={control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0" 
                              step="0.01"
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                field.onChange(value);
                                handleItemChange(index, "price", value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Total */}
                  <div className="col-span-1">
                    <FormField
                      control={control}
                      name={`items.${index}.total`}
                      render={({ field }) => (
                        <div className="font-medium">
                          ${field.value.toFixed(2)}
                        </div>
                      )}
                    />
                  </div>
                  
                  {/* Remove button */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Add item button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
              
              {/* Order Totals */}
              <div className="flex justify-end pt-4 border-t mt-6">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span>Total:</span>
                    <span className="font-bold">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="col-span-1 md:col-span-2">
            <FormField
              control={control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter any special instructions or notes for this order"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Form Actions */}
          <div className="col-span-1 md:col-span-2 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Order"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}