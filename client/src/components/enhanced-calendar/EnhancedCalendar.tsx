import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarX } from 'lucide-react';

// Status colors for different order statuses
const statusColors = {
  'Draft': 'bg-yellow-400',
  'Pending': 'bg-blue-400',
  'Confirmed': 'bg-green-400',
  'Paid': 'bg-emerald-500',
  'Delivered': 'bg-purple-400',
  'Completed': 'bg-green-600',
  'Cancelled': 'bg-red-500',
  'Blocked': 'bg-gray-500'
};

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  status: string;
}

interface CalendarDayProps {
  date: Date;
  displayValue?: string;
}

const EnhancedCalendar = () => {
  const { theme } = useTheme();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch orders data
  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Process orders into calendar events
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      const calendarEvents = orders.map(order => ({
        id: order.id,
        date: new Date(order.event_date || order.eventDate), // Handle both naming conventions
        title: order.order_number || `Order #${order.id}`,
        status: order.status
      }));
      
      // Add any blocked dates that might be stored separately
      // This would need to be fetched from the API as well
      
      setEvents(calendarEvents);
      console.log('Orders from API:', orders);
    }
  }, [orders]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsBlocked(false); // Reset blocked state when selecting a new day
    setIsDialogOpen(true);
  };

  const saveBlockedDate = () => {
    if (selectedDay && isBlocked) {
      // Here we would send an API request to save the blocked date
      // For now, we'll just add it to our local events array
      setEvents(prev => [
        ...prev,
        {
          id: Date.now(), // Temporary ID
          date: selectedDay,
          title: 'Blocked Date',
          status: 'Blocked'
        }
      ]);
    }
    setIsDialogOpen(false);
  };

  // Custom day rendering with status dots
  const renderDay = (props: CalendarDayProps) => {
    const day = props.date;
    
    // Filter events for this day
    const dayEvents = events.filter(event => {
      try {
        return event && event.date && isSameDay(event.date, day);
      } catch (e) {
        console.log('Error comparing dates:', e);
        return false;
      }
    });
    
    // Get unique statuses for the day
    const statusSet = new Set<string>();
    dayEvents.forEach(event => {
      if (event.status) statusSet.add(event.status);
    });
    const statuses = Array.from(statusSet);
    
    // Is this day blocked?
    const isDateBlocked = dayEvents.some(event => event.status === 'Blocked');
    
    return (
      <div 
        className={`relative h-full w-full flex items-center justify-center cursor-pointer
                    ${isDateBlocked ? 'bg-gray-200/50 dark:bg-gray-700/50' : ''}`}
        onClick={() => handleDayClick(day)}
      >
        <div className="text-lg font-bold">{format(day, 'd')}</div>
        
        {dayEvents.length > 0 && !isDateBlocked && (
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
        
        {isDateBlocked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <CalendarX className="h-6 w-6 text-gray-800" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className={`shadow-glow-primary overflow-hidden transition-all duration-300`}>
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
              Day: renderDay
            }}
          />
        </CardContent>
      </Card>
      
      {/* Day Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedDay ? format(selectedDay, 'EEEE, MMMM d, yyyy') : ''}
            </DialogTitle>
            <DialogDescription>
              View details or block out this date
            </DialogDescription>
          </DialogHeader>
          
          {selectedDay && (
            <div className="py-4">
              {/* List of events for this day */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Orders & Events</h3>
                {events.filter(event => event.date && isSameDay(event.date, selectedDay) && event.status !== 'Blocked').length > 0 ? (
                  <ul className="space-y-2">
                    {events
                      .filter(event => event.date && isSameDay(event.date, selectedDay) && event.status !== 'Blocked')
                      .map(event => (
                        <li key={event.id} className="p-2 rounded border">
                          <div className="flex justify-between">
                            <span>{event.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[event.status as keyof typeof statusColors]?.replace('bg-', 'bg-opacity-20 text-')}`}>
                              {event.status}
                            </span>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No orders or events scheduled.</p>
                )}
              </div>
              
              {/* Block date option */}
              <div className="flex items-center space-x-2">
                <Switch id="block-date" checked={isBlocked} onCheckedChange={setIsBlocked} />
                <Label htmlFor="block-date">Block out this date</Label>
              </div>
              
              {isBlocked && (
                <p className="text-sm text-muted-foreground mt-2">
                  Blocking this date will prevent new orders from being scheduled on this day.
                </p>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveBlockedDate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedCalendar;