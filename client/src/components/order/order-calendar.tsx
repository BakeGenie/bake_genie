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
  differenceInDays,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { OrderWithItems } from "@/types";

interface OrderCalendarProps {
  orders: OrderWithItems[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
  month?: number;
  year?: number;
}

const OrderCalendar: React.FC<OrderCalendarProps> = ({
  orders,
  onDateSelect,
  selectedDate = new Date(),
  month,
  year,
}) => {
  // Use month and year from props or from the current date
  const currentDate = new Date();
  const urlParams = new URLSearchParams(window.location.search);
  const monthParam = month || urlParams.get("month");
  const yearParam = year || urlParams.get("year");

  // Create a ref to track if this is the first render
  const isFirstRender = React.useRef(true);
  
  // Set the today's date once
  const [today] = React.useState(new Date());
  
  // Calculate the current month to display based on props or URL params
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (month && year) {
      return new Date(year, month - 1, 1);
    } else if (monthParam && yearParam) {
      return new Date(
        parseInt(yearParam || ""),
        parseInt(monthParam || "") - 1,
        1
      );
    }
    return new Date();
  });
  
  // Update currentMonth when month or year props change
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (month && year) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  }, [month, year]);

  // Navigate calendar month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get days with orders
  const getOrdersForDate = (date: Date) => {
    return orders.filter((order) => {
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
        </div>,
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
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, today);
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        days.push(
          <div
            key={day.toString()}
            className={`p-2 min-h-[40px] relative cursor-pointer border hover:bg-blue-50
              ${!isCurrentMonth ? "bg-gray-50 text-gray-400" : ""}
              ${isToday ? "bg-blue-50" : ""}
              ${isSelected ? "bg-blue-100 border-blue-500" : "border-gray-200"}
            `}
            onClick={() => onDateSelect(cloneDay)}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm ${isToday ? "font-bold text-blue-500" : ""}`}>
                {formattedDate}
              </span>
              {ordersForDay.length > 0 && (
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -right-1 -top-1"></div>
                </div>
              )}
            </div>
            {ordersForDay.length > 0 && (
              <div className="text-xs mt-1 text-gray-700">
                {ordersForDay.length} order{ordersForDay.length !== 1 ? "s" : ""}
              </div>
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
    <div className="p-3 w-full">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="text-gray-500 text-sm">Today's Date</div>
            <div className="flex flex-col">
              <span className="text-4xl font-bold">{format(today, "dd")}</span>
              <span className="text-lg">
                {format(today, "MMM")}
                <br />
                {format(today, "EEEE")}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="text-blue-500">
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <div className="mx-2 text-center">
              <div className="text-xl font-bold">
                {format(currentMonth, "MMMM yyyy")}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="text-blue-500">
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-blue-50 py-1">
          {renderDays()}
        </div>
        <div className="bg-white">
          {renderCells()}
        </div>
      </div>
    </div>
  );
};

export default OrderCalendar;
