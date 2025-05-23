import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import EnhancedCalendar from '@/components/enhanced-calendar/EnhancedCalendar';

const SimpleDashboard = () => {
  const { theme } = useTheme();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Simple Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden transition-transform hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h2 className="text-3xl font-bold mt-1">$12,580.50</h2>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-500 font-medium">12%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden transition-transform hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h2 className="text-3xl font-bold mt-1">42</h2>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-500 font-medium">8%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden transition-transform hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Quotes</p>
                <h2 className="text-3xl font-bold mt-1">15</h2>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-500 font-medium">5%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden transition-transform hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <h2 className="text-3xl font-bold mt-1">28</h2>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <span className="text-green-500 font-medium">18%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Calendar */}
      <div className="mt-6">
        <EnhancedCalendar />
      </div>
    </div>
  );
};

export default SimpleDashboard;