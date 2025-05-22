import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon, FilterIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { OrderWithItems } from "@/types";
import OrderDetailsDialog from "@/components/order/order-details-dialog";
import CalendarDateDialog from "@/components/calendar/calendar-date-dialog";
import CalendarOrderDialog from "@/components/calendar/calendar-order-dialog";
import { Badge } from "@/components/ui/badge";
import { eventTypeColors } from "@/lib/constants";
import { EventType, eventTypes } from "@shared/schema";

const CalendarStandalone = () => {
  const [_, navigate] = useLocation();
  
  // Get current month and year
  const currentDate = new Date();
  const [month, setMonth] = React.useState(currentDate.getMonth() + 1); // 1-12
  const [year, setYear] = React.useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<OrderWithItems | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = React.useState(false);
  const [ordersOnSelectedDate, setOrdersOnSelectedDate] = React.useState<OrderWithItems[]>([]);
  
  // Check for date in URL query parameters or localStorage
  React.useEffect(() => {
    // 1. First check URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    
    // 2. Then check localStorage
    const storedDate = localStorage.getItem('selectedCalendarDate');
    
    // Use date from either source
    if (dateParam) {
      try {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          // Valid date - set the selected date and update month/year
          setSelectedDate(parsedDate);
          setMonth(parsedDate.getMonth() + 1);
          setYear(parsedDate.getFullYear());
        }
      } catch (e) {
        console.error("Error parsing date from URL:", e);
      }
    } else if (storedDate) {
      try {
        const parsedDate = new Date(storedDate);
        if (!isNaN(parsedDate.getTime())) {
          // Valid date - set the selected date and update month/year
          setSelectedDate(parsedDate);
          setMonth(parsedDate.getMonth() + 1);
          setYear(parsedDate.getFullYear());
          
          // Clear localStorage after using it
          localStorage.removeItem('selectedCalendarDate');
        }
      } catch (e) {
        console.error("Error parsing stored date:", e);
      }
    }
  }, []);
  
  // Fetch orders
  const { data: rawOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/orders'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
  
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
      theme: order.theme,
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
  
  // Handle date selection when clicking on a calendar day
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Find orders for this date
    const ordersForDate = getOrdersForDay(date);
    setOrdersOnSelectedDate(ordersForDate);
    
    // Open the date dialog with appropriate options
    setIsDateDialogOpen(true);
    
    // Store selected date for order creation
    localStorage.setItem('selectedEventDate', date.toISOString());
  };
  
  // Handle order selection for details
  const handleOrderSelect = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
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
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar Column - Takes 2/3 width on md screens and larger */}
        <div className="md:col-span-2">
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
                                handleOrderSelect(order);
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
        </div>
        
        {/* Orders List Column - Takes 1/3 width */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-md shadow-sm border h-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </h3>
            </div>
            
            <div className="p-4">
              {selectedDate && (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        localStorage.setItem('selectedEventDate', selectedDate.toISOString());
                        navigate('/orders/new');
                      }}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" /> Add Order
                    </Button>
                  </div>
                  
                  {/* Orders for selected date */}
                  <div className="space-y-3">
                    {getOrdersForDay(selectedDate).length > 0 ? (
                      getOrdersForDay(selectedDate).map((order) => (
                        <div 
                          key={order.id}
                          className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleOrderSelect(order)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">
                                Order #{order.orderNumber?.split('-')[1]}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.contact?.firstName} {order.contact?.lastName}
                              </div>
                            </div>
                            <Badge 
                              className="ml-2"
                              style={{ 
                                backgroundColor: getEventTypeColor(order.eventType || 'Other'),
                                color: '#fff'
                              }}
                            >
                              {order.eventType}
                            </Badge>
                          </div>
                          
                          <div className="mt-2 text-sm">
                            <div>Status: <span className="font-medium">{order.status}</span></div>
                            <div>Total: <span className="font-medium">${parseFloat(order.totalAmount || '0').toFixed(2)}</span></div>
                            {order.items && order.items.length > 0 && (
                              <div className="mt-1 text-gray-500">
                                {order.items.map((item: any, index: number) => (
                                  <div key={index} className="truncate">
                                    {item.quantity}x {item.description || item.name}
                                  </div>
                                )).slice(0, 2)}
                                {order.items.length > 2 && (
                                  <div className="text-xs text-blue-500">+ {order.items.length - 2} more items</div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('selectedOrder', JSON.stringify(order));
                                navigate(`/orders/${order.id}`);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">No orders for this date</div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            localStorage.setItem('selectedEventDate', selectedDate.toISOString());
                            navigate('/orders/new');
                          }}
                        >
                          <PlusIcon className="h-4 w-4 mr-1" /> Create Order
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {!selectedDate && (
                <div className="text-center py-16 text-gray-500">
                  <div className="mb-2">Select a date on the calendar</div>
                  <div className="text-sm">to view or create orders</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendar Date Dialog */}
      <CalendarDateDialog
        isOpen={isDateDialogOpen}
        onClose={() => setIsDateDialogOpen(false)}
        selectedDate={selectedDate}
        ordersOnDate={ordersOnSelectedDate}
        onOrderSelect={handleOrderSelect}
      />
      
      {/* Order Details Dialog */}
      <OrderDetailsDialog
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        order={selectedOrder}
      />
      
      {/* Calendar Order Dialog - shows the selected order details in the calendar view */}
      <CalendarOrderDialog
        isOpen={isOrderDetailsOpen}
        onClose={() => setIsOrderDetailsOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default CalendarStandalone;