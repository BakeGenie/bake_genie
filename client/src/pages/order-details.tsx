import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import {
  ChevronLeftIcon,
  UploadIcon,
  DownloadIcon,
  CalendarIcon,
  InfoIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Edit2Icon,
  X,
  Check,
  DollarSign,
  FileText,
  Mail,
  Calendar,
} from "lucide-react";
import { FormatCurrency } from "@/components/ui/format-currency";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Order Log History component
interface OrderLogHistoryProps {
  orderId: string | number;
}

const OrderLogHistory: React.FC<OrderLogHistoryProps> = ({ orderId }) => {
  // Fetch order logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}/logs`],
    enabled: !!orderId,
  });

  // Fetch order details for event info
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  const isLoading = logsLoading || orderLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="grid grid-cols-2 bg-gray-50 p-3 border-b">
          <div className="font-medium text-sm">Date</div>
          <div className="font-medium text-sm">Action</div>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center text-gray-500">
          <p>No history available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log: any) => (
        <div key={log.id} className="border-b pb-2">
          <div className="text-sm">
            <span className="font-medium">
              {format(new Date(log.createdAt), "EEE, dd MMM yyyy")}
              <span className="text-gray-700"> ({log.action || "Note"})</span>
            </span>
            {log.details && (
              <span className="text-gray-600 ml-1">{log.details}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Created by: {log.creatorName || "System"}
          </div>
        </div>
      ))}
    </div>
  );
};

// Payment form schema
const PaymentFormSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  method: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
});

// Task form schema
const TaskFormSchema = z.object({
  description: z.string().min(1, "Task description is required"),
  dueDate: z.string().optional(),
  priority: z.string().optional(),
});

// Note form schema
const NoteFormSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

// Email form schema
const EmailFormSchema = z.object({
  recipient: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  attachInvoice: z.boolean().optional(),
});

// Payment Modal Component
const PaymentModal = ({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: any) => void }) => {
  const form = useForm<z.infer<typeof PaymentFormSchema>>({
    resolver: zodResolver(PaymentFormSchema),
    defaultValues: {
      amount: "",
      method: "credit_card",
      reference: "",
      notes: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = (data: z.infer<typeof PaymentFormSchema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
          <DialogDescription>
            Enter the payment details below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5">$</span>
                      <Input className="pl-7" placeholder="0.00" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Transaction ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Payment</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Task Modal Component
const TaskModal = ({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: any) => void }) => {
  const form = useForm<z.infer<typeof TaskFormSchema>>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      description: "",
      dueDate: new Date().toISOString().split('T')[0],
      priority: "medium",
    },
  });

  const handleSubmit = (data: z.infer<typeof TaskFormSchema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            Add a new task for this order.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Confirm delivery details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Note Modal Component
const NoteModal = ({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: any) => void }) => {
  const form = useForm<z.infer<typeof NoteFormSchema>>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof NoteFormSchema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note to the order log.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your note here" {...field} className="min-h-[120px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Note</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Email Modal Component
const EmailModal = ({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (data: any) => void }) => {
  const form = useForm<z.infer<typeof EmailFormSchema>>({
    resolver: zodResolver(EmailFormSchema),
    defaultValues: {
      recipient: "",
      subject: "Your Order Details",
      message: "Please find attached your order details.",
      attachInvoice: true,
    },
  });

  const handleSubmit = (data: z.infer<typeof EmailFormSchema>) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send an email regarding this order.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Email subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your message" {...field} className="min-h-[150px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachInvoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Attach Invoice</FormLabel>
                    <FormDescription>
                      Attach an invoice PDF to this email
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Send Email</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const OrderDetails: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("details");

  // States for modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Function to refetch order logs
  const refetchLogs = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}/logs`] });
  };
  
  // Function to add payment
  const handleAddPayment = async (paymentData: any) => {
    try {
      const response = await fetch(`/api/orders/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add payment');
      }
      
      toast({
        title: "Payment added",
        description: "Payment has been added successfully",
      });
      
      // Refetch order data and logs
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      refetchLogs();
      setIsPaymentModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment",
        variant: "destructive",
      });
    }
  };
  
  // Function to add task
  const handleAddTask = async (taskData: any) => {
    try {
      const response = await fetch(`/api/orders/${id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add task');
      }
      
      toast({
        title: "Task added",
        description: "Task has been added successfully",
      });
      
      // Refetch order data
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${id}`] });
      setIsTaskModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };
  
  // Function to add note
  const handleAddNote = async (noteData: any) => {
    try {
      const response = await fetch(`/api/orders/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add note');
      }
      
      toast({
        title: "Note added",
        description: "Note has been added successfully",
      });
      
      // Refetch order logs
      refetchLogs();
      setIsNoteModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };
  
  // Function to generate invoice
  const generateInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${id}/invoice`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${order.orderNumber || id}.pdf`;
      
      // Append the link to the body
      document.body.appendChild(link);
      
      // Click the link
      link.click();
      
      // Remove the link
      document.body.removeChild(link);
      
      toast({
        title: "Invoice generated",
        description: "Invoice has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };
  
  // Function to generate job sheet
  const generateJobSheet = async () => {
    try {
      const response = await fetch(`/api/orders/${id}/jobsheet`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate job sheet');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `JobSheet-${order.orderNumber || id}.pdf`;
      
      // Append the link to the body
      document.body.appendChild(link);
      
      // Click the link
      link.click();
      
      // Remove the link
      document.body.removeChild(link);
      
      toast({
        title: "Job sheet generated",
        description: "Job sheet has been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate job sheet",
        variant: "destructive",
      });
    }
  };
  
  // Function to send email
  const sendEmail = async (emailData: any) => {
    try {
      const response = await fetch(`/api/orders/${id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      toast({
        title: "Email sent",
        description: "Email has been sent successfully",
      });
      
      // Refetch order logs
      refetchLogs();
      setIsEmailModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  // Fetch contact information for the order
  const { data: contactData } = useQuery<any>({
    queryKey: ["/api/contacts"],
    staleTime: 60000,
  });

  // Fetch order details from API
  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: [`/api/orders/${id}`],
    enabled: !!id,
  });

  // Process order data with contact information
  const order = React.useMemo(() => {
    if (!orderData) return {};

    // Make a deep copy to avoid mutation issues
    const processedOrder = JSON.parse(JSON.stringify(orderData));

    // If order has contactId but no contact object, find contact from contacts list
    if (processedOrder.contact_id && !processedOrder.contact && contactData) {
      const contactInfo = contactData.find(
        (c: any) => c.id === processedOrder.contact_id,
      );
      if (contactInfo) {
        processedOrder.contact = contactInfo;
      }
    }

    // Convert snake_case to camelCase for frontend components if needed
    if (processedOrder.order_number && !processedOrder.orderNumber) {
      processedOrder.orderNumber = processedOrder.order_number;
    }

    if (processedOrder.event_type && !processedOrder.eventType) {
      processedOrder.eventType = processedOrder.event_type;
    }

    if (processedOrder.event_date && !processedOrder.eventDate) {
      processedOrder.eventDate = processedOrder.event_date;
    }

    if (processedOrder.delivery_type && !processedOrder.deliveryType) {
      processedOrder.deliveryType = processedOrder.delivery_type;
    }

    if (processedOrder.delivery_fee && !processedOrder.deliveryFee) {
      processedOrder.deliveryFee = processedOrder.delivery_fee;
    }

    if (processedOrder.total_amount && !processedOrder.totalAmount) {
      processedOrder.totalAmount = processedOrder.total_amount;
    }

    console.log("Processed order data:", processedOrder);
    return processedOrder;
  }, [orderData, contactData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <InfoIcon className="w-12 h-12 text-red-500" />
        <h1 className="text-2xl font-bold">Error Loading Order</h1>
        <p className="text-gray-600">Unable to load order details</p>
        <Button onClick={() => setLocation("/orders")}>Return to Orders</Button>
      </div>
    );
  }

  // Function to format date
  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), "EEE, dd MMM yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
      case "quote":
        return <Badge variant="secondary">Quote</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isQuote =
    order.status === "Quote" ||
    (order.orderNumber && order.orderNumber.startsWith("Q"));
  const orderPrefix = isQuote ? "Quote" : "Order";
  const orderNum = isQuote
    ? order.orderNumber?.replace(/^Q/, "")
    : order.orderNumber;

  // Calculate totals
  const subtotal =
    order.items?.reduce(
      (sum: number, item: any) =>
        sum + parseFloat(item.price) * (item.quantity || 1),
      0,
    ) || 0;

  const discount = parseFloat(order.discount) || 0;
  const discountType = order.discountType || "%";
  const discountAmount =
    discountType === "%" ? (subtotal * discount) / 100 : discount;

  const setupFee = parseFloat(order.setupFee) || 0;
  const deliveryFee = parseFloat(order.deliveryFee) || 0;
  const taxRate = parseFloat(order.taxRate) || 0;
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);

  const totalAmount =
    subtotal - discountAmount + setupFee + deliveryFee + taxAmount;

  return (
    <div className="container mx-auto pb-4 max-w-6xl">
      <div className="flex items-center py-3 bg-white shadow-sm ">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/orders")}
          className="mr-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">
            <Edit2Icon className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      <div className="mx-16 my-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
          {/* Event Details Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Order #:</span>
                <span>{orderNum || "21"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span>Order</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <Link
                  href={`/contacts/${order.contact?.id}`}
                  className="text-blue-500 hover:underline"
                >
                  Texas and District Kindergarten c/o Debbie Bradfield
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date:</span>
                <span>Tue, 06 May 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Event:</span>
                <div className="flex items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-500 mr-1.5"></span>
                  <span>Corporate</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Theme:</span>
                <span>Slices for PD Day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <Badge className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-md">
                  Partial
                </Badge>
              </div>
            </div>
          </div>

          {/* Delivery Card */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">
              Delivery / Collection
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Order to be:</span>
                <span>Delivered to Kindy</span>
              </div>
              <div className="mt-4">
                <h3 className="text-base text-gray-500 mb-2">Image Uploads</h3>
                <div className="flex flex-wrap gap-2">
                  {/* Image upload thumbnails would go here */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items Section */}
        <div className="bg-white rounded-lg shadow-sm mt-6">
          <h2 className="text-lg font-semibold p-6 pb-2">Order</h2>
          <div className="w-full">
            {/* Item 1 */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-blue-500 mb-1">Item</div>
                  <div>1 x Chocolate Butterscotch Slice</div>
                  <div className="text-sm text-gray-500">
                    Details: 20 serves
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-4">$ 30.00</div>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="border-t border-gray-100 p-4">
              <div className="flex justify-between">
                <div>
                  <div className="text-blue-500 mb-1">Item</div>
                  <div>1 x Lemon Brownie</div>
                  <div className="text-sm text-gray-500">
                    Details: 15 serves
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-4">$ 30.00</div>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 p-4">
              <div className="space-y-1 text-right ml-32">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>$ 60.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span>- $ 12.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Setup / Delivery:</span>
                  <span>$ 0.00</span>
                </div>
                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>$ 48.00</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Outstanding Amount:</span>
                  <span>$ 1.00</span>
                </div>

                {/* Profit Section */}
                <div className="flex justify-between mt-4">
                  <span className="text-gray-600">Gross Profit:</span>
                  <span>$ 48.00</span>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-left">
                  <span className="inline-flex items-center">
                    <InfoIcon className="h-3 w-3 mr-1" />
                    Your profit amount is not included in any print outs or
                    PDFs.
                  </span>
                  <div>
                    <a
                      href="#"
                      className="text-blue-500 hover:underline text-xs"
                    >
                      How is this calculated?
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr />
          {/* Action Buttons */}
          <div className="w-full flex justify-content-between p-4">
            <div className="flex ">
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Email
              </Button>
            </div>
            <div className="ml-auto">
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Add Payment
              </Button>
            </div>
          </div>
        </div>
        {/* Scheduled Payments Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Scheduled Payments</h2>
            <Button
              size="sm"
              className="bg-blue-500 text-white hover:bg-blue-600 h-8 px-3"
            >
              + Add
            </Button>
          </div>

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-gray-400 mb-2">
              <InfoIcon className="h-5 w-5" />
            </div>
            <p className="text-gray-500 text-sm">
              You have no scheduled payments for this order
            </p>
          </div>
        </div>

        {/* General Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <h2 className="text-lg font-semibold mb-4">General Information</h2>
          <div className="min-h-[80px]"></div>
        </div>

        {/* Job Sheet Details and Order Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Job Sheet Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Job Sheet Details</h2>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 flex items-center"
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Job Sheet
              </Button>
            </div>
            <div className="min-h-[100px]"></div>
          </div>

          {/* Order Tasks */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Order Tasks</h2>
              <Button
                size="sm"
                className="bg-blue-500 text-white hover:bg-blue-600 h-8 px-3"
              >
                + Add
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4"
                  id="task342542"
                />
                <label htmlFor="task342542" className="text-sm">
                  342542
                </label>
              </div>
              <div className="flex space-x-2">
                <button className="text-gray-400 hover:text-gray-600">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button className="text-gray-400 hover:text-gray-600">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Log */}
        <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Order Log</h2>
            <Button
              size="sm"
              className="bg-blue-500 text-white hover:bg-blue-600 h-8 px-3"
            >
              + Add Note
            </Button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-sm font-medium text-gray-500 w-44">
                  Date
                </th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">
                  Action
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-sm">Fri, 23 May 2025 - 00:57am</td>
                <td className="py-3 text-sm">
                  Partial Payment - $8.00 -{" "}
                  <a href="#" className="text-blue-500">
                    Payment Receipt
                  </a>
                </td>
                <td className="py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-sm">Fri, 23 May 2025 - 00:56am</td>
                <td className="py-3 text-sm">
                  Partial Payment - $34.00 -{" "}
                  <a href="#" className="text-blue-500">
                    Payment Receipt
                  </a>
                </td>
                <td className="py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-sm">Fri, 23 May 2025 - 00:56am</td>
                <td className="py-3 text-sm">
                  Booking Fee - $5.00 -{" "}
                  <a href="#" className="text-blue-500">
                    Payment Receipt
                  </a>
                </td>
                <td className="py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-sm">Fri, 23 May 2025 - 00:55am</td>
                <td className="py-3 text-sm">
                  Email Sent - Recipient: darkhorse950113@gmail.com
                </td>
                <td className="py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-sm">Thu, 08 May 2025 - 08:46am</td>
                <td className="py-3 text-sm">
                  Email Sent - Recipient: kidsone@bigpond.com
                </td>
                <td className="py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-3 text-sm">Thu, 08 May 2025 - 08:45am</td>
                <td className="py-3 text-sm">Order Created</td>
                <td className="py-3 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-8">
          <Tabs defaultValue="payments" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="payments">Scheduled Payments</TabsTrigger>
              <TabsTrigger value="info">General Information</TabsTrigger>
              <TabsTrigger value="jobsheet">Job Sheet Details</TabsTrigger>
              <TabsTrigger value="tasks">Order Tasks</TabsTrigger>
              <TabsTrigger value="log">Order Log</TabsTrigger>
            </TabsList>

            <TabsContent value="payments">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <InfoIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p>You have no scheduled payments for this order</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">
                          {order.contact?.firstName} {order.contact?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {order.contact?.phone || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {order.contact?.email || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {order.contact?.address || "-"}
                        </p>
                      </div>
                    </div>

                    {order.notes && (
                      <>
                        <h3 className="font-medium mt-6">Order Notes</h3>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm">{order.notes}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobsheet">
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <h3 className="font-medium">Job Sheet</h3>
                  <Button variant="outline">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Job Sheet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Tasks</h3>
                    <Button size="sm">
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <div className="rounded-full bg-gray-100 p-3 mb-4">
                      <InfoIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <p>You have no tasks created for this order</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="log">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Order Log</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Call the API to add a note
                        const action = "Note Added";
                        const details = prompt("Enter note details");
                        if (details) {
                          fetch(`/api/orders/${id}/logs`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action, details }),
                          }).then((res) => {
                            if (res.ok) {
                              toast({
                                title: "Note added",
                                description:
                                  "Your note has been added to the order log",
                              });
                              // Refresh logs
                              refetchLogs();
                            }
                          });
                        }
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  </div>

                  {/* Fetch the actual logs from the database */}
                  <OrderLogHistory orderId={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
