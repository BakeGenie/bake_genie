import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';

// Status colors for different order statuses
const statusColors = {
  'Draft': 'bg-yellow-400',
  'Pending': 'bg-blue-400',
  'Confirmed': 'bg-green-400',
  'Paid': 'bg-emerald-500',
  'Delivered': 'bg-purple-400',
  'Completed': 'bg-green-600',
  'Cancelled': 'bg-red-500'
};

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  status: string;
}

const EnhancedCalendar = () => {
  const { theme } = useTheme();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Fetch orders data
  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Process orders into calendar events
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      const calendarEvents = orders.map(order => ({
        id: order.id,
        date: new Date(order.eventDate),
        title: order.order_number || `Order #${order.id}`,
        status: order.status
      }));
      setEvents(calendarEvents);
    }
  }, [orders]);

  // Custom day rendering with status dots
  const renderDay = (day: Date) => {
    // Filter events for this day
    const dayEvents = events.filter(event => isSameDay(event.date, day));
    
    // Get unique statuses for the day
    const statuses = [...new Set(dayEvents.map(event => event.status))];
    
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="text-lg font-bold">{format(day, 'd')}</div>
        
        {dayEvents.length > 0 && (
          <div className="absolute bottom-1 flex items-center justify-center gap-1">
            {statuses.map((status, i) => (
              <div 
                key={i}
                className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-400'}`}
                title={`${status}: ${dayEvents.filter(e => e.status === status).length} orders`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden transition-all duration-300`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between items-center">
          <span>Calendar</span>
          <span className="text-sm font-normal text-muted-foreground">
            {date ? format(date, 'MMMM yyyy') : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border shadow-sm p-3"
          classNames={{
            day_today: "bg-primary/20 text-primary-foreground font-bold",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day: "h-10 w-10 text-center rounded-full hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            head_cell: "text-primary font-medium",
            cell: "relative p-0",
            row: "flex w-full mt-2",
            table: "w-full border-collapse",
            nav_button: "h-7 w-7 bg-transparent p-0 hover:bg-accent rounded-full",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium"
          }}
          components={{
            Day: ({ day }) => renderDay(day)
          }}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedCalendar;