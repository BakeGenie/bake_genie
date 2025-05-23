import React from 'react';
import EnhancedCalendar from '@/components/enhanced-calendar/EnhancedCalendar';

const Calendar = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">Manage your orders and schedule with our enhanced calendar.</p>
      
      <div className="mt-6">
        <EnhancedCalendar />
      </div>
    </div>
  );
};

export default Calendar;