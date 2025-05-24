import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SearchIcon, PlusIcon, FilterIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import OrderForm from "@/components/order/order-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";

const Orders = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Check if we should open the new order dialog
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const shouldOpenNew = searchParams.get("newOrder") === "true";
  const preselectedDate = searchParams.get("date");

  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = React.useState(shouldOpenNew);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    preselectedDate ? new Date(preselectedDate) : null,
  );

  // Fetch orders
  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Transform backend data to frontend format and filter to current month
  const orders = React.useMemo(() => {
    console.log("Raw orders from API:", rawOrders);
    
    const transformedOrders = (Array.isArray(rawOrders) ? rawOrders : []).map((order: any) => ({
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

    // Filter to current month only
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const filteredOrders = transformedOrders.filter(order => {
      if (!order.eventDate) return false;
      try {
        const orderDate = new Date(order.eventDate);
        const isCurrentMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        return isCurrentMonth;
      } catch (error) {
        console.warn("Invalid date found:", order.eventDate, "for order:", order.id);
        return false;
      }
    });

    console.log("Filtered orders for current month:", filteredOrders);
    return filteredOrders;
  }, [rawOrders, currentDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const closeNewOrderDialog = () => {
    setIsNewOrderDialogOpen(false);
    if (shouldOpenNew) {
      navigate("/orders");
    }
  };

  const handleNewOrderSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });

      toast({
        title: "Order created",
        description: "The order has been created successfully.",
      });

      closeNewOrderDialog();
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar logic
  const today = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get orders for calendar display
  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      if (!order.eventDate) return false;
      try {
        const orderDate = new Date(order.eventDate);
        return isSameDay(orderDate, date);
      } catch {
        return false;
      }
    });
  };

  const getStatusDot = (orders: any[]) => {
    if (orders.length === 0) return null;
    
    const hasQuote = orders.some(o => o.status === 'Quote');
    const hasPaid = orders.some(o => o.status === 'Paid');
    const hasInProgress = orders.some(o => o.status === 'In Progress');
    
    if (hasPaid) return 'bg-green-500';
    if (hasInProgress) return 'bg-blue-500';
    if (hasQuote) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <SearchIcon className="h-4 w-4" />
              <span>Search</span>
            </Button>
            
            <Button 
              onClick={() => setIsNewOrderDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>New Order</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Today's Date Section */}
          <div className="p-6 border-b">
            <div className="text-sm text-gray-500 font-medium mb-2">Today's Date</div>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-gray-900 mr-3">
                {format(today, "dd")}
              </span>
              <div>
                <div className="text-lg font-medium text-gray-700">
                  {format(today, "MMMM")}
                </div>
                <div className="text-sm text-gray-500">
                  {format(today, "EEEE")}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              
              <h2 className="text-lg font-semibold text-blue-600">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day headers */}
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div
                  key={index}
                  className="h-8 flex items-center justify-center text-sm font-medium text-gray-500"
                >
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((date, index) => {
                const dayOrders = getOrdersForDate(date);
                const statusDot = getStatusDot(dayOrders);
                const isCurrentDay = isToday(date);
                
                return (
                  <div
                    key={index}
                    className={`h-12 flex flex-col items-center justify-center text-sm cursor-pointer rounded-lg hover:bg-gray-50 relative ${
                      isCurrentDay ? 'bg-blue-600 text-white font-medium' : 'text-gray-700'
                    }`}
                    onClick={() => handleDateSelect(date)}
                  >
                    <span>{format(date, "d")}</span>
                    {statusDot && (
                      <div className={`w-1.5 h-1.5 rounded-full ${statusDot} absolute bottom-1`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Period and Filter */}
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Order Period:</span>
                <select className="border rounded px-3 py-1 text-sm">
                  <option>May</option>
                </select>
                <select className="border rounded px-3 py-1 text-sm">
                  <option>2025</option>
                </select>
              </div>
              
              <Button variant="outline" className="flex items-center space-x-2">
                <FilterIcon className="h-4 w-4" />
                <span>Filter Orders</span>
              </Button>
            </div>
          </div>

          {/* Orders List */}
          <div className="border-t">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders found for this period
              </div>
            ) : (
              <div className="divide-y">
                {orders.map((order: any) => {
                  const orderDate = new Date(order.eventDate);
                  const formattedDate = format(orderDate, "EEE dd MMM yyyy");
                  const price = parseFloat(order.total || '0').toFixed(2);
                  const isPaid = order.status === 'Paid';
                  
                  return (
                    <div 
                      key={order.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-blue-600 font-medium">
                            #{order.orderNumber} - {formattedDate}
                          </div>
                          <div className="text-lg font-medium text-gray-900">
                            {order.contact?.firstName} {order.contact?.lastName} ({order.eventType})
                          </div>
                          <div className="text-sm text-gray-500">
                            Slices for PD Day
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            $ {price}
                          </div>
                          <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            isPaid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={closeNewOrderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Fill in the order details below to create a new order.
          </DialogDescription>
          <OrderForm
            onSubmit={handleNewOrderSubmit}
            initialValues={selectedDate ? { eventDate: selectedDate } : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;