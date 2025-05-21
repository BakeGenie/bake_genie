import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths, subMonths } from "date-fns";
import OrderCalendar from "@/components/order/order-calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { eventTypeColors } from "@/lib/constants";
import { EventType, eventTypes } from "@shared/schema";

const CalendarPage = () => {
  const [_, navigate] = useLocation();
  
  // State for managing calendar
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [month, setMonth] = React.useState(new Date().getMonth() + 1); // 1-based month
  const [year, setYear] = React.useState(new Date().getFullYear());
  
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
      title: order.title,
      eventType: order.event_type,
      eventDate: order.event_date,
      status: order.status,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      deliveryTime: order.delivery_time,
      totalAmount: order.total_amount,
      amountPaid: order.amount_paid,
      specialInstructions: order.special_instructions,
      taxRate: order.tax_rate,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      contact: order.contact,
      items: order.items,
      total: parseFloat(order.total_amount || '0'),
    }));
  }, [rawOrders]);
  
  // Filter orders for the selected date
  const ordersForSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    
    return orders.filter(order => {
      if (!order.eventDate) return false;
      
      try {
        const orderDate = new Date(order.eventDate);
        return (
          orderDate.getFullYear() === selectedDate.getFullYear() &&
          orderDate.getMonth() === selectedDate.getMonth() &&
          orderDate.getDate() === selectedDate.getDate()
        );
      } catch (e) {
        console.error("Error filtering orders by date:", e);
        return false;
      }
    });
  }, [orders, selectedDate]);
  
  // Utility function to get month name
  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return format(date, 'MMMM');
  };
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Store the selected date in localStorage for use in other pages
    localStorage.setItem('selectedEventDate', date.toISOString());
  };
  
  // Get event type color based on schema definitions
  const getEventTypeColor = (eventType: string) => {
    // Check if it's a predefined event type
    if (eventTypes.includes(eventType as EventType)) {
      const color = eventTypeColors[eventType as EventType];
      // Create a lighter background color for the event display
      return {
        backgroundColor: `${color}20`, // 20% opacity version of the color
        color: color,
        borderColor: color
      };
    }
    
    // Default fallback if no color is found
    return {
      backgroundColor: "#F3F4F6",
      color: "#4B5563",
      borderColor: "#9CA3AF"
    };
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-200 text-gray-800";
      case "Confirmed":
        return "bg-blue-100 text-blue-800";
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Ready":
        return "bg-indigo-100 text-indigo-800";
      case "Delivered":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Calendar" />
        <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => navigate('/orders/new')}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Order
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar column - takes 2/3 width on larger screens */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-md border shadow-sm">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Select
                  value={month.toString()}
                  onValueChange={(value) => setMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={year.toString()}
                  onValueChange={(value) => setYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const yearValue = new Date().getFullYear() - 2 + i;
                      return (
                        <SelectItem key={yearValue} value={yearValue.toString()}>
                          {yearValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm font-medium text-gray-500">
                {getMonthName(month)} {year}
              </div>
            </div>
            
            <div className="p-4">
              <OrderCalendar
                orders={orders}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                month={month}
                year={year}
              />
            </div>
          </div>
        </div>
        
        {/* Order details column - takes 1/3 width on larger screens */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-md border shadow-sm h-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "No date selected"}
              </h3>
              {selectedDate && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
                    navigate('/orders/new');
                  }}
                  className="mt-2"
                >
                  Add Order for This Date
                </Button>
              )}
            </div>
            
            <div className="divide-y">
              {isLoading ? (
                <div className="p-4 text-center">Loading orders...</div>
              ) : !selectedDate ? (
                <div className="p-8 text-center text-gray-500">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Select a date to view orders</p>
                </div>
              ) : ordersForSelectedDate.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="mb-2">No orders scheduled for this date.</div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (selectedDate) {
                        localStorage.setItem('selectedEventDate', selectedDate.toISOString());
                        navigate('/orders/new');
                      }
                    }}
                  >
                    Create New Order
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto max-h-[700px]">
                  {ordersForSelectedDate.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold">
                          {order.eventDate ? format(new Date(order.eventDate), "h:mm a") : "No time set"}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{order.orderNumber?.split('-')[1]}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-sm font-medium">
                          {order.contact?.firstName} {order.contact?.lastName}
                        </div>
                        {order.eventType && (
                          <div 
                            className="text-xs px-1.5 py-0.5 rounded-sm flex items-center gap-1 border"
                            style={getEventTypeColor(order.eventType)}
                          >
                            <div 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{backgroundColor: getEventTypeColor(order.eventType).color}}
                            />
                            <span>{order.eventType}</span>
                          </div>
                        )}
                      </div>
                      
                      {order.items && order.items.length > 0 && (
                        <div className="text-xs text-gray-600 truncate mb-2">
                          {order.items[0].description}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <Badge
                          className={cn(
                            "text-xs",
                            getStatusColor(order.status)
                          )}
                        >
                          {order.status}
                        </Badge>
                        
                        <div className="text-sm font-semibold">
                          ${parseFloat(order.totalAmount || '0').toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;