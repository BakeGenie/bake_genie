import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { OrderWithItems } from "@/types";
import PageHeader from "@/components/ui/page-header";
import OrderCalendar from "@/components/order/order-calendar";
import OrderCard from "@/components/order/order-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InvoicePreviewButton } from "@/components/ui/invoice-preview-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import OrderForm from "@/components/order/order-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { OrderFormData } from "@/types";

const Orders = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we should open the new order dialog
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const shouldOpenNew = searchParams.get('newOrder') === 'true';
  const preselectedDate = searchParams.get('date');
  
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = React.useState(shouldOpenNew);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [search, setSearch] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    preselectedDate ? new Date(preselectedDate) : new Date()
  );

  // Update the calendar month when dropdown changes
  React.useEffect(() => {
    // Create a date object for the first day of the selected month and year
    const calendarDate = new Date(year, month - 1, 1);
    // We need to force rerender the calendar with the new month
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('month', month.toString());
    urlParams.set('year', year.toString());
    
    // Only update URL if not already there to avoid navigation loops
    if (location.split('?')[1] !== urlParams.toString()) {
      navigate(`?${urlParams.toString()}`, { replace: true });
    }
  }, [month, year]);

  // Fetch orders data
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", { month, year, search }],
    onSuccess: () => {
      // Reset selected date when month or year changes
      setSelectedDate(undefined);
    }
  });

  // Enhanced filtering: Combine date filtering with search term filtering
  const filteredOrders = React.useMemo(() => {
    // Start with all orders
    let filtered = orders;
    
    // Apply date filter if a date is selected
    if (selectedDate) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.eventDate);
        return (
          orderDate.getDate() === selectedDate.getDate() &&
          orderDate.getMonth() === selectedDate.getMonth() &&
          orderDate.getFullYear() === selectedDate.getFullYear()
        );
      });
    }
    
    // Apply search term filter if search is entered
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(order => {
        // Search in order number
        if (order.orderNumber.toLowerCase().includes(searchLower)) return true;
        
        // Search in customer name
        const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.toLowerCase();
        if (customerName.includes(searchLower)) return true;
        
        // Search in event type
        if (order.eventType?.toLowerCase().includes(searchLower)) return true;
        
        // Search in theme
        if (order.theme?.toLowerCase().includes(searchLower)) return true;
        
        // Search in delivery details
        if (order.deliveryDetails?.toLowerCase().includes(searchLower)) return true;
        
        // Search in order status
        if (order.status.toLowerCase().includes(searchLower)) return true;
        
        // Search in order notes
        if (order.notes?.toLowerCase().includes(searchLower)) return true;
        
        // Search in order items
        if (order.items && order.items.length > 0) {
          return order.items.some(item => 
            item.description?.toLowerCase().includes(searchLower) ||
            item.productName?.toLowerCase().includes(searchLower)
          );
        }
        
        return false;
      });
    }
    
    return filtered;
  }, [orders, selectedDate, search]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle order click to navigate to order details
  const handleOrderClick = (order: OrderWithItems) => {
    navigate(`/orders/${order.id}`);
  };

  // Handle new order submission
  const handleNewOrderSubmit = async (data: any) => { // Use any temporarily to work around type issues
    setIsSubmitting(true);
    
    try {
      console.log("Submitting order data from orders page:", data);
      
      // Generate order number (normally this would be done on the server)
      const orderNumber = `O${Math.floor(Math.random() * 10000)}`;
      
      // Convert Date objects to strings to avoid type issues
      const formattedData = {
        ...data,
        orderNumber,
        userId: 1, // In a real app, this would be the current user's ID
        contactId: data.contactId || 12, // Default to a known contact if not provided
        status: data.status || "Quote",
        // Convert Date objects to ISO strings
        eventDate: data.eventDate instanceof Date ? data.eventDate.toISOString() : data.eventDate,
        orderDate: data.orderDate instanceof Date ? data.orderDate.toISOString() : data.orderDate,
        deliveryDate: data.deliveryDate instanceof Date ? data.deliveryDate.toISOString() : data.deliveryDate,
        // Ensure items are properly formatted
        items: Array.isArray(data.items) ? data.items.map((item: any) => ({
          ...item,
          description: item.description || 'Product',
          price: typeof item.price === 'number' ? item.price.toString() : (item.price || '0'),
          quantity: item.quantity || 1
        })) : []
      };
      
      // Log full data for debugging
      console.log("Sending to server:", JSON.stringify(formattedData, null, 2));
      
      const response = await apiRequest("POST", "/api/orders", formattedData);
      
      const newOrder = await response.json();
      
      // Invalidate orders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Close dialog and show success message
      setIsNewOrderDialogOpen(false);
      
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

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Generate year options (5 years back, 5 years ahead)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Orders & Quotes"
        actions={
          <div className="flex space-x-2">
            <Button onClick={() => {
              // Store the selected date in localStorage if available
              if (selectedDate) {
                // Create a new date with time set to noon to avoid timezone issues
                const dateToStore = new Date(selectedDate);
                dateToStore.setHours(12, 0, 0, 0);
                console.log("Orders: Storing selected date for new order:", dateToStore.toISOString());
                localStorage.setItem('pendingEventDate', dateToStore.toISOString());
              }
              setIsNewOrderDialogOpen(true);
            }}>
              <PlusIcon className="h-4 w-4 mr-2" /> New Order
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel (Order List) */}
        <div className="flex-1 overflow-y-auto border-r border-gray-200">
          {/* Order List Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="relative mr-2">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search"
                  className="pl-9 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {/* Add filter here */}
              <Button variant="outline" size="icon">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <OrderCalendar
            orders={orders}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            month={month}
            year={year}
          />

          {/* Order List */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredOrders.length} orders found
            </div>
            <Button variant="outline" size="sm">
              <FilterIcon className="h-4 w-4 mr-2" /> Filter Orders
            </Button>
          </div>

          {/* Order Items */}
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4 animate-pulse">
                  <div className="flex">
                    <div className="h-10 w-10 bg-gray-200 rounded mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredOrders.length > 0 ? (
              // Orders list
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => handleOrderClick(order)}
                  onEmailClick={(e) => {
                    e.stopPropagation();
                    toast({
                      title: "Email Feature",
                      description: "Email functionality will be implemented soon.",
                    });
                  }}
                  onDownloadClick={(e) => {
                    e.stopPropagation();
                    toast({
                      title: "Download Feature",
                      description: "Download functionality will be implemented soon.",
                    });
                  }}
                />
              ))
            ) : (
              // Empty state
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setSelectedDate(new Date());
                  }}
                >
                  Reset filters
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel (Task List) - Hidden on mobile */}
        <div className="w-72 hidden lg:block bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Task List</h2>
            <Button variant="ghost" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
          <div className="p-8 flex flex-col items-center justify-center text-center h-48">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">You have no tasks created</p>
          </div>
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>Create a new order or quote for a customer</DialogDescription>
          <div className="p-6">
            <OrderForm
              onSubmit={handleNewOrderSubmit}
              initialValues={(() => {
                // First check localStorage for a date from the calendar
                const storedEventDate = localStorage.getItem('pendingEventDate');
                
                if (storedEventDate) {
                  // Use the stored event date from localStorage with time set to noon
                  const selectedDate = new Date(storedEventDate);
                  // Ensure consistent time to avoid timezone issues
                  selectedDate.setHours(12, 0, 0, 0);
                  console.log("Orders dialog: Using stored event date:", selectedDate);
                  
                  // Clear localStorage since we're using it now
                  localStorage.removeItem('pendingEventDate');
                  
                  return { eventDate: selectedDate };
                }
                
                // Fall back to the URL parameter if localStorage is empty
                return preselectedDate ? { eventDate: new Date(preselectedDate) } : undefined;
              })()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
