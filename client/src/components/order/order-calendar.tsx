import React from "react";
import { 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  format, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  differenceInDays 
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { OrderWithItems } from "@/types";

interface OrderCalendarProps {
  orders: OrderWithItems[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

const OrderCalendar: React.FC<OrderCalendarProps> = ({
  orders,
  onDateSelect,
  selectedDate = new Date(),
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [today] = React.useState(new Date());

  // Navigate calendar month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get days with orders
  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.eventDate);
      return isSameDay(orderDate, date);
    });
  };

  // Render calendar header (days of week)
  const renderDays = () => {
    const days = [];
    const dateFormat = "E";
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-gray-500 text-sm py-1">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7">{days}</div>;
  };

  // Render calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        const ordersForDay = getOrdersForDate(day);
        
        days.push(
          <div 
            key={day.toString()} 
            className="py-2 relative"
            onClick={() => onDateSelect(cloneDay)}
          >
            <div 
              className={`calendar-day ${
                !isSameMonth(day, monthStart) ? "other-month text-gray-300" : ""
              } ${
                isSameDay(day, today) ? "today" : ""
              } ${
                ordersForDay.length > 0 ? "has-events" : ""
              } ${
                selectedDate && isSameDay(day, selectedDate) ? "border-2 border-primary-500" : "border border-gray-200"
              }`}
            >
              {formattedDate}
            </div>
            {ordersForDay.length > 0 && (
              <div className="w-1 h-1 rounded-full bg-gray-400 absolute bottom-0 left-1/2 transform -translate-x-1/2"></div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-gray-500">Today's Date</div>
            <div className="flex items-baseline">
              <span className="text-4xl font-light">{format(today, "d")}</span>
              <span className="ml-1 text-xl">{format(today, "MMM")}</span>
              <span className="ml-1 text-sm text-gray-500">{format(today, "EEEE")}</span>
            </div>
          </div>
          <div className="flex">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeftIcon className="h-5 w-5 text-gray-400" />
            </Button>
            <div className="mx-2 text-center">
              <div className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div>
        {renderDays()}
        {renderCells()}
      </div>
    </div>
  );
};

export default OrderCalendar;
