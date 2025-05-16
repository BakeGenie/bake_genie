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

// Define cake tier schema
const cakeTierSchema = z.object({
  diameter: z.coerce.number().min(4).max(30),
  height: z.coerce.number().min(2).max(12),
  flavor: z.string(),
  icing: z.string(),
  filling: z.string()
});

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
      unitPrice: z.coerce.number().min(0),
      price: z.coerce.number().min(0),
      notes: z.string().optional(),
      // Cake specific fields
      isCake: z.boolean().optional().default(false),
      portionSize: z.string().optional(),
      numberOfTiers: z.coerce.number().int().min(1).max(6).optional(),
      cakeTiers: z.array(cakeTierSchema).optional()
    })
  ),
});

interface OrderFormProps {
  initialData?: Partial<OrderFormData>;
  onSubmit: (data: OrderFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  // Load contacts for customer selection
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Form setup
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      userId: initialData.userId || 1,
      orderNumber: initialData.orderNumber || "",
      contactId: initialData.contactId || 0,
      eventType: initialData.eventType || "Birthday",
      eventDate: initialData.eventDate || new Date(),
      status: initialData.status || "Quote",
      theme: initialData.theme || "",
      deliveryType: initialData.deliveryType || "Pickup",
      deliveryDetails: initialData.deliveryDetails || "",
      discount: initialData.discount || 0,
      discountType: initialData.discountType || "%",
      setupFee: initialData.setupFee || 0,
      notes: initialData.notes || "",
      jobSheetNotes: initialData.jobSheetNotes || "",
      items: initialData.items?.length
        ? initialData.items
        : [
            {
              type: "Cake",
              name: "",
              quantity: 1,
              unitPrice: 0,
              price: 0,
              isCake: false,
              portionSize: "regular",
              numberOfTiers: 1,
              cakeTiers: [
                {
                  diameter: 6,
                  height: 4,
                  flavor: "Vanilla",
                  icing: "Buttercream",
                  filling: "None"
                }
              ]
            },
          ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Helper function to calculate total price
  const calculateTotal = () => {
    const items = form.getValues("items") || [];
    const subtotal = items.reduce((acc, item) => acc + item.price, 0);
    const discount = form.getValues("discount") || 0;
    const discountType = form.getValues("discountType") || "%";
    const setupFee = form.getValues("setupFee") || 0;

    let discountAmount = 0;
    if (discountType === "%") {
      discountAmount = subtotal * (discount / 100);
    } else {
      discountAmount = discount;
    }

    const total = subtotal - discountAmount + setupFee;
    return {
      subtotal,
      discountAmount,
      setupFee,
      total,
    };
  };

  const handleSubmit = (values: z.infer<typeof orderFormSchema>) => {
    // Calculate and add the total to the submitted data
    const totals = calculateTotal();
    onSubmit({
      ...values,
      total: parseFloat(totals.total.toFixed(2)),
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
      portionSize: "regular",
      numberOfTiers: 1,
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

  // Calculate serving size
  const calculateServings = (diameter: number, height: number, portionSizeValue: string = "regular") => {
    const portionSizeObj = portionSizes.find(p => p.value === portionSizeValue);
    const multiplier = portionSizeObj ? portionSizeObj.servingsMultiplier : 1;
    
    // Formula: (diameter/2)^2 * π * height / portion volume
    // For a standard 1"x2" portion, we divide by 2 cubic inches
    const radius = diameter / 2;
    const volume = Math.PI * radius * radius * height;
    return Math.round(volume / 2 * multiplier);
  };

  // Calculate the current totals
  const totals = calculateTotal();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Theme</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter event theme (optional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="deliveryDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Details</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter delivery details (e.g. address, time)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
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
                </div>

                {/* Cake configuration section - only visible when isCake is true */}
                {form.watch(`items.${index}.isCake`) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-4">Cake Configuration</h4>
                    
                    {/* Tier number and portion size controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.numberOfTiers`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Tiers</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(parseInt(value));
                                
                                // Current tiers
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
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select number of tiers" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 1 ? 'Tier' : 'Tiers'}
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
                        name={`items.${index}.portionSize`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Portion Size</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select portion size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {portionSizes.map(size => (
                                  <SelectItem key={size.value} value={size.value}>
                                    {size.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Tier configuration */}
                    <div className="space-y-4 mb-4">
                      <h5 className="font-medium">Tier Configuration</h5>
                      
                      {Array.from({ length: form.watch(`items.${index}.numberOfTiers`) || 1 }).map((_, tierIndex) => (
                        <Card key={tierIndex} className="p-4">
                          <h6 className="font-medium mb-3">Tier {tierIndex + 1}</h6>
                          
                          {/* Tier dimensions */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
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
                          
                          {/* Flavor selection */}
                          <div className="mb-4">
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
                                          checked={form.watch(`items.${index}.cakeTiers.${tierIndex}.sameFlavor`) || false}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              const firstTierFlavor = form.getValues(`items.${index}.cakeTiers.0.flavor`);
                                              form.setValue(`items.${index}.cakeTiers.${tierIndex}.flavor`, firstTierFlavor);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select cake flavor" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {cakeFlavors.map(flavor => (
                                        <SelectItem key={flavor} value={flavor}>
                                          {flavor}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* Icing selection */}
                          <div className="mb-4">
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
                                          checked={form.watch(`items.${index}.cakeTiers.${tierIndex}.sameIcing`) || false}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              const firstTierIcing = form.getValues(`items.${index}.cakeTiers.0.icing`);
                                              form.setValue(`items.${index}.cakeTiers.${tierIndex}.icing`, firstTierIcing);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select icing type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {icingTypes.map(icing => (
                                        <SelectItem key={icing} value={icing}>
                                          {icing}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* Filling selection */}
                          <div className="mb-4">
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
                                          checked={form.watch(`items.${index}.cakeTiers.${tierIndex}.sameFilling`) || false}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              const firstTierFilling = form.getValues(`items.${index}.cakeTiers.0.filling`);
                                              form.setValue(`items.${index}.cakeTiers.${tierIndex}.filling`, firstTierFilling);
                                            }
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <Select 
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select filling" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {fillingTypes.map(filling => (
                                        <SelectItem key={filling} value={filling}>
                                          {filling}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* Show estimated servings for this tier */}
                          <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                            <span className="text-sm">Estimated Servings:</span>
                            <span className="font-medium">
                              {calculateServings(
                                form.watch(`items.${index}.cakeTiers.${tierIndex}.diameter`) || 6,
                                form.watch(`items.${index}.cakeTiers.${tierIndex}.height`) || 4,
                                form.watch(`items.${index}.portionSize`)
                              )} servings
                            </span>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Show total servings across all tiers */}
                    <div className="p-3 border border-gray-200 rounded-md mb-3 bg-white">
                      <h5 className="font-medium mb-2">Total Servings</h5>
                      <div className="font-medium text-lg text-center">
                        {Array.from({ length: form.watch(`items.${index}.numberOfTiers`) || 1 }).reduce((total, _, tierIndex) => {
                          const tierServings = calculateServings(
                            form.watch(`items.${index}.cakeTiers.${tierIndex}.diameter`) || 6,
                            form.watch(`items.${index}.cakeTiers.${tierIndex}.height`) || 4,
                            form.watch(`items.${index}.portionSize`)
                          );
                          return total + tierServings;
                        }, 0)} servings
                      </div>
                    </div>
                  </div>
                )}

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
                              const quantity = parseInt(e.target.value);
                              field.onChange(quantity);
                              
                              // Automatically update price based on quantity and unit price
                              const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0;
                              form.setValue(
                                `items.${index}.price`,
                                quantity * unitPrice
                              );
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
                        <FormLabel>Unit Price ($)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            step="0.01"
                            onChange={(e) => {
                              const unitPrice = parseFloat(e.target.value);
                              field.onChange(unitPrice);
                              
                              // Automatically update price based on quantity and unit price
                              const quantity = form.getValues(`items.${index}.quantity`) || 0;
                              form.setValue(
                                `items.${index}.price`,
                                quantity * unitPrice
                              );
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
                        <FormLabel>Total Price ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" step="0.01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Notes</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter any notes about the order"
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

        {/* Price Details - Moved to bottom as requested */}
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
              <div className="text-right font-semibold">$ {totals.total.toFixed(2)}</div>
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