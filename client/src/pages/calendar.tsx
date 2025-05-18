import React from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon, CalendarDaysIcon, XIcon } from "lucide-react";
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

const Calendar = () => {
  const [_, navigate] = useLocation();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = React.useState(false);
  const [isBlockoutDialogOpen, setIsBlockoutDialogOpen] = React.useState(false);
  
  // Get the first and last day of the current month
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  
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
      const orderDate = new Date(order.eventDate);
      return isSameDay(orderDate, day);
    });
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
    
    // For custom event types saved in local storage
    const customEventTypes = JSON.parse(localStorage.getItem('customEventTypes') || '[]');
    const customType = customEventTypes.find((t: any) => t.name === eventType);
    
    if (customType) {
      return {
        backgroundColor: `${customType.color}20`, // 20% opacity version of the color
        color: customType.color,
        borderColor: customType.color
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
      <PageHeader title="Calendar" />
      
      <div className="flex justify-between items-center mb-6 mt-4">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={navigateToToday}>
            Today
          </Button>
          <div className="flex">
            <Button variant="outline" size="icon" onClick={navigateToPreviousMonth}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateToNextMonth}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold flex items-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={view}
            onValueChange={(value) => setView(value as "month" | "week" | "day")}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            <CalendarIcon className="h-5 w-5 inline-block mr-2" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2 font-semibold text-sm text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth.getDay() }).map((_, index) => (
              <div key={`empty-start-${index}`} className="h-28 bg-gray-50 rounded-md border border-gray-100"></div>
            ))}
            
            {daysInMonth.map((day) => {
              const dayOrders = getOrdersForDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "h-28 p-1 rounded-md border border-gray-200 overflow-y-auto",
                    isCurrentDay ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                  )}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsActionDialogOpen(true);
                  }}
                >
                  <div className={cn(
                    "font-medium text-sm sticky top-0 bg-inherit z-10 mb-1",
                    isCurrentDay ? "text-blue-600" : "text-gray-700"
                  )}>
                    {format(day, "d")}
                  </div>
                  
                  <div className="space-y-1">
                    {dayOrders.map((order) => (
                      <div
                        key={order.id}
                        className="text-xs p-1 rounded bg-white border border-gray-200 cursor-pointer hover:bg-gray-50"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent div's onClick
                          navigate(`/orders/${order.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{order.contact?.firstName} {order.contact?.lastName}</span>
                          <Badge
                            className={cn(
                              "text-[10px] px-1 py-0",
                              getStatusColor(order.status)
                            )}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-0.5">
                          {order.eventType && (
                            <div 
                              className="text-[10px] px-1.5 py-0.5 rounded-sm flex items-center gap-1"
                              style={getEventTypeColor(order.eventType)}
                            >
                              <div 
                                className="w-2 h-2 rounded-full"
                                style={{backgroundColor: getEventTypeColor(order.eventType).color}}
                              />
                              <span>{order.eventType}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {Array.from({ length: 6 - lastDayOfMonth.getDay() }).map((_, index) => (
              <div key={`empty-end-${index}`} className="h-28 bg-gray-50 rounded-md border border-gray-100"></div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Date Selection Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Date Options: {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}</DialogTitle>
            <DialogDescription>
              Select an action for this date
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button 
              className="flex items-center justify-start h-auto py-6 px-4"
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                if (selectedDate) {
                  // Navigate to new order form with the date pre-selected
                  navigate(`/orders/new?date=${format(selectedDate, "yyyy-MM-dd")}`);
                }
              }}
            >
              <div className="flex items-center">
                <PlusIcon className="mr-2 h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-left">Create New Order</h3>
                  <p className="text-sm text-gray-500 text-left">Add a new order or quote for this date</p>
                </div>
              </div>
            </Button>
            
            <Button 
              className="flex items-center justify-start h-auto py-6 px-4"
              variant="outline"
              onClick={() => {
                // Add an event - Currently this would navigate to a hypothetical events page
                // In a future implementation, we could create a separate events entity
                setIsActionDialogOpen(false);
                navigate(`/task-list?date=${selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}`);
              }}
            >
              <div className="flex items-center">
                <CalendarDaysIcon className="mr-2 h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-left">Add Event/Task</h3>
                  <p className="text-sm text-gray-500 text-left">Add a reminder or task for this date</p>
                </div>
              </div>
            </Button>
            
            <Button 
              className="flex items-center justify-start h-auto py-6 px-4"
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setIsBlockoutDialogOpen(true);
              }}
            >
              <div className="flex items-center">
                <XIcon className="mr-2 h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-left">Block Out Time</h3>
                  <p className="text-sm text-gray-500 text-left">Mark this date as unavailable</p>
                </div>
              </div>
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsActionDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Block Out Time Dialog */}
      <Dialog open={isBlockoutDialogOpen} onOpenChange={setIsBlockoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block Out Time: {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}</DialogTitle>
            <DialogDescription>
              Mark this date as unavailable in your calendar
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <p className="text-center text-sm">
              This will mark the selected date as unavailable, allowing you to block out time for personal events, 
              holidays, or when you're not accepting orders.
            </p>
            
            <Button 
              onClick={() => {
                // Here we would implement the logic to block out the time
                // For now, we'll just simulate it with an alert and close the dialog
                alert(`Date ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""} has been blocked out`);
                setIsBlockoutDialogOpen(false);
              }}
            >
              Confirm Block Out
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsBlockoutDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
