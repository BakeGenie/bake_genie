import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderFormData } from "@/types";
import { OrderStatus, EventType, DeliveryType, eventTypes, orderStatusTypes, deliveryTypes } from "@shared/schema";
import { Contact } from "@shared/schema";
import { CalendarIcon, PlusIcon, XIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn, formatDate } from "@/lib/utils";
import { insertOrderSchema } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define cake flavors, icings, and fillings
const cakeFlavors = [
  "Vanilla", "Chocolate", "Red Velvet", "Lemon", "Carrot", 
  "Coconut", "Marble", "Funfetti", "Strawberry", "Coffee"
];

const icingTypes = [
  "Buttercream", "Cream Cheese", "Fondant", "Ganache", 
  "Whipped Cream", "Royal Icing", "Meringue", "Naked"
];

const fillingTypes = [
  "None", "Jam", "Buttercream", "Custard", "Ganache", 
  "Fruit", "Mousse", "Cream Cheese"
];

// Define portion sizes for calculator
const portionSizes = [
  { label: "Small (1\"×1\")", value: "small", servingsMultiplier: 1.44 },
  { label: "Regular (1\"×2\")", value: "regular", servingsMultiplier: 1 },
  { label: "Large (2\"×2\")", value: "large", servingsMultiplier: 0.64 },
  { label: "Extra Large (2\"×3\")", value: "xlarge", servingsMultiplier: 0.48 }
];
  "Vanilla", "Chocolate", "Red Velvet", "Lemon", "Carrot", 
  "Coconut", "Marble", "Funfetti", "Strawberry", "Coffee"
];

const icingTypes = [
  "Buttercream", "Cream Cheese", "Fondant", "Ganache", 
  "Whipped Cream", "Royal Icing", "Meringue", "Naked"
];

const fillingTypes = [
  "None", "Jam", "Buttercream", "Custard", "Ganache", 
  "Fruit", "Mousse", "Cream Cheese"
];

// Define portion sizes for calculator
const portionSizes = [
  { label: "Small (1\"×1\")", value: "small", servingsMultiplier: 1.44 },
  { label: "Regular (1\"×2\")", value: "regular", servingsMultiplier: 1 },
  { label: "Large (2\"×2\")", value: "large", servingsMultiplier: 0.64 },
  { label: "Extra Large (2\"×3\")", value: "xlarge", servingsMultiplier: 0.48 }
];

// Extended schema with validation rules
const orderFormSchema = insertOrderSchema.extend({
  contactId: z.number().int().positive({ message: "Please select a contact" }),
  eventType: z.string().refine((value) => eventTypes.includes(value as EventType), {
    message: "Please select a valid event type",
  }),
  eventDate: z.coerce.date(),
  status: z.string().refine((value) => orderStatusTypes.includes(value as OrderStatus), {
    message: "Please select a valid status",
  }),
  deliveryType: z.string().refine((value) => deliveryTypes.includes(value as DeliveryType), {
    message: "Please select a valid delivery type",
  }),
  discount: z.coerce.number().min(0),
  discountType: z.enum(["%", "$"]),
  setupFee: z.coerce.number().min(0),
  items: z.array(
    z.object({
      id: z.number().optional(),
      productId: z.number().optional(),
      type: z.string().min(1, { message: "Type is required" }),
      name: z.string().min(1, { message: "Name is required" }),
      description: z.string().optional(),
      quantity: z.coerce.number().int().positive(),
      // Cake configuration for each item
      isCake: z.boolean().optional().default(false),
      numberOfTiers: z.coerce.number().min(1).max(6).optional(),
      portionSize: z.string().optional(),
      cakeTiers: z.array(z.object({
        diameter: z.coerce.number().min(4).max(30),
        height: z.coerce.number().min(2).max(12),
        flavor: z.string(),
        icing: z.string(),
        filling: z.string(),
      })).optional(),
      unitPrice: z.coerce.number().min(0),
      price: z.coerce.number().min(0),
      notes: z.string().optional(),
    })
  ).min(1, { message: "At least one item is required" }),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Fetch contacts
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const defaultValues: Partial<OrderFormValues> = {
    contactId: initialData?.contactId || 0,
    eventType: initialData?.eventType || "Birthday",
    eventDate: initialData?.eventDate || new Date(),
    status: initialData?.status || "Draft",
    theme: initialData?.theme || "",
    deliveryType: initialData?.deliveryType || "Pickup",
    deliveryDetails: initialData?.deliveryDetails || "",
    discount: initialData?.discount || 0,
    discountType: initialData?.discountType || "%",
    setupFee: initialData?.setupFee || 0,
    notes: initialData?.notes || "",
    jobSheetNotes: initialData?.jobSheetNotes || "",
    items: initialData?.items || [
      {
        type: "Cake",
        name: "",
        quantity: 1,
        unitPrice: 0,
        price: 0,
      },
    ],
  };

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate total when relevant fields change
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith("items") ||
        name === "discount" ||
        name === "discountType" ||
        name === "setupFee"
      ) {
        calculateTotal();
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const calculateTotal = () => {
    const values = form.getValues();
    let subtotal = 0;
    
    // Sum all items
    values.items?.forEach((item) => {
      subtotal += Number(item.price);
    });
    
    // Apply discount
    let discountAmount = 0;
    if (values.discountType === "%") {
      discountAmount = subtotal * (Number(values.discount) / 100);
    } else {
      discountAmount = Number(values.discount);
    }
    
    // Calculate total
    const total = subtotal - discountAmount + Number(values.setupFee);
    
    // Return the formatted values
    return {
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const updateItemPrice = (index: number) => {
    const items = form.getValues("items");
    const item = items[index];
    const price = Number(item.quantity) * Number(item.unitPrice);
    form.setValue(`items.${index}.price`, price);
  };

  const handleSubmit = (values: OrderFormValues) => {
    // Calculate the final total
    const { total } = calculateTotal();
    
    // Submit with calculated total
    onSubmit({
      ...values,
      total: parseFloat(total),
    });
  };

  const addItem = () => {
    append({
      type: "Cake",
      name: "",
      quantity: 1,
      unitPrice: 0,
      price: 0,
      isCake: false,
      numberOfTiers: 1,
      portionSize: "regular",
      cakeTiers: [
        {
          diameter: 6,
          height: 4,
          flavor: "Vanilla",
          icing: "Buttercream",
          filling: "None"
        }
      ]
    });
  };

  // Calculate the current totals
  const totals = calculateTotal();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Order Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Customer</FormLabel>
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        // This would open the new customer form dialog
                        console.log("New customer button clicked");
                      }}
                    >
                      New Customer
                    </Button>
                  </div>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.firstName} {contact.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value)
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
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
          </div>

          <FormField
            control={form.control}
            name="theme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event theme" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
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
              control={form.control}
              name="deliveryDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Details</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter delivery details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
            >
              <PlusIcon className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between mb-4">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentValues = form.getValues(`items.${index}`);
                        form.setValue(`items.${index}.isCake`, !currentValues.isCake);
                      }}
                    >
                      {form.watch(`items.${index}.isCake`) ? "Hide Cake Options" : "Cake Options"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Cake configuration - only visible when isCake is true */}
                  {form.watch(`items.${index}.isCake`) && (
                    <div className="col-span-2 bg-gray-50 p-4 rounded-md mt-2">
                      <h4 className="font-medium mb-4">Cake Configuration</h4>
                      
                      {/* Number of tiers selection */}
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.numberOfTiers`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Tiers</FormLabel>
                              <FormControl>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value));
                                    
                                    // Get current tiers
                                    const currentTiers = form.getValues(`items.${index}.cakeTiers`) || [];
                                    const newTierCount = parseInt(value);
                                    
                                    // If we need more tiers, add them
                                    if (currentTiers.length < newTierCount) {
                                      const firstTier = currentTiers[0] || { 
                                        diameter: 6, 
                                        height: 4, 
                                        flavor: "Vanilla", 
                                        icing: "Buttercream", 
                                        filling: "None" 
                                      };
                                      
                                      const newTiers = [...currentTiers];
                                      
                                      // Add new tiers with decreasing diameter for a tiered effect
                                      for (let i = currentTiers.length; i < newTierCount; i++) {
                                        const diameter = Math.max(4, firstTier.diameter - (i * 2));
                                        newTiers.push({
                                          diameter,
                                          height: firstTier.height,
                                          flavor: firstTier.flavor,
                                          icing: firstTier.icing,
                                          filling: firstTier.filling
                                        });
                                      }
                                      
                                      form.setValue(`items.${index}.cakeTiers`, newTiers);
                                    } 
                                    // If we need fewer tiers, remove them
                                    else if (currentTiers.length > newTierCount) {
                                      form.setValue(`items.${index}.cakeTiers`, currentTiers.slice(0, newTierCount));
                                    }
                                  }}
                                  defaultValue={field.value?.toString()}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select number of tiers" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6].map(num => (
                                      <SelectItem key={num} value={num.toString()}>
                                        {num}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Portion size selection */}
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.portionSize`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portion Size</FormLabel>
                              <FormControl>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select portion size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {portionSizes.map(size => (
                                      <SelectItem key={size.value} value={size.value}>
                                        {size.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Tier Configuration */}
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Tier Configuration</h5>
                        
                        {/* Display each tier with configuration options */}
                        {Array.from({length: form.watch(`items.${index}.numberOfTiers`) || 1}).map((_, tierIndex) => (
                          <div key={tierIndex} className="p-3 border border-gray-200 rounded-md mb-3">
                            <h6 className="font-medium mb-2">Tier {tierIndex + 1}</h6>
                            
                            {/* Tier dimensions */}
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.cakeTiers.${tierIndex}.diameter`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Diameter (inches)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={4}
                                        max={30}
                                        step={1}
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 4)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`items.${index}.cakeTiers.${tierIndex}.height`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Height (inches)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={2}
                                        max={12}
                                        step={0.5}
                                        {...field}
                                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 2)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            {/* Flavor, Icing, and Filling */}
                            <div className="mb-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.cakeTiers.${tierIndex}.flavor`}
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex justify-between items-center">
                                      <FormLabel>Cake Flavor</FormLabel>
                                      {tierIndex > 0 && (
                                        <div className="flex items-center space-x-2">
                                          <Label htmlFor={`same-flavor-${tierIndex}`} className="text-xs">Same as Tier 1</Label>
                                          <Switch 
                                            id={`same-flavor-${tierIndex}`}
                                            checked={!!form.watch(`items.${index}.cakeTiers.${tierIndex}.sameFlavor`)}
                                            onCheckedChange={(checked) => {
                                              form.setValue(`items.${index}.cakeTiers.${tierIndex}.sameFlavor`, checked);
                                              if (checked) {
                                                // Copy flavor from first tier
                                                const firstTierFlavor = form.getValues(`items.${index}.cakeTiers.0.flavor`);
                                                form.setValue(`items.${index}.cakeTiers.${tierIndex}.flavor`, firstTierFlavor);
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <FormControl>
                                      <Select 
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={tierIndex > 0 && form.watch(`items.${index}.cakeTiers.${tierIndex}.sameFlavor`)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select cake flavor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {cakeFlavors.map(flavor => (
                                            <SelectItem key={flavor} value={flavor}>
                                              {flavor}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="mb-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.cakeTiers.${tierIndex}.icing`}
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex justify-between items-center">
                                      <FormLabel>Icing Type</FormLabel>
                                      {tierIndex > 0 && (
                                        <div className="flex items-center space-x-2">
                                          <Label htmlFor={`same-icing-${tierIndex}`} className="text-xs">Same as Tier 1</Label>
                                          <Switch 
                                            id={`same-icing-${tierIndex}`}
                                            checked={!!form.watch(`items.${index}.cakeTiers.${tierIndex}.sameIcing`)}
                                            onCheckedChange={(checked) => {
                                              form.setValue(`items.${index}.cakeTiers.${tierIndex}.sameIcing`, checked);
                                              if (checked) {
                                                // Copy icing from first tier
                                                const firstTierIcing = form.getValues(`items.${index}.cakeTiers.0.icing`);
                                                form.setValue(`items.${index}.cakeTiers.${tierIndex}.icing`, firstTierIcing);
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <FormControl>
                                      <Select 
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={tierIndex > 0 && form.watch(`items.${index}.cakeTiers.${tierIndex}.sameIcing`)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select icing type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {icingTypes.map(icing => (
                                            <SelectItem key={icing} value={icing}>
                                              {icing}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="mb-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.cakeTiers.${tierIndex}.filling`}
                                render={({ field }) => (
                                  <FormItem>
                                    <div className="flex justify-between items-center">
                                      <FormLabel>Filling</FormLabel>
                                      {tierIndex > 0 && (
                                        <div className="flex items-center space-x-2">
                                          <Label htmlFor={`same-filling-${tierIndex}`} className="text-xs">Same as Tier 1</Label>
                                          <Switch 
                                            id={`same-filling-${tierIndex}`}
                                            checked={!!form.watch(`items.${index}.cakeTiers.${tierIndex}.sameFilling`)}
                                            onCheckedChange={(checked) => {
                                              form.setValue(`items.${index}.cakeTiers.${tierIndex}.sameFilling`, checked);
                                              if (checked) {
                                                // Copy filling from first tier
                                                const firstTierFilling = form.getValues(`items.${index}.cakeTiers.0.filling`);
                                                form.setValue(`items.${index}.cakeTiers.${tierIndex}.filling`, firstTierFilling);
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <FormControl>
                                      <Select 
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={tierIndex > 0 && form.watch(`items.${index}.cakeTiers.${tierIndex}.sameFilling`)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select filling" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {fillingTypes.map(filling => (
                                            <SelectItem key={filling} value={filling}>
                                              {filling}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Servings Calculator */}
                      <div className="mb-4 p-3 border border-gray-200 rounded-md">
                        <h5 className="font-medium mb-2">Servings Calculator</h5>
                        {/* Calculate estimated servings based on tier dimensions and portion size */}
                        {(() => {
                          const numberOfTiers = form.watch(`items.${index}.numberOfTiers`) || 1;
                          const tiers = form.watch(`items.${index}.cakeTiers`) || [];
                          const portionSizeValue = form.watch(`items.${index}.portionSize`) || 'regular';
                          
                          // Find the selected portion size multiplier
                          const portionSizeObj = portionSizes.find(p => p.value === portionSizeValue);
                          const multiplier = portionSizeObj ? portionSizeObj.servingsMultiplier : 1;
                          
                          // Calculate servings for each tier
                          let totalServings = 0;
                          const tierServings = tiers.slice(0, numberOfTiers).map((tier, i) => {
                            if (!tier) return 0;
                            
                            // Formula: (diameter/2)^2 * π * height / portion volume
                            // For a standard 1"x2" portion, we divide by 2 cubic inches
                            const radius = (tier.diameter || 6) / 2;
                            const height = tier.height || 4;
                            const volume = Math.PI * radius * radius * height;
                            const servings = Math.round(volume / 2 * multiplier);
                            
                            totalServings += servings;
                            return servings;
                          });
                          
                          return (
                            <div className="space-y-2">
                              {tierServings.map((servings, i) => (
                                <div key={i} className="flex justify-between">
                                  <span>Tier {i+1} ({tiers[i]?.diameter}″ × {tiers[i]?.height}″):</span>
                                  <span className="font-medium">{servings} servings</span>
                                </div>
                              ))}
                              <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="font-medium">Total Servings:</span>
                                <span className="font-bold">{totalServings} servings</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value));
                              updateItemPrice(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitPrice`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                              updateItemPrice(index);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Price</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Cutting instructions, structural information, allergies, etc."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jobSheetNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Sheet Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="This information is only displayed on the Job Sheet Printout."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="text-right text-sm text-gray-500">Setup / Delivery:</div>
            <div>
              <FormField
                control={form.control}
                name="setupFee"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    className="w-full text-right"
                  />
                )}
              />
            </div>
            <div className="text-right text-sm text-gray-500">Discount:</div>
            <div className="flex items-center">
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <Input
                    {...field}
                    type="number"
                    min="0"
                    className="w-16 text-right"
                  />
                )}
              />
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-16 ml-2">
                      <SelectValue placeholder="%" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value="$">$</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-right text-sm font-medium text-gray-700">Total:</div>
              <div className="text-right font-semibold">$ {totals.total}</div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Order"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OrderForm;
