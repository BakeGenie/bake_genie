import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Product, Recipe, Contact } from "@shared/schema";
import { CustomerSearch } from "@/components/customer/customer-search";
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
import { CalendarIcon, Plus, X, Info as InfoIcon } from "lucide-react";
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
  // Allow both date and string formats for eventDate to handle all cases
  eventDate: z.union([
    z.string({ required_error: "Event date is required" }),
    z.date({ required_error: "Event date is required" })
  ]),
  customerName: z.string(),
  status: z.string().min(1, "Status is required"),
  eventType: z.string().min(1, "Event type is required"),
  deliveryAddress: z.string().optional(),
  deliveryTime: z.string().optional(),
  // Add fields for price calculations
  discount: z.number().default(0),
  discountType: z.enum(["%", "$"]).default("%"),
  setupFee: z.number().default(0),
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
  deliveryTime: "",
  eventType: "Birthday",
  discount: 0,
  discountType: "%",
  setupFee: 0,
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
    businessName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
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

  // Initialize form with properly merged default and initial values
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
      // Ensure these values are always set to prevent controlled/uncontrolled input issues
      orderDate: initialValues?.orderDate || new Date(),
      eventDate: initialValues?.eventDate || new Date(),
      customerId: initialValues?.contactId || 0,
      items: initialValues?.items || defaultValues.items,
      // Ensure proper nesting for nested objects
      customer: {
        ...defaultValues.customer,
        ...(initialValues?.customer || {}),
        userId: 1, // Always ensure this is set
      },
    },
  });
  
  // Destructure form methods
  const { control, watch, setValue, getValues, formState: { isSubmitting } } = form;
  
  // Set default dates to ensure fields are not empty
  useEffect(() => {
    // Set default dates if none are provided and fields are empty
    const currentValues = getValues();
    if (!currentValues.orderDate) {
      setValue("orderDate", new Date());
    }
  }, []);
  
  // Handle initialValues separately to ensure they override default values
  useEffect(() => {
    if (initialValues) {
      console.log("Received initialValues:", initialValues);
      
      // Handle event date from calendar selection
      if (initialValues.eventDate) {
        console.log("Setting event date:", initialValues.eventDate);
        // Force update eventDate regardless of its current value
        setValue("eventDate", initialValues.eventDate, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true 
        });
      }
      
      // Handle order date (usually today's date)
      if (initialValues.orderDate) {
        console.log("Setting order date:", initialValues.orderDate);
        setValue("orderDate", initialValues.orderDate, {
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true
        });
      }
    }
  }, [initialValues, setValue]);
  
  // Debug current form values
  useEffect(() => {
    const values = getValues();
    console.log("Current form values:", {
      eventDate: values.eventDate,
      orderDate: values.orderDate
    });
  }, [getValues]);

  // Initialize items field array
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch form values for calculations
  const items = watch("items");
  const totalAmount = items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
  
  // Get discount from form
  const getDiscountAmount = () => {
    const discount = watch("discount") || 0;
    const discountType = watch("discountType") || "%";
    
    if (discountType === "%") {
      return totalAmount * (discount / 100);
    } else {
      return discount;
    }
  };
  
  // Calculate the final total after discount and setup fee
  const getFinalTotal = () => {
    const setupFee = parseFloat(watch("setupFee")?.toString() || "0");
    return totalAmount - getDiscountAmount() + setupFee;
  };
  
  // Calculate gross profit (simplified version)
  const getGrossProfit = () => {
    // Cost could be calculated from ingredients/recipes in a more advanced version
    // For now, we'll use a simple 60% markup assumption
    const estimatedCost = totalAmount * 0.4; // 40% of total is cost
    return getFinalTotal() - estimatedCost;
  };

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
    // These fields aren't in our database schema, so we'll use the 'type' field instead
    item.type = 'Product';
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
    // Use standard fields that match our database structure
    item.productId = undefined; // Clear product ID if previously selected
    item.type = 'Recipe';
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
      console.log("Starting form submission with data:", data);
      
      // Ensure all required fields are present
      if (!data.customer?.firstName || !data.customer?.lastName) {
        toast({
          title: "Error",
          description: "Customer name is required",
          variant: "destructive",
        });
        return;
      }

      // Make sure we have items with valid prices
      if (!data.items || data.items.length === 0) {
        toast({
          title: "Error",
          description: "At least one item is required",
          variant: "destructive",
        });
        return;
      }

      // Format the data for submission with date conversion
      // We need to match the actual database column names
      const formattedData = {
        userId: 1,
        contactId: data.customer?.id || 12,
        orderNumber: data.orderNumber || `ORD-${Math.floor(Math.random() * 10000)}`,
        title: data.title || '', 
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate instanceof Date ? data.eventDate.toISOString() : new Date().toISOString(),
        status: data.status || 'Quote',
        deliveryType: data.deliveryType || 'Pickup',
        deliveryAddress: data.deliveryAddress || '',
        deliveryFee: data.deliveryFee?.toString() || '0', // Match database column
        deliveryTime: data.deliveryTime || '',
        totalAmount: totalAmount ? totalAmount.toString() : '0', // Match database column
        amountPaid: '0', // Required field in database
        specialInstructions: data.notes || '', // Match database column
        taxRate: data.taxRate?.toString() || '0', // Required field in database
        notes: data.notes || '',
        items: data.items.map(item => ({
          description: item.description || 'Product',
          price: typeof item.price === 'number' ? item.price.toString() : (item.price || '0'),
          quantity: item.quantity || 1,
          productId: item.productId || null,
          name: item.productName || item.description || 'Product', // Required field
          type: 'Product', // Required field
          unitPrice: typeof item.price === 'number' ? item.price.toString() : (item.price || '0') // Required field
        }))
      };
      
      // Log the data being sent (for debugging)
      console.log("Submitting formatted order data:", JSON.stringify(formattedData, null, 2));
      
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
                <Select onValueChange={field.onChange} value={field.value || "Quote"}>
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

          {/* Delivery Type and Time */}
          <div className="grid grid-cols-12 gap-4">
            <FormField
              control={control}
              name="deliveryType"
              render={({ field }) => (
                <FormItem className="col-span-6">
                  <FormLabel>Delivery Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "Pickup"}>
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
              name="deliveryTime"
              render={({ field }) => (
                <FormItem className="col-span-6">
                  <FormLabel>Delivery / Pick up Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Delivery Address */}
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
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
                        <Input {...field} className="h-8" value={field.value || ""} />
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
                        <Input {...field} type="email" className="h-8" value={field.value || ""} />
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
                        <Input {...field} className="h-8" value={field.value || ""} />
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
                        <Input {...field} className="h-8" value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              /* Existing Customer Selection with Search */
              <div>
                <FormField
                  control={control}
                  name="contactId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CustomerSearch 
                            onSelectContact={(contact) => {
                              field.onChange(contact.id);
                              setValue("customerName", `${contact.firstName} ${contact.lastName}`);
                              
                              // Update delivery address if the contact has one
                              if (contact.address) {
                                const fullAddress = [
                                  contact.address,
                                  contact.city,
                                  contact.state,
                                  contact.zip,
                                  contact.country
                                ].filter(Boolean).join(", ");
                                
                                setValue("deliveryAddress", fullAddress);
                              }
                            }}
                            selectedContactId={field.value}
                          />
                        </div>
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
            
            <div className="space-y-6">
              {/* Items */}
              {fields.map((field, index) => (
                <div key={field.id} className="border-b pb-5 mb-2 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-gray-100 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <h4 className="font-medium">Item Details</h4>
                    </div>
                    
                    {/* Remove button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="h-8"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                
                  <div className="grid grid-cols-12 gap-x-4 gap-y-3">
                    {/* Item Type Selection */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3">
                      <Label className="text-xs mb-1 block">Item Type</Label>
                      <Select
                        value={watch(`items.${index}.type`) || 'Product'} 
                        onValueChange={(value) => {
                          setValue(`items.${index}.type`, value);
                          // Clear existing selections when changing type
                          setValue(`items.${index}.productId`, undefined);
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
                    
                    {/* Product/Recipe Selection */}
                    <div className="col-span-12 md:col-span-8 lg:col-span-9">
                      <Label className="text-xs mb-1 block">
                        {watch(`items.${index}.itemType`) === 'product' ? 'Product' : 
                         watch(`items.${index}.itemType`) === 'recipe' ? 'Recipe' : 'Custom Item'}
                      </Label>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-grow">
                          {(watch(`items.${index}.itemType`) === 'product' || !watch(`items.${index}.itemType`)) && (
                            <FormField
                              control={control}
                              name={`items.${index}.productId`}
                              render={({ field }) => (
                                <FormItem>
                                  <ProductSelector 
                                    value={field.value as number} 
                                    onSelect={(product) => {
                                      handleProductSelect(index, product);
                                    }}
                                  />
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
                                  <RecipeSelector 
                                    value={field.value as number} 
                                    onSelect={(recipe) => {
                                      handleRecipeSelect(index, recipe);
                                    }}
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                        
                        {watch(`items.${index}.imageUrl`) && (
                          <div className="w-14 h-14 border rounded overflow-hidden flex-shrink-0">
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
                    </div>
                    
                    {/* Description */}
                    <div className="col-span-12">
                      <Label className="text-xs mb-1 block">Description</Label>
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
                    
                    {/* Bottom Row - Quantity, Price, Total */}
                    <div className="col-span-4">
                      <Label className="text-xs mb-1 block">Quantity</Label>
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
                    
                    <div className="col-span-4">
                      <Label className="text-xs mb-1 block">Price ($)</Label>
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
                    
                    <div className="col-span-4">
                      <Label className="text-xs mb-1 block">Total</Label>
                      <FormField
                        control={control}
                        name={`items.${index}.total`}
                        render={({ field }) => (
                          <div className="h-10 border rounded px-3 flex items-center font-medium">
                            ${field.value.toFixed(2)}
                          </div>
                        )}
                      />
                    </div>
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
                <div className="w-80 space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span>Subtotal: (excl Tax)</span>
                    <span className="font-medium">${totalAmount.toFixed(2)}</span>
                  </div>
                  
                  {/* Discount */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Discount:</span>
                      <div className="flex items-center">
                        <FormField
                          control={control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem className="space-y-0 flex-grow">
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="w-20 h-8 text-right"
                                  value={field.value || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Select
                          defaultValue="%"
                          onValueChange={(value) => setValue("discountType", value as "%" | "$")}
                        >
                          <SelectTrigger className="h-8 w-12 ml-1">
                            <SelectValue placeholder="%" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="%">%</SelectItem>
                            <SelectItem value="$">$</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <span>
                      - ${getDiscountAmount().toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Setup/Delivery */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>Setup / Delivery:</span>
                      <FormField
                        control={control}
                        name="setupFee"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-20 h-8"
                                value={field.value || 0}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <span>${(parseFloat(watch("setupFee")?.toString() || "0")).toFixed(2)}</span>
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="font-bold text-lg">Total:</span>
                    <span className="font-bold text-lg">
                      ${getFinalTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Gross Profit */}
                  <div className="bg-gray-50 p-3 rounded-lg mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Gross Profit:</span>
                      <span className="font-medium">${getGrossProfit().toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-start gap-1">
                      <span className="inline-block">
                        <InfoIcon className="h-3 w-3" />
                      </span>
                      <span>Your profit amount is not included in any print outs or PDFs.</span>
                    </div>
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