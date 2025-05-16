import React from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderWithItems } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const Calendar = () => {
  const [_, navigate] = useLocation();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<"month" | "week" | "day">("month");
  
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
  
  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "Birthday":
        return "bg-amber-100 text-amber-800";
      case "Wedding":
        return "bg-pink-100 text-pink-800";
      case "Corporate":
        return "bg-blue-100 text-blue-800";
      case "Anniversary":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
                        onClick={() => navigate(`/orders/${order.id}`)}
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
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1 py-0 border-0",
                              getEventTypeColor(order.eventType)
                            )}
                          >
                            {order.eventType}
                          </Badge>
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
    </div>
  );
};

export default Calendar;
