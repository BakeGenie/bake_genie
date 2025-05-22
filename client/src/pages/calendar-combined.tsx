import React from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon, CalendarDaysIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { eventTypes, type EventType } from "@shared/schema";
import { eventTypeColors } from "@/lib/constants";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

const CalendarCombined = () => {
  const [_, navigate] = useLocation();
  
  // Initialize with current date
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = React.useState(false);
  
  // Get the first and last day of the current month
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Calculate days to display
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  
  // Get day of week index for the first day (0 = Sunday, 6 = Saturday)
  const startDayIndex = firstDayOfMonth.getDay();
  
  // Get number of days in the last row to fill
  const endDayIndex = lastDayOfMonth.getDay();
  const daysToFillEnd = endDayIndex === 6 ? 0 : 6 - endDayIndex;
  
  // Fetch orders for the current month
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", {
      startDate: format(firstDayOfMonth, "yyyy-MM-dd"),
      endDate: format(lastDayOfMonth, "yyyy-MM-dd"),
    }],
  });
  
  const navigateToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const navigateToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get orders for a specific day
  const getOrdersForDay = (day: Date) => {
    return orders.filter(order => {
      if (!order.eventDate) return false;
      try {
        const orderDate = new Date(order.eventDate);
        return isSameDay(orderDate, day);
      } catch (e) {
        console.error("Error parsing order date:", e);
        return false;
      }
    });
  };
  
  // Sort orders by event date
  const sortedOrders = React.useMemo(() => {
    return [...orders].sort((a, b) => {
      if (!a.eventDate || !b.eventDate) return 0;
      try {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateA.getTime() - dateB.getTime();
      } catch (e) {
        console.error("Error sorting dates:", e);
        return 0;
      }
    });
  }, [orders]);
  
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
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <PageHeader title="Calendar & Orders" />
        <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => navigate('/orders/new')}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Order
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calendar column - takes 2/3 of space on larger screens */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-md shadow-sm border">
            <div className="flex space-x-2 items-center">
              <Select
                value={format(currentDate, "MMMM")}
                onValueChange={(selectedMonth) => {
                  // Get the index of the selected month (0-11)
                  const monthIndex = new Date(Date.parse(`${selectedMonth} 1, 2000`)).getMonth();
                  // Create a new date with the selected month but keep the current year
                  const newDate = new Date(currentDate);
                  newDate.setMonth(monthIndex);
                  // Update the current date
                  setCurrentDate(newDate);
                }}
              >
                <SelectTrigger className="h-8 min-w-[100px] w-auto">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, index) => {
                    const monthDate = new Date(currentDate.getFullYear(), index, 1);
                    return (
                      <SelectItem key={index} value={format(monthDate, "MMMM")}>
                        {format(monthDate, "MMMM")}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              <Select 
                value={currentDate.getFullYear().toString()}
                onValueChange={(selectedYear) => {
                  const newDate = new Date(currentDate);
                  newDate.setFullYear(parseInt(selectedYear));
                  setCurrentDate(newDate);
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const year = new Date().getFullYear() - 2 + index;
                    return (
                      <SelectItem key={index} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              <div className="flex ml-1">
                <Button variant="outline" size="icon" onClick={navigateToPreviousMonth} className="h-8 w-8">
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={navigateToNextMonth} className="h-8 w-8">
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={navigateToToday} className="h-8">
                Today
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden shadow-sm">
            {/* Days of week header */}
            <div className="grid grid-cols-7 text-center bg-gray-700 text-white">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-2 font-semibold text-sm border-r last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 bg-white">
              {/* Empty cells for days before the first day of month */}
              {Array.from({ length: startDayIndex }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-28 bg-gray-50 border-r border-b"></div>
              ))}
              
              {/* Actual days in month */}
              {daysInMonth.map((day) => {
                const dayOrders = getOrdersForDay(day);
                const isCurrentDay = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "h-28 p-1 relative border-r border-b",
                      isSelected ? "bg-primary/10 border-primary" : 
                      isCurrentDay ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                    )}
                    onClick={() => {
                      setSelectedDate(day);
                      setIsActionDialogOpen(true);
                    }}
                  >
                    <div className={cn(
                      "font-medium text-sm text-right pr-1 mb-1 pb-1 border-b border-gray-100",
                      isCurrentDay ? "text-blue-600" : "text-gray-700"
                    )}>
                      {format(day, "d")}
                    </div>
                    
                    {/* Orders container with horizontal scroll */}
                    <div className="h-[calc(100%-22px)] overflow-y-auto">
                      <div className="flex flex-col space-y-1">
                        {dayOrders.map((order) => (
                          <div
                            key={order.id}
                            className="text-xs p-1.5 rounded bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the parent div's onClick
                              navigate(`/orders/${order.id}`);
                            }}
                          >
                            <div className="flex items-start justify-between mb-0.5">
                              <div className="text-[10px] text-gray-500">#{order.orderNumber?.split('-')[1]}</div>
                              <Badge
                                className={cn(
                                  "text-[9px] px-1 py-0 h-4",
                                  getStatusColor(order.status)
                                )}
                              >
                                {order.status}
                              </Badge>
                            </div>
                            
                            <div className="font-medium truncate text-[11px]">
                              {order.contact?.firstName} {order.contact?.lastName}
                            </div>
                            
                            {order.eventType && (
                              <div className="flex items-center mt-1">
                                <div 
                                  className="text-[9px] px-1.5 py-0.5 rounded-sm flex items-center gap-1 border"
                                  style={getEventTypeColor(order.eventType)}
                                >
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{backgroundColor: getEventTypeColor(order.eventType).color}}
                                  />
                                  <span>{order.eventType}</span>
                                </div>
                              </div>
                            )}
                            
                            {order.items && order.items.length > 0 && (
                              <div className="mt-1 text-[9px] text-gray-600 truncate">
                                {order.items[0].description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Empty cells for days after the last day of month */}
              {Array.from({ length: daysToFillEnd }).map((_, index) => (
                <div key={`empty-end-${index}`} className="h-28 bg-gray-50 border-r border-b"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Orders list column - takes 1/3 of space on larger screens */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-md shadow-sm border h-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Orders for {format(currentDate, "MMMM yyyy")}</h3>
            </div>
            
            <div className="divide-y max-h-[700px] overflow-y-auto p-2">
              {isLoading ? (
                <div className="p-4 text-center">Loading orders...</div>
              ) : sortedOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No orders found for this month.</div>
              ) : (
                sortedOrders.map((order) => (
                  <div key={order.id} className="p-2">
                    <div className="cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                      {/* Order Card Layout */}
                      <div className="rounded-md border shadow-sm bg-white">
                        <div className="p-3">
                          {/* Event Date and Order ID */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-sm">
                              {order.eventDate ? format(new Date(order.eventDate), "MMM d, yyyy") : "No date"}
                            </div>
                            <div className="text-xs text-gray-500">
                              #{order.orderNumber?.split('-')[1]}
                            </div>
                          </div>
                          
                          {/* Contact with Event Type */}
                          <div className="flex items-center mb-1.5">
                            <div className="text-sm font-medium mr-2">
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
                          
                          {/* Description */}
                          {order.items && order.items.length > 0 && (
                            <div className="text-xs text-gray-600 truncate mb-2">
                              {order.items[0].description}
                            </div>
                          )}
                          
                          {/* Status */}
                          <div className="flex justify-between items-center">
                            <Badge
                              className={cn(
                                "text-xs",
                                getStatusColor(order.status)
                              )}
                            >
                              {order.status}
                            </Badge>
                            
                            {/* Total */}
                            <div className="text-sm font-semibold">
                              ${typeof order.total === 'number' ? order.total.toFixed(2) : '0.00'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Date Selection Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Date Options: {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}</DialogTitle>
            <DialogDescription>
              Choose an action for the selected date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button 
              variant="default" 
              onClick={() => {
                setIsActionDialogOpen(false);
                // Store selected date in localStorage
                if (selectedDate) {
                  localStorage.setItem('selectedEventDate', selectedDate.toISOString());
                }
                navigate('/orders/new');
              }}
            >
              Create New Order
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarCombined;