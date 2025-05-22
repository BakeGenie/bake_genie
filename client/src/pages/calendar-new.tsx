import React from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, isWithinInterval, parse, parseISO } from "date-fns";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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

// Define event types for calendar events
const calendarEventTypes = [
  'Admin', 'Baking', 'Decorating', 'Delivery', 'Personal', 'Appointment', 
  'Market', 'Class', 'Workshop', 'Other'
];

interface CalendarEvent {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  description: string;
}

const Calendar = () => {
  const [_, navigate] = useLocation();
  // Check for stored date in localStorage
  const storedDate = React.useMemo(() => {
    const dateFromStorage = localStorage.getItem('selectedCalendarDate');
    if (dateFromStorage) {
      try {
        const parsedDate = new Date(dateFromStorage);
        // Clear localStorage after using it
        localStorage.removeItem('selectedCalendarDate');
        return parsedDate;
      } catch (e) {
        console.error("Error parsing stored calendar date:", e);
      }
    }
    return new Date();
  }, []);
  
  const [currentDate, setCurrentDate] = React.useState(storedDate);
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(storedDate);
  const [isActionDialogOpen, setIsActionDialogOpen] = React.useState(false);
  const [isBlockoutDialogOpen, setIsBlockoutDialogOpen] = React.useState(false);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = React.useState(false);
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([]);
  const [blockedDates, setBlockedDates] = React.useState<{[key: string]: string}>({});
  const [newEvent, setNewEvent] = React.useState<Partial<CalendarEvent>>({
    type: 'Admin',
    description: ''
  });
  
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
  
  // Check if a date is blocked out
  const isDateBlocked = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return dateStr in blockedDates;
  };
  
  // Get calendar events for a specific day
  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => {
      // Check if the day is within the date range of the event
      const formattedDay = format(day, "yyyy-MM-dd");
      const startDate = event.startDate;
      const endDate = event.endDate || event.startDate; // If no end date, use start date
      
      // If the day matches the start date or is between start and end date
      return (formattedDay >= startDate && formattedDay <= endDate);
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
      <div className="flex justify-between items-center mb-4">
        <PageHeader title="Calendar" />
        <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => navigate('/orders/new')}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-md shadow-sm border">
        <div className="flex space-x-2 items-center">
          <div className="text-sm font-medium text-gray-500 mr-1">Period:</div>
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
          <Button className="bg-gray-50 text-gray-600 hover:bg-gray-100 border" size="sm">
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Filter Orders
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center bg-gray-700 text-white">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-2 font-semibold text-sm border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 bg-white">
          {Array.from({ length: firstDayOfMonth.getDay() }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-28 bg-gray-50 border-r border-b"></div>
          ))}
          
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
                  isCurrentDay ? "bg-blue-50" : "bg-white hover:bg-gray-50",
                  isDateBlocked(day) ? "bg-gray-50" : ""
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
                
                {isDateBlocked(day) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="text-red-500 text-5xl font-bold opacity-40">X</div>
                  </div>
                )}
                
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
                    
                    {/* Display calendar events */}
                    {getEventsForDay(day).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          alert(`Event: ${event.type}\nDescription: ${event.description}`);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{event.type}</div>
                          <div className="text-[9px] text-gray-500">{format(new Date(event.startDate), "h:mm a")}</div>
                        </div>
                        <div className="text-[9px] text-gray-600 truncate mt-0.5">{event.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          {Array.from({ length: 6 - lastDayOfMonth.getDay() }).map((_, index) => (
            <div key={`empty-end-${index}`} className="h-28 bg-gray-50 border-r border-b"></div>
          ))}
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
                setIsBlockoutDialogOpen(true);
              }}
            >
              Block Out Date
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setIsNewEventDialogOpen(true);
              }}
            >
              Add Calendar Event
            </Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Block Out Date Dialog */}
      <Dialog open={isBlockoutDialogOpen} onOpenChange={setIsBlockoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Block Out Date</DialogTitle>
            <DialogDescription>
              Block this date from having any orders or appointments.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="blockout-start-date" className="text-sm font-medium">Start Date:</label>
              <input
                id="blockout-start-date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(parseISO(e.target.value));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="blockout-reason" className="text-sm font-medium">Reason:</label>
              <input
                id="blockout-reason"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter reason for blocking out this date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsBlockoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                if (selectedDate) {
                  const dateStr = format(selectedDate, "yyyy-MM-dd");
                  const reasonInput = document.getElementById('blockout-reason') as HTMLInputElement;
                  
                  // Update blocked dates
                  setBlockedDates(prev => ({
                    ...prev,
                    [dateStr]: reasonInput.value || "Blocked"
                  }));
                  
                  setIsBlockoutDialogOpen(false);
                }
              }}
            >
              Block Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Calendar Event Dialog */}
      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
            <DialogDescription>
              Create a new event on the calendar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="event-type" className="text-sm font-medium">Event Type:</label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {calendarEventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="event-date" className="text-sm font-medium">Date:</label>
              <input
                id="event-date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(parseISO(e.target.value));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="event-description" className="text-sm font-medium">Description:</label>
              <input
                id="event-description"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Event description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsNewEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                if (selectedDate && newEvent.type && newEvent.description) {
                  // Create a unique ID for the event
                  const newId = `event-${Date.now()}`;
                  const dateStr = format(selectedDate, "yyyy-MM-dd");
                  
                  const newCalendarEvent: CalendarEvent = {
                    id: newId,
                    startDate: dateStr,
                    endDate: dateStr,
                    type: newEvent.type,
                    description: newEvent.description
                  };
                  
                  // Add the new event to the list
                  setCalendarEvents(prev => [...prev, newCalendarEvent]);
                  
                  // Reset form
                  setNewEvent({
                    type: 'Admin',
                    description: ''
                  });
                  
                  setIsNewEventDialogOpen(false);
                }
              }}
            >
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;