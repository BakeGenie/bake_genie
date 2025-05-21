import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { eventTypeColors } from "@/lib/constants";
import { EventType, eventTypes } from "@shared/schema";

type SidebarCalendarProps = {
  orders: any[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
};

const SidebarCalendar: React.FC<SidebarCalendarProps> = ({
  orders,
  selectedDate,
  onDateSelect,
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  
  // Get day of week index for the first day (0 = Sunday, 6 = Saturday)
  const startDayIndex = firstDayOfMonth.getDay();
  
  // Get number of days in the last row to fill
  const endDayIndex = lastDayOfMonth.getDay();
  const daysToFillEnd = endDayIndex === 6 ? 0 : 6 - endDayIndex;
  
  // Navigate to previous month
  const navigateToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  // Navigate to next month
  const navigateToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Navigate to today
  const navigateToToday = () => {
    setCurrentDate(new Date());
    onDateSelect(new Date());
  };
  
  // Group orders by date
  const ordersByDate = React.useMemo(() => {
    return orders.reduce((acc: Record<string, any[]>, order: any) => {
      if (!order.eventDate) return acc;
      
      try {
        const eventDate = new Date(order.eventDate);
        const dateKey = format(eventDate, 'yyyy-MM-dd');
        
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        
        acc[dateKey].push(order);
        return acc;
      } catch (e) {
        console.error("Error grouping orders by date:", e);
        return acc;
      }
    }, {});
  }, [orders]);
  
  // Get event type color based on schema definitions
  const getEventTypeColor = (eventType: string) => {
    // Check if it's a predefined event type
    if (eventTypes.includes(eventType as EventType)) {
      return eventTypeColors[eventType as EventType];
    }
    
    // Default fallback if no color is found
    return "#9CA3AF";
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Cancelled":
        return "bg-gray-200 text-gray-800";
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="w-full rounded-md border shadow-sm bg-white overflow-hidden">
      <div className="p-3 border-b">
        <div className="flex justify-between items-center">
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
          </div>
          
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="icon" onClick={navigateToPreviousMonth} className="h-7 w-7">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateToNextMonth} className="h-7 w-7">
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToToday} className="h-7 text-xs ml-1">
              Today
            </Button>
          </div>
        </div>
      </div>
      
      <div className="calendar-grid">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center bg-gray-700 text-white">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-1 text-xs font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 bg-white">
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: startDayIndex }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-16 bg-gray-50 border-r border-b"></div>
          ))}
          
          {/* Actual days in month */}
          {daysInMonth.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const ordersOnDay = ordersByDate[dateKey] || [];
            const hasOrders = ordersOnDay.length > 0;
            
            const isCurrentDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <div
                key={day.toString()}
                className={cn(
                  "h-16 relative border-r border-b cursor-pointer p-1",
                  isSelected ? "bg-primary/10 border-primary" : 
                  isCurrentDay ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className={cn(
                  "font-medium text-xs text-right pr-1 mb-1",
                  isCurrentDay ? "text-blue-600" : "text-gray-700"
                )}>
                  {format(day, "d")}
                </div>
                
                {/* Orders indicator */}
                {hasOrders && (
                  <div className="overflow-y-auto max-h-10">
                    <div className="flex flex-col gap-1">
                      {ordersOnDay.slice(0, 2).map((order: any) => (
                        <div
                          key={order.id}
                          className="relative flex items-center"
                        >
                          <div 
                            className="w-1.5 h-1.5 rounded-full mr-1 flex-shrink-0"
                            style={{backgroundColor: getEventTypeColor(order.eventType || "Other")}}
                          />
                          <div className={cn(
                            "text-[9px] truncate px-1 py-0.5 rounded-sm",
                            getStatusColor(order.status)
                          )}>
                            {order.contact?.firstName} {order.contact?.lastName?.charAt(0)}.
                          </div>
                        </div>
                      ))}
                      
                      {ordersOnDay.length > 2 && (
                        <div className="text-[9px] text-gray-500 text-right pr-1">
                          +{ordersOnDay.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Empty cells for days after the last day of month */}
          {Array.from({ length: daysToFillEnd }).map((_, index) => (
            <div key={`empty-end-${index}`} className="h-16 bg-gray-50 border-r border-b"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarCalendar;