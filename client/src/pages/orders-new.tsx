import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
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
  
  // Fetch orders directly
  const { data, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  console.log("Raw API response orders:", data);
  
  // Handle order form submission
  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
  
  // Filter and prepare the orders for display
  const filteredOrders = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter((order: any) => {
        // Always filter by month and year first
        const orderDate = new Date(order.event_date);
        if (orderDate.getMonth() + 1 !== month || orderDate.getFullYear() !== year) {
          return false;
        }
        
        // Filter by order status (Order vs Quote)
        if (order.status === 'Quote' && !showQuotes) return false;
        if (order.status !== 'Quote' && !showOrders) return false;
        
        // Filter by payment status
        const amountPaid = parseFloat(order.amount_paid || '0');
        const totalAmount = parseFloat(order.total_amount || '0');
        
        let paymentStatus = 'No Payments';
        if (amountPaid > 0 && amountPaid < totalAmount) {
          paymentStatus = 'Partial Payment';
        } else if (amountPaid > 0 && amountPaid === totalAmount) {
          paymentStatus = 'Paid in Full';
        }
        
        if (paymentStatus === 'No Payments' && !showNoPayments) return false;
        if (paymentStatus === 'Booking Payment' && !showBookingPayments) return false;
        if (paymentStatus === 'Partial Payment' && !showPartialPayments) return false;
        if (paymentStatus === 'Paid in Full' && !showPaidInFull) return false;
        
        // Filter by completion status
        if (order.status === 'Completed' && !showCompleted) return false;
        if (order.status === 'Cancelled' && !showCancelled) return false;
        
        // Filter by search term
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch = (
            (order.order_number && order.order_number.toLowerCase().includes(searchLower)) ||
            (order.event_type && order.event_type.toLowerCase().includes(searchLower))
          );
          
          if (!matchesSearch) return false;
        }
        
        return true;
      })
      .sort((a: any, b: any) => {
        // Sort by event date
        const dateA = new Date(a.event_date);
        const dateB = new Date(b.event_date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [data, month, year, showQuotes, showOrders, showNoPayments, showBookingPayments, 
      showPartialPayments, showPaidInFull, showCompleted, showCancelled, search]);
  
  console.log("Filtered orders:", filteredOrders);
  
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
  
  const handleOrderClick = (order: any) => {
    navigate(`/orders/${order.id}`);
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
              // Store the selected date (or current date if none selected) in localStorage
              const dateToUse = selectedDate || new Date();
              localStorage.setItem('selectedDate', dateToUse.toISOString());
              console.log('Date passed to New Order:', dateToUse.toISOString());
              setIsNewOrderDialogOpen(true);
            }} className="bg-blue-500 hover:bg-blue-600">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        }
      />
      
      {/* Order Period and Filter Controls */}
      <div className="bg-white rounded-md border shadow-sm mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Order Period:</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Select
                value={month.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger className="w-36">
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
                <SelectTrigger className="w-28">
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
          
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders by event type or order number"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Orders List */}
      <div className="flex-1 bg-white rounded-md border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : !filteredOrders.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="mb-4">No orders found for the selected filters.</p>
            <Button onClick={resetAllFilters} variant="outline">Reset Filters</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order: any) => {
              // Format date nicely
              const orderDate = new Date(order.event_date);
              const dayName = orderDate.toLocaleString('default', { weekday: 'short' });
              const dayNum = orderDate.getDate();
              const monthName = orderDate.toLocaleString('default', { month: 'short' });
              const yearNum = orderDate.getFullYear();
              
              // Format price
              const price = parseFloat(order.total_amount || '0').toFixed(2);
              
              // Determine status badge class
              const isPaid = order.status === 'Paid';
              const isCancelled = order.status === 'Cancelled';
              
              const statusBadgeClass = isCancelled 
                ? "bg-gray-500 text-white text-xs px-2 py-1 rounded" 
                : isPaid 
                  ? "bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded" 
                  : "bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded";
              
              return (
                <div 
                  key={order.id} 
                  className={`p-4 hover:bg-gray-50 cursor-pointer flex justify-between ${isCancelled ? 'bg-gray-100' : ''}`}
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {isCancelled ? (
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      )}
                    </div>
                    
                    <div>
                      <div className="text-gray-500 text-sm">
                        #{order.order_number} - {dayName}, {dayNum} {monthName} {yearNum}
                      </div>
                      <div className="text-blue-600">
                        Contact #{order.contact_id} <span className="text-gray-500">({order.event_type})</span>
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        {order.notes || "No description available"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="font-medium">$ {price}</div>
                    <div className="mt-1">
                      <span className={statusBadgeClass}>{order.status}</span>
                    </div>
                    <div className="flex mt-1">
                      <button className="text-gray-400 hover:text-gray-600 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                          <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>
            Enter the details for the new order.
          </DialogDescription>
          <div className="overflow-y-auto pr-1 flex-1">
            <OrderForm 
              onSubmit={handleFormSubmit} 
              initialValues={(() => {
                // Try to get the selected date from localStorage
                const storedDate = localStorage.getItem('selectedDate');
                
                if (storedDate) {
                  try {
                    const date = new Date(storedDate);
                    if (!isNaN(date.getTime())) {
                      console.log('Setting form default dates from stored date:', date);
                      return { 
                        eventDate: date,
                        orderDate: date 
                      };
                    }
                  } catch (e) {
                    // If parsing fails, ignore
                  }
                }
                
                // Fall back to the URL parameter if localStorage is empty
                return preselectedDate ? { eventDate: new Date(preselectedDate) } : undefined;
              })()}
            />
          </div>
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
            
            {/* Status Filters */}
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
          
          <div className="flex justify-between pt-3">
            <Button variant="outline" onClick={resetAllFilters}>
              Reset Filters
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;