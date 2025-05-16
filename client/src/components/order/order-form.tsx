import React from "react";
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
                      variant="outline" 
                      size="sm"
                      className="text-xs"
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
