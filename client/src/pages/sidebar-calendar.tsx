import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, 
  isToday, isSameDay, addMonths, subMonths, isWithinInterval } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SidebarDateDialog from "@/components/calendar/sidebar-date-dialog";
import EventDialog, { CalendarEvent } from "@/components/calendar/event-dialog";
import BlockDateDialog, { BlockDateInfo } from "@/components/calendar/block-date-dialog";
import { useLocation } from "wouter";

const SidebarCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isBlockDateDialogOpen, setIsBlockDateDialogOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<{[key: string]: string}>({});
  
  // Fetch orders for the current month
  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", {
      startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
    }],
  });
  
  // First day of the month
  const firstDayOfMonth = startOfMonth(currentDate);
  
  // Last day of the month
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // Get days in current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  
  // Get the day of the week for the first day of the month (0-indexed, where 0 is Sunday)
  const firstDayOfWeekIndex = firstDayOfMonth.getDay();
  
  // Get orders for a specific day
  const getOrdersForDay = (day: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.eventDate);
      return isSameDay(orderDate, day);
    });
  };
  
  // Check if a date is blocked
  const isDateBlocked = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return dateStr in blockedDates;
  };
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => {
      const formattedDay = format(day, "yyyy-MM-dd");
      const startDate = event.startDate;
      const endDate = event.endDate || event.startDate;
      
      return (formattedDay >= startDate && formattedDay <= endDate);
    });
  };
  
  // Handle adding a new calendar event
  const handleAddEvent = (event: CalendarEvent) => {
    // In a real app, this would save to a database
    // For now, just add it to the local state
    setCalendarEvents(prevEvents => [...prevEvents, event]);
    
    // Show a confirmation message
    alert(`Event added: ${event.type} - ${event.description}`);
  };
  
  // Handle blocking a date
  const handleBlockDate = (blockInfo: BlockDateInfo) => {
    // Create entries for each date in the range
    const newBlockedDates = { ...blockedDates };
    
    const startDate = new Date(blockInfo.startDate);
    const endDate = new Date(blockInfo.endDate);
    
    // Loop through each day in the range
    const daysToBlock = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
    
    daysToBlock.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      newBlockedDates[dateStr] = blockInfo.reason;
    });
    
    setBlockedDates(newBlockedDates);
    
    // Show a confirmation message
    alert(`Date${startDate !== endDate ? 's' : ''} blocked from ${format(startDate, "MMM d, yyyy")} to ${format(endDate, "MMM d, yyyy")}`);
  };
  
  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  return (
    <div className="p-4 bg-white rounded-md shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex space-x-1">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of month */}
        {Array.from({ length: firstDayOfWeekIndex }).map((_, index) => (
          <div key={`empty-start-${index}`} className="h-8 rounded-md"></div>
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map((day) => {
          const dayOrders = getOrdersForDay(day);
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(day);
          const isBlocked = isDateBlocked(day);
          
          return (
            <button
              key={day.toString()}
              className={cn(
                "h-8 rounded-md text-sm relative flex items-center justify-center",
                isCurrentDay ? "bg-blue-100 text-blue-800 font-bold" : 
                isBlocked ? "bg-red-50 text-red-500" : "hover:bg-gray-100"
              )}
              onClick={() => {
                setSelectedDate(day);
                setIsDateDialogOpen(true);
              }}
            >
              {format(day, "d")}
              {(dayOrders.length > 0 || dayEvents.length > 0) && (
                <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Date Action Dialog */}
      <SidebarDateDialog
        isOpen={isDateDialogOpen}
        onClose={() => setIsDateDialogOpen(false)}
        selectedDate={selectedDate}
        onAddEvent={() => {
          setIsEventDialogOpen(true);
        }}
        onBlockDate={() => {
          setIsBlockDateDialogOpen(true);
        }}
      />
      
      {/* Add Event Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        selectedDate={selectedDate}
        onSaveEvent={handleAddEvent}
      />
      
      {/* Block Date Dialog */}
      <BlockDateDialog
        isOpen={isBlockDateDialogOpen}
        onClose={() => setIsBlockDateDialogOpen(false)}
        selectedDate={selectedDate}
        onBlockDate={handleBlockDate}
      />
    </div>
  );
};

export default SidebarCalendar;