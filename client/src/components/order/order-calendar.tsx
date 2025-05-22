import React from "react";
import { Button } from "@/components/ui/button";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameDay,
  getDate,
} from "date-fns";
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
  const [selectedOrder, setSelectedOrder] =
    React.useState<OrderWithItems | null>(null);
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] =
    React.useState(false);

  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Group orders by date
  const ordersByDate = orders.reduce(
    (acc: Record<string, OrderWithItems[]>, order: OrderWithItems) => {
      if (!order.eventDate) return acc;

      try {
        const eventDate = new Date(order.eventDate);
        const dateKey = format(eventDate, "yyyy-MM-dd");

        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }

        acc[dateKey].push(order);
      } catch (error) {
        console.error("Error parsing date:", error);
      }

      return acc;
    },
    {},
  );

  const handleDateClick = (date: Date) => {
    setClickedDate(date);
    setIsSelectionDialogOpen(true);
  };

  const createNewOrder = () => {
    if (clickedDate) {
      // Store the date in localStorage for the order form to use
      localStorage.setItem("selectedEventDate", clickedDate.toISOString());

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
  
  const viewCalendar = () => {
    if (clickedDate) {
      // Navigate to the calendar view with the date
      window.location.href = `/calendar?date=${clickedDate.toISOString()}`;
      setIsSelectionDialogOpen(false);
    }
  };

  const getOrderStatusCounts = (dateStr: string) => {
    const orders = ordersByDate[dateStr] || [];

    return {
      redEvents: orders.filter(
        (o) => o.status === "Quote" || o.status === "Pending",
      ).length,
      orangeEvents: orders.filter((o) => o.status === "In Progress").length,
      grayEvents: orders.filter(
        (o) => o.status === "Completed" || o.status === "Delivered",
      ).length,
    };
  };

  // Get dominant event type for a specific date
  const getDominantEventType = (dateStr: string): EventType | null => {
    const orders = ordersByDate[dateStr] || [];
    if (orders.length === 0) return null;

    // Count occurrences of each event type
    const eventTypeCounts = orders.reduce(
      (acc: Record<string, number>, order) => {
        const eventType = order.eventType as EventType;
        if (!acc[eventType]) acc[eventType] = 0;
        acc[eventType]++;
        return acc;
      },
      {},
    );

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
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Calendar header - Days of week */}
      <div className="bg-white grid grid-cols-7 rounded-t-lg border-b border-gray-100">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <div
            key={day + index}
            className="py-1 text-center font-medium text-gray-500 text-xs"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0 border-b">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: (firstDayOfMonth.getDay() + 6) % 7 }, (_, i) => (
          <div key={`empty-start-${i}`} className="aspect-square p-1 bg-gray-50"></div>
        ))}

        {/* Days of the month */}
        {daysInMonth.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const ordersOnDay = ordersByDate[dateKey] || [];
          const hasOrders = ordersOnDay.length > 0;
          const dayNum = getDate(day);
          const dayToday = isToday(day);
          const daySelected = selectedDate
            ? isSameDay(day, selectedDate)
            : false;

          const { redEvents, orangeEvents, grayEvents } =
            getOrderStatusCounts(dateKey);
          const hasRedEvents = redEvents > 0;
          const hasOrangeEvents = orangeEvents > 0;
          const hasGrayEvents = grayEvents > 0;

          // Get dominant event type for this day
          const dominantEventType = getDominantEventType(dateKey);
          let eventTypeColor = "";

          // Convert event type to color
          if (dominantEventType && eventTypeColors[dominantEventType]) {
            eventTypeColor = eventTypeColors[dominantEventType];
          }

          return (
            <div
              key={dateKey}
              className={`
                relative aspect-square flex flex-col items-center justify-center p-0.5 cursor-pointer
                transition-all duration-150 hover:bg-gray-50
                ${dayToday ? "bg-blue-50" : ""}
                ${daySelected ? "bg-blue-100" : ""}
              `}
              onClick={() => handleDateClick(day)}
              title={dominantEventType ? `${dominantEventType} Event` : ""}
            >
              <div
                className={`
                  flex items-center justify-center h-8 w-8 rounded-full
                  my-0.5 font-medium text-base transition-colors
                  ${dayToday ? "bg-blue-500 text-white" : "text-gray-700"}
                  ${daySelected ? "ring-1 ring-blue-400 ring-offset-1" : ""}
                `}
              >
                {dayNum}
              </div>
              
              {/* Event indicators */}
              {hasOrders && (
                <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center max-w-[24px]">
                  {Array.from({ length: Math.min(ordersOnDay.length, 5) }).map((_, index) => (
                    <div 
                      key={index} 
                      className={`h-1.5 w-1.5 rounded-full ${
                        ordersOnDay[index]?.status === "Quote" ? "bg-red-500" :
                        ordersOnDay[index]?.status === "In Progress" ? "bg-orange-400" :
                        ordersOnDay[index]?.status === "Completed" ? "bg-green-500" :
                        "bg-gray-400"
                      }`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Date Selection Dialog */}
      <Dialog
        open={isSelectionDialogOpen}
        onOpenChange={setIsSelectionDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
            <DialogDescription>
              {clickedDate && format(clickedDate, "EEEE, MMMM do, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button variant="outline" onClick={createNewOrder} className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Order
            </Button>
            <Button variant="outline" onClick={viewCalendar} className="flex items-center justify-center">
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Calendar
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
