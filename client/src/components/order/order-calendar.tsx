import React from "react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, getDate } from "date-fns";
import DateSelectionDialog from "./date-selection-dialog";
import OrderDetailsDialog from "./order-details-dialog";
import { OrderWithItems } from "@/types";
import { eventTypeColors, type EventType } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrderCalendarProps = {
  orders: OrderWithItems[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  month: number;
  year: number;
};

const OrderCalendar: React.FC<OrderCalendarProps> = ({
  orders,
  selectedDate,
  onDateSelect,
  month,
  year,
}) => {
  const currentMonthDate = new Date(year, month - 1);
  const firstDayOfMonth = startOfMonth(currentMonthDate);
  const lastDayOfMonth = endOfMonth(currentMonthDate);
  
  const [dateDialogOpen, setDateDialogOpen] = React.useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = React.useState(false);
  const [clickedDate, setClickedDate] = React.useState<Date | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<OrderWithItems | null>(null);
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = React.useState(false);
  
  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  
  // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Group orders by date
  const ordersByDate = orders.reduce((acc: Record<string, OrderWithItems[]>, order: OrderWithItems) => {
    if (!order.eventDate) return acc;
    
    try {
      const eventDate = new Date(order.eventDate);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(order);
    } catch (error) {
      console.error("Error parsing date:", error);
    }
    
    return acc;
  }, {});
  
  const handleDateClick = (date: Date) => {
    setClickedDate(date);
    setIsSelectionDialogOpen(true);
  };
  
  const createNewOrder = () => {
    if (clickedDate) {
      // Store the date in localStorage for the order form to use
      localStorage.setItem('selectedEventDate', clickedDate.toISOString());
      
      // Close the dialog
      setIsSelectionDialogOpen(false);
      
      // Redirect to the new order page with date parameter
      window.location.href = `/orders?newOrder=true&date=${clickedDate.toISOString()}`;
    }
  };
  
  const blockOutDate = () => {
    // Logic to block out date would go here
    // For now just alert the user
    alert(`Date ${clickedDate?.toLocaleDateString()} has been blocked out`);
    setIsSelectionDialogOpen(false);
  };
  
  const getOrderStatusCounts = (dateStr: string) => {
    const orders = ordersByDate[dateStr] || [];
    
    return {
      redEvents: orders.filter(o => o.status === 'Quote' || o.status === 'Pending').length,
      orangeEvents: orders.filter(o => o.status === 'In Progress').length,
      grayEvents: orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length,
    };
  };
  
  // Get dominant event type for a specific date
  const getDominantEventType = (dateStr: string): EventType | null => {
    const orders = ordersByDate[dateStr] || [];
    if (orders.length === 0) return null;
    
    // Count occurrences of each event type
    const eventTypeCounts = orders.reduce((acc: Record<string, number>, order) => {
      const eventType = order.eventType as EventType;
      if (!acc[eventType]) acc[eventType] = 0;
      acc[eventType]++;
      return acc;
    }, {});
    
    // Find the most common event type
    let dominantType: EventType | null = null;
    let maxCount = 0;
    
    Object.entries(eventTypeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type as EventType;
      }
    });
    
    return dominantType;
  };
  
  return (
    <div className="w-full">
      {/* Calendar header - Days of week */}
      <div className="bg-gray-50 grid grid-cols-7 rounded-t-md">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <div key={day + index} className="py-2 text-center font-medium text-gray-500 text-sm">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: (firstDayOfMonth.getDay() + 6) % 7 }, (_, i) => (
          <div key={`empty-start-${i}`} className="aspect-square p-2"></div>
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const ordersOnDay = ordersByDate[dateKey] || [];
          const hasOrders = ordersOnDay.length > 0;
          const dayNum = getDate(day);
          const dayToday = isToday(day);
          const daySelected = selectedDate ? isSameDay(day, selectedDate) : false;
          
          const { redEvents, orangeEvents, grayEvents } = getOrderStatusCounts(dateKey);
          const hasRedEvents = redEvents > 0;
          const hasOrangeEvents = orangeEvents > 0;
          const hasGrayEvents = grayEvents > 0;
          
          // Get dominant event type for this day
          const dominantEventType = getDominantEventType(dateKey);
          let eventTypeClass = '';
          
          if (dominantEventType) {
            // Convert spaces to dashes for CSS class names
            const cssClassName = dominantEventType.replace(/\s+\/\s+/g, '-').replace(/\s+/g, '-');
            eventTypeClass = `event-${cssClassName}`;
          }
          
          return (
            <div 
              key={dateKey} 
              className="aspect-square flex flex-col items-center justify-center p-2 cursor-pointer"
              onClick={() => handleDateClick(day)}
              title={dominantEventType ? `${dominantEventType} Event` : ''}
            >
              <div className={`
                calendar-day
                ${dayToday ? 'today' : ''}
                ${daySelected ? 'selected' : ''}
                ${hasRedEvents ? 'has-red-events' : ''}
                ${hasOrangeEvents ? 'has-orange-events' : ''}
                ${hasGrayEvents ? 'has-events' : ''}
                ${eventTypeClass}
              `}>
                {dayNum}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Date Selection Dialog */}
      <Dialog open={isSelectionDialogOpen} onOpenChange={setIsSelectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
            <DialogDescription>
              {clickedDate && format(clickedDate, "EEEE, MMMM do, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button variant="outline" onClick={createNewOrder}>
              Create New Order
            </Button>
            <Button variant="outline" onClick={blockOutDate}>
              Block Out Date
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Order Details Dialog - Kept for backward compatibility */}
      <OrderDetailsDialog
        isOpen={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrderCalendar;