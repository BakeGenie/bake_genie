import React from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import { format, parseISO } from "date-fns";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { eventTypeColors } from "@/lib/constants";
import { EventType, eventTypes } from "@shared/schema";
import SidebarCalendar from "@/components/order/sidebar-calendar";

const CalendarSidebar = () => {
  const [_, navigate] = useLocation();
  
  // Initialize with current date
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(new Date());
  
  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });
  
  // Get event type color
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
  
  // Get orders for selected date
  const ordersForSelectedDate = React.useMemo(() => {
    if (!selectedDate) return [];
    
    return orders.filter(order => {
      if (!order.eventDate) return false;
      
      try {
        const orderDate = new Date(order.eventDate);
        // Compare year, month, and day only
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

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Store the selected date in localStorage for use in other pages
    localStorage.setItem('selectedEventDate', date.toISOString());
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
        {/* Calendar column */}
        <div className="md:col-span-1">
          <SidebarCalendar 
            orders={orders} 
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect} 
          />
        </div>
        
        {/* Orders for selected date */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-md shadow-sm border">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "No date selected"}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (selectedDate) {
                    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
                    navigate('/orders/new');
                  }
                }}
              >
                Add Order for This Date
              </Button>
            </div>
            
            <div className="divide-y">
              {isLoading ? (
                <div className="p-4 text-center">Loading orders...</div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {ordersForSelectedDate.map((order) => (
                    <div 
                      key={order.id} 
                      className="cursor-pointer rounded-md border shadow-sm hover:shadow-md transition-shadow p-3"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-sm">
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
                          ${typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
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

export default CalendarSidebar;