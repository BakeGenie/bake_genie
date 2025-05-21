import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { OrderWithItems } from "@/types";
import PageHeader from "@/components/ui/page-header";
import OrderCalendar from "@/components/order/order-calendar";
import OrderCard from "@/components/order/order-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import OrderForm from "@/components/order/order-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const Orders = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we should open the new order dialog
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const shouldOpenNew = searchParams.get('newOrder') === 'true';
  const preselectedDate = searchParams.get('date');
  
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = React.useState(shouldOpenNew);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [search, setSearch] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date>(
    preselectedDate ? new Date(preselectedDate) : new Date()
  );
  
  // Filter states
  const [showOrders, setShowOrders] = React.useState(true);
  const [showQuotes, setShowQuotes] = React.useState(true);
  const [showNoPayments, setShowNoPayments] = React.useState(true);
  const [showBookingPayments, setShowBookingPayments] = React.useState(true);
  const [showPartialPayments, setShowPartialPayments] = React.useState(true);
  const [showPaidInFull, setShowPaidInFull] = React.useState(true);
  const [showCompleted, setShowCompleted] = React.useState(true);
  const [showCancelled, setShowCancelled] = React.useState(true);
  
  // When the preselected date changes, update the selectedDate
  React.useEffect(() => {
    if (preselectedDate) {
      setSelectedDate(new Date(preselectedDate));
    }
  }, [preselectedDate]);
  
  // When dialog closes, update URL
  React.useEffect(() => {
    if (!isNewOrderDialogOpen && location.includes('newOrder=true')) {
      navigate('/orders');
    }
  }, [isNewOrderDialogOpen, location, navigate]);
  
  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
  // Handle order form submission
  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create order');
      }
      
      const order = await res.json();
      
      setIsNewOrderDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Order created successfully!',
      });
      
      navigate('/orders');
      
      // Invalidate orders query
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to reset all filters to their default state (all enabled)
  const resetAllFilters = () => {
    setShowOrders(true);
    setShowQuotes(true);
    setShowNoPayments(true);
    setShowBookingPayments(true);
    setShowPartialPayments(true);
    setShowPaidInFull(true);
    setShowCompleted(true);
    setShowCancelled(true);
  };
  
  // Filter orders based on filter states
  const filteredOrders = orders.filter((order: OrderWithItems) => {
    // Filter by order status (Order vs Quote)
    if (order.status === 'Quote' && !showQuotes) return false;
    if (order.status !== 'Quote' && !showOrders) return false;
    
    // Filter by payment status
    if (order.payment_status === 'No Payments' && !showNoPayments) return false;
    if (order.payment_status === 'Booking Payment' && !showBookingPayments) return false;
    if (order.payment_status === 'Partial Payment' && !showPartialPayments) return false;
    if (order.payment_status === 'Paid in Full' && !showPaidInFull) return false;
    
    // Filter by completion status
    if (order.status === 'Completed' && !showCompleted) return false;
    if (order.status === 'Cancelled' && !showCancelled) return false;
    
    // Filter by month and year if set
    if (month && year) {
      const orderDate = new Date(order.event_date);
      if (orderDate.getMonth() + 1 !== month || orderDate.getFullYear() !== year) {
        return false;
      }
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.customer?.toLowerCase().includes(searchLower) ||
        order.event_type?.toLowerCase().includes(searchLower) ||
        order.order_number?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Generate month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];
  
  // Generate year options (5 years back, 5 years ahead)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Store the selected date in localStorage
    localStorage.setItem('selectedDate', date.toISOString());
  };
  
  const handleOrderClick = (order: OrderWithItems) => {
    navigate(`/order/${order.id}`);
  };
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Orders & Quotes"
        actions={
          <div className="flex space-x-2">
            <Button onClick={() => {
              setIsFilterDialogOpen(true);
            }} 
              variant="outline" 
              className="flex items-center space-x-2"
            >
              <FilterIcon className="h-4 w-4" />
              <span>Filter Orders</span>
            </Button>
            <Button onClick={() => {
              // Store the current date in localStorage
              localStorage.setItem('selectedDate', new Date().toISOString());
              setIsNewOrderDialogOpen(true);
            }}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        }
      />
      
      <div className="border rounded-md mb-4 p-3 flex items-center space-x-4 bg-white">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders by customer, event type or order number"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={month.toString()}
            onValueChange={(value) => setMonth(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={year.toString()}
            onValueChange={(value) => setYear(parseInt(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-4">
        <div className="overflow-y-auto bg-white p-4 rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: OrderWithItems) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => handleOrderClick(order)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="mb-4">No orders found for the selected filters.</p>
              <Button onClick={resetAllFilters}>Reset Filters</Button>
            </div>
          )}
        </div>
        
        <div className="hidden lg:block bg-white p-4 rounded-md border">
          <h3 className="text-lg font-semibold mb-4">Order Calendar</h3>
          <OrderCalendar
            orders={orders}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>
      </div>
      
      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>
            Enter the details for the new order.
          </DialogDescription>
          <OrderForm 
            onSubmit={handleFormSubmit} 
            isSubmitting={isSubmitting}
            defaultValues={(() => {
              // Try to get the selected date from localStorage
              const storedDate = localStorage.getItem('selectedDate');
              
              if (storedDate) {
                try {
                  const date = new Date(storedDate);
                  if (!isNaN(date.getTime())) {
                    return { eventDate: date };
                  }
                } catch (e) {
                  // If parsing fails, ignore
                }
              }
              
              // Fall back to the URL parameter if localStorage is empty
              return preselectedDate ? { eventDate: new Date(preselectedDate) } : undefined;
            })()}
          />
        </DialogContent>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Change Order Filters</DialogTitle>
          <div className="space-y-3 py-3">
            {/* Order Type Filters */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="orders-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showOrders}
                  onChange={(e) => setShowOrders(e.target.checked)}
                />
                <label htmlFor="orders-filter" className="text-sm font-medium text-gray-700">
                  Orders
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="quotes-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showQuotes}
                  onChange={(e) => setShowQuotes(e.target.checked)}
                />
                <label htmlFor="quotes-filter" className="text-sm font-medium text-gray-700">
                  Quotes
                </label>
              </div>
            </div>
            
            {/* Payment Status Filters */}
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="no-payments-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showNoPayments}
                  onChange={(e) => setShowNoPayments(e.target.checked)}
                />
                <label htmlFor="no-payments-filter" className="text-sm font-medium text-gray-700">
                  Orders with No Payments
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="booking-payments-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showBookingPayments}
                  onChange={(e) => setShowBookingPayments(e.target.checked)}
                />
                <label htmlFor="booking-payments-filter" className="text-sm font-medium text-gray-700">
                  Orders with Booking Payments
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="partial-payments-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showPartialPayments}
                  onChange={(e) => setShowPartialPayments(e.target.checked)}
                />
                <label htmlFor="partial-payments-filter" className="text-sm font-medium text-gray-700">
                  Orders with Partial Payments
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paid-in-full-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showPaidInFull}
                  onChange={(e) => setShowPaidInFull(e.target.checked)}
                />
                <label htmlFor="paid-in-full-filter" className="text-sm font-medium text-gray-700">
                  Orders Paid in Full
                </label>
              </div>
            </div>
            
            {/* Order Status Filters */}
            <div className="space-y-2 border-t border-gray-200 pt-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="completed-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                />
                <label htmlFor="completed-filter" className="text-sm font-medium text-gray-700">
                  Completed Orders
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="cancelled-filter"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={showCancelled}
                  onChange={(e) => setShowCancelled(e.target.checked)}
                />
                <label htmlFor="cancelled-filter" className="text-sm font-medium text-gray-700">
                  Cancelled Orders
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                // Apply all filters and close dialog
                setIsFilterDialogOpen(false);
                
                // Show success toast
                toast({
                  title: "Filters Applied",
                  description: "Your order filters have been updated."
                });
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;