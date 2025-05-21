import React from "react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from "date-fns";
import DateSelectionDialog from "./date-selection-dialog";
import OrderDetailsDialog from "./order-details-dialog";
import { OrderWithItems } from "@/types";

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
  
  // Get all days in the current month
  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  
  // Get the day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay();
  
  // Group orders by date
  const ordersByDate = orders.reduce((acc: Record<string, OrderWithItems[]>, order: OrderWithItems) => {
    const eventDate = new Date(order.eventDate);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    
    acc[dateKey].push(order);
    return acc;
  }, {});
  
  // Generate the calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 border-t border-l p-1"></div>);
  }
  
  // Add cells for each day in the month
  daysInMonth.forEach((day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const ordersOnDay = ordersByDate[dateKey] || [];
    const hasOrders = ordersOnDay.length > 0;
    
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    
    const handleDateClick = (e: React.MouseEvent, date: Date) => {
      // Only open date dialog if clicking on the cell background, not on an order
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('date-cell-bg')) {
        e.stopPropagation();
        setClickedDate(date);
        setDateDialogOpen(true);
        onDateSelect(date);
      }
    };
    
    const handleOrderClick = (e: React.MouseEvent, order: OrderWithItems) => {
      e.stopPropagation();
      setSelectedOrder(order);
      setOrderDialogOpen(true);
    };
    
    calendarDays.push(
      <div
        key={dateKey}
        className={`h-24 border-t border-l p-1 relative ${
          isToday(day) ? 'bg-blue-50' : ''
        } ${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
        onClick={(e) => handleDateClick(e, day)}
      >
        <div className="flex justify-between items-start date-cell-bg">
          <span className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : ''}`}>
            {format(day, 'd')}
          </span>
        </div>
        
        {hasOrders && (
          <div className="mt-1 space-y-1 overflow-y-auto max-h-16">
            {ordersOnDay.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${
                  order.status === 'Cancelled'
                    ? 'bg-gray-200 text-gray-700'
                    : order.status === 'Completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
                onClick={(e) => handleOrderClick(e, order)}
              >
                {order.orderNumber}
              </div>
            ))}
            
            {ordersOnDay.length > 3 && (
              <div className="text-xs text-gray-500 px-1">
                +{ordersOnDay.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  });
  
  // Add empty cells for days after the last day of the month
  const totalCells = calendarDays.length;
  const rowsNeeded = Math.ceil(totalCells / 7);
  const totalCellsNeeded = rowsNeeded * 7;
  
  for (let i = totalCells; i < totalCellsNeeded; i++) {
    calendarDays.push(<div key={`empty-end-${i}`} className="h-24 border-t border-l p-1"></div>);
  }
  
  const handleCloseDateDialog = () => {
    setDateDialogOpen(false);
  };
  
  const handleCloseOrderDialog = () => {
    setOrderDialogOpen(false);
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{format(currentMonthDate, 'MMMM yyyy')}</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateSelect(new Date())}
          >
            Today
          </Button>
        </div>
      </div>
      
      {/* Date Selection Dialog */}
      <DateSelectionDialog 
        isOpen={dateDialogOpen}
        onClose={handleCloseDateDialog}
        selectedDate={clickedDate}
      />
      
      {/* Order Details Dialog */}
      <OrderDetailsDialog
        isOpen={orderDialogOpen}
        onClose={handleCloseOrderDialog}
        order={selectedOrder}
      />
      
      <div className="grid grid-cols-7 border-r border-b">
        {/* Calendar header - Days of week */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center font-medium text-sm border-t border-l">
            {day}
          </div>
        ))}
        
        {/* Calendar grid */}
        {calendarDays}
      </div>
    </div>
  );
};

export default OrderCalendar;