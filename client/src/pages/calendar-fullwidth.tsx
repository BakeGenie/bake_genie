import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon, FilterIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths, subMonths } from "date-fns";
import { OrderWithItems } from "@/types";
import DateSelectionDialog from "@/components/order/date-selection-dialog";
import { eventTypeColors } from "@/lib/constants";
import { EventType, eventTypes } from "@shared/schema";

const CalendarFullWidth = () => {
  const [_, navigate] = useLocation();
  
  // Get current month and year
  const currentDate = new Date();
  const [month, setMonth] = React.useState(currentDate.getMonth() + 1); // 1-12
  const [year, setYear] = React.useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = React.useState(false);
  
  // Fetch orders
  const { data: rawOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
  console.log("Orders from API:", rawOrders);
  
  // Transform backend data to frontend format
  const orders = React.useMemo(() => {
    return (Array.isArray(rawOrders) ? rawOrders : []).map((order: any) => ({
      id: order.id,
      userId: order.user_id,
      contactId: order.contact_id,
      orderNumber: order.order_number,
      title: order.title,
      eventType: order.event_type,
      eventDate: order.event_date,
      status: order.status,
      deliveryType: order.delivery_type,
      deliveryAddress: order.delivery_address,
      deliveryTime: order.delivery_time,
      totalAmount: order.total_amount,
      amountPaid: order.amount_paid,
      specialInstructions: order.special_instructions,
      taxRate: order.tax_rate,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      contact: order.contact,
      items: order.items,
      total: parseFloat(order.total_amount || '0'),
    }));
  }, [rawOrders]);
  
  // Utility function to get month name
  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return format(date, 'MMMM');
  };
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };
  
  // Create days of the week for calendar header
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate calendar days
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number, year: number) => {
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month - 1, 1).getDay();
    // Convert to 0 = Monday, 1 = Tuesday, etc.
    return firstDay === 0 ? 6 : firstDay - 1;
  };
  
  // Generate calendar grid data
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    
    // Previous month days
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthYear = month === 1 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevMonth, prevMonthYear);
    
    // Calendar grid
    const calendar = [];
    let day = 1;
    
    // Calculate total rows needed
    const totalDays = firstDay + daysInMonth;
    const rows = Math.ceil(totalDays / 7);
    
    for (let row = 0; row < rows; row++) {
      const week = [];
      
      for (let col = 0; col < 7; col++) {
        const dayIndex = row * 7 + col;
        const dayOffset = dayIndex - firstDay;
        
        if (dayOffset < 0) {
          // Previous month days
          const prevDay = prevMonthDays + dayOffset + 1;
          week.push({
            date: new Date(prevMonthYear, prevMonth - 1, prevDay),
            day: prevDay,
            currentMonth: false,
            prevMonth: true,
            nextMonth: false,
          });
        } else if (dayOffset < daysInMonth) {
          // Current month days
          const currentDay = dayOffset + 1;
          week.push({
            date: new Date(year, month - 1, currentDay),
            day: currentDay,
            currentMonth: true,
            prevMonth: false,
            nextMonth: false,
          });
        } else {
          // Next month days
          const nextDay = dayOffset - daysInMonth + 1;
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextMonthYear = month === 12 ? year + 1 : year;
          week.push({
            date: new Date(nextMonthYear, nextMonth - 1, nextDay),
            day: nextDay,
            currentMonth: false,
            prevMonth: false,
            nextMonth: true,
          });
        }
      }
      
      calendar.push(week);
    }
    
    return calendar;
  };
  
  const calendarGrid = generateCalendarGrid();
  
  // Get orders for a specific day
  const getOrdersForDay = (date: Date) => {
    return orders.filter(order => {
      if (!order.eventDate) return false;
      try {
        const orderDate = new Date(order.eventDate);
        return (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getDate() === date.getDate()
        );
      } catch (e) {
        console.error("Error filtering orders by date:", e);
        return false;
      }
    });
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsDateDialogOpen(true);
    // Store selected date for order creation
    localStorage.setItem('selectedEventDate', date.toISOString());
  };
  
  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    if (eventTypes.includes(eventType as EventType)) {
      return eventTypeColors[eventType as EventType];
    }
    return "#9CA3AF";
  };
  
  // Format date number with padding for single digits
  const formatDateNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Check if date is selected
  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <PageHeader title="Calendar" />
        <div className="flex space-x-2">
          <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={() => navigate('/orders/new')}>
            <PlusIcon className="h-4 w-4 mr-1" /> Add Item
          </Button>
          <Button variant="outline" size="sm">
            <FilterIcon className="h-4 w-4 mr-1" /> Filter Orders
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-md shadow-sm border">
        {/* Calendar Controls */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="text-sm font-medium">Period:</div>
            <Select
              value={getMonthName(month)}
              onValueChange={(value) => {
                const monthIndex = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].indexOf(value) + 1;
                setMonth(monthIndex);
              }}
            >
              <SelectTrigger className="w-[120px] h-8 bg-white">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }).map((_, i) => (
                  <SelectItem key={i + 1} value={getMonthName(i + 1)}>
                    {getMonthName(i + 1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
            >
              <SelectTrigger className="w-[100px] h-8 bg-white">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }).map((_, i) => {
                  const yearValue = new Date().getFullYear() - 2 + i;
                  return (
                    <SelectItem key={yearValue} value={yearValue.toString()}>
                      {yearValue}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
              &lt;
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
              &gt;
            </Button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div>
          {/* Days of week */}
          <div className="grid grid-cols-7 bg-gray-700 text-white">
            {daysOfWeek.map((day) => (
              <div key={day} className="p-2 text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((week, weekIndex) => (
              week.map((dayData, dayIndex) => {
                const dayOrders = getOrdersForDay(dayData.date);
                const isCurrentDay = isToday(dayData.date);
                const isSelected = isSelectedDate(dayData.date);
                
                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`border border-gray-200 p-2 h-32 overflow-y-auto relative cursor-pointer ${
                      dayData.currentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isCurrentDay ? 'bg-blue-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleDateSelect(dayData.date)}
                  >
                    {/* Day number */}
                    <div className={`absolute top-1 left-1 text-sm ${isCurrentDay ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                      {formatDateNumber(dayData.day)}
                    </div>
                    
                    {/* Today indicator */}
                    {isCurrentDay && (
                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                        Today
                      </div>
                    )}
                    
                    {/* Order items */}
                    <div className="mt-6 space-y-1">
                      {dayOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`text-xs p-1 rounded border-l-2 bg-white mb-1 hover:bg-gray-50`}
                          style={{ borderLeftColor: getEventTypeColor(order.eventType || 'Other') }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening date dialog
                            navigate(`/orders/${order.id}`);
                          }}
                        >
                          <div className="flex items-start">
                            <div 
                              className="w-2 h-2 rounded-full mt-0.5 mr-1"
                              style={{ backgroundColor: getEventTypeColor(order.eventType || 'Other') }}
                            />
                            <div className="flex-1">
                              <div className="font-medium truncate">
                                #{order.orderNumber?.split('-')[1]} - {order.contact?.firstName} {order.contact?.lastName}
                              </div>
                              <div className="text-gray-500 truncate">
                                {order.eventType} - {order.status}
                              </div>
                              {order.items && order.items.length > 0 && (
                                <div className="text-gray-500 truncate">
                                  {order.items[0].description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>
      
      {/* Date Selection Dialog */}
      <DateSelectionDialog
        isOpen={isDateDialogOpen}
        onClose={() => setIsDateDialogOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarFullWidth;