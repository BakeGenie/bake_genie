import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterIcon, PlusIcon, SearchIcon, CalendarIcon, ListIcon } from "lucide-react";
import OrderForm from "@/components/order/order-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

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
  
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    preselectedDate ? new Date(preselectedDate) : null
  );
  
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  
  const [view, setView] = React.useState<string>("list");
  
  // View options
  const viewOptions = [
    { value: "list", label: "List View" },
  ];
  
  // Fetch orders
  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
  console.log("Orders from API:", rawOrders);
  
  // Transform backend data to frontend format
  const orders = React.useMemo(() => {
    return (Array.isArray(rawOrders) ? rawOrders : []).map((order: any) => ({
      id: order.id,
      userId: order.user_id,
      contactId: order.contact_id,
      orderNumber: order.order_number,
      eventType: order.event_type,
      eventDate: order.event_date,
      status: order.status,
      deliveryType: order.delivery_type,
      deliveryTime: order.delivery_time,
      total: order.total_amount,
      totalAmount: order.total_amount,
      amountPaid: order.amount_paid,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      contact: order.contact,
      items: order.items || [],
    }));
  }, [rawOrders]);
  
  // Filter orders for the current month/year
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order: any) => {
      if (!order.eventDate) return false;
      const orderDate = new Date(order.eventDate);
      return orderDate.getMonth() + 1 === month && 
             orderDate.getFullYear() === year;
    }).sort((a: any, b: any) => {
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
  }, [orders, month, year]);
  
  const handleOrderClick = (order: any) => {
    navigate(`/orders/${order.id}`);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const getMonthName = (monthNum: number): string => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1];
  };
  
  const closeNewOrderDialog = () => {
    setIsNewOrderDialogOpen(false);
    
    // Remove the query parameter from the URL
    if (shouldOpenNew) {
      navigate('/orders');
    }
  };
  
  const handleNewOrderSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Submit the order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      // Invalidate the orders query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      toast({
        title: 'Order created',
        description: 'The order has been created successfully.',
      });
      
      // Close the dialog
      closeNewOrderDialog();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Orders & Quotes"
        description="Manage your cake orders and quotes"
        actions={
          <>
            <Button
              onClick={() => setIsFilterDialogOpen(true)}
              variant="outline"
              size="icon"
            >
              <FilterIcon className="h-5 w-5" />
            </Button>
            <Button onClick={() => setIsNewOrderDialogOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </>
        }
      />
      
      {/* Tools and Views Selector */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              className="pl-9 w-60"
            />
          </div>
          
          {/* Month/Year Selector */}
          <div className="flex space-x-2">
            <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {getMonthName(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center border rounded-md p-1">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className="flex items-center space-x-1"
          >
            <ListIcon className="h-4 w-4" />
            <span>List</span>
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow overflow-hidden">
        {/* Order List */}
        <div className={`${view === 'list' ? 'md:col-span-3' : 'md:col-span-1'} bg-white rounded-md border shadow-sm overflow-hidden flex flex-col`}>
          <div className="flex-grow overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                <div className="text-gray-400 mb-2">
                  <FilterIcon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                <p className="text-gray-500 mt-1 max-w-sm">
                  No orders found for {getMonthName(month)} {year}. Try adjusting your filters or create a new order.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsNewOrderDialogOpen(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Order
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredOrders.map((order: any) => {
                  // Format the date
                  const orderDate = new Date(order.eventDate);
                  const formattedDate = format(orderDate, 'dd MMM yyyy');
                  const dayName = format(orderDate, 'EEE');
                  
                  // Format price
                  const price = parseFloat(order.totalAmount || '0').toFixed(2);
                  
                  // Determine status style
                  const isPaid = order.status === 'Paid';
                  const isCancelled = order.status === 'Cancelled';
                  
                  return (
                    <li 
                      key={order.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${isCancelled ? 'bg-gray-100' : ''}`}
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex justify-between">
                        <div className="flex space-x-3">
                          <div className="mt-1">
                            <div className={`w-3 h-3 rounded-full ${isCancelled ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                          </div>
                          
                          <div>
                            <div className="text-gray-500 text-sm">
                              #{order.orderNumber} - {dayName}, {formattedDate}
                            </div>
                            <div className="text-blue-600">
                              Contact #{order.contactId} <span className="text-gray-500">({order.eventType})</span>
                            </div>
                            <div className="text-gray-700 text-sm">
                              {order.notes || "No description available"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium">$ {price}</div>
                          <div className="mt-1">
                            <span className={
                              isCancelled 
                                ? "bg-gray-500 text-white text-xs px-2 py-0.5 rounded" 
                                : isPaid 
                                  ? "bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded" 
                                  : "bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                            }>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>
            Create a new order by filling out the form below.
          </DialogDescription>
          <OrderForm 
            onSubmit={handleNewOrderSubmit} 
            defaultValues={
              selectedDate 
                ? { eventDate: selectedDate, orderDate: new Date() } 
                : { eventDate: new Date() }
            }
          />
        </DialogContent>
      </Dialog>
      
      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogTitle>Filter Orders</DialogTitle>
          <DialogDescription>
            Apply filters to narrow down the orders list.
          </DialogDescription>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsFilterDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Apply Filters</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;