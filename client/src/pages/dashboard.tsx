import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import EnhancedCalendar from '@/components/enhanced-calendar/EnhancedCalendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUpRight, Users, CreditCard, DollarSign, TrendingUp, Calendar, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { theme } = useTheme();
  
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });
  
  // Placeholder data for charts (will be replaced with API data)
  const orderStatusData = [
    { name: 'Draft', value: 5 },
    { name: 'Pending', value: 10 },
    { name: 'Confirmed', value: 15 },
    { name: 'Paid', value: 25 },
    { name: 'Delivered', value: 18 },
    { name: 'Completed', value: 20 },
    { name: 'Cancelled', value: 7 },
  ];
  
  const quotesByTypeData = [
    { name: 'Birthday', value: 15 },
    { name: 'Wedding', value: 9 },
    { name: 'Anniversary', value: 6 },
    { name: 'Corporate', value: 8 },
    { name: 'Other', value: 12 },
  ];
  
  const monthlyRevenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 5000 },
    { name: 'Mar', revenue: 6000 },
    { name: 'Apr', revenue: 7000 },
    { name: 'May', revenue: 8500 },
    { name: 'Jun', revenue: 9800 },
  ];

  // Chart colors for different status types
  const COLORS = {
    Draft: 'hsl(45, 93%, 47%)',
    Pending: 'hsl(214, 100%, 60%)',
    Confirmed: 'hsl(162, 94%, 30%)',
    Paid: 'hsl(142, 71%, 45%)',
    Delivered: 'hsl(262, 83%, 58%)',
    Completed: 'hsl(142, 71%, 35%)',
    Cancelled: 'hsl(0, 84%, 60%)',
    
    // Event types
    Birthday: '#FF5252',
    Wedding: '#4CAF50',
    Anniversary: '#FFAB91',
    Corporate: '#9E9E9E',
    Other: '#607D8B',
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden transition-transform hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <h2 className="text-3xl font-bold mt-1">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </h2>
                )}
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
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
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <h2 className="text-3xl font-bold mt-1">
                    {stats?.orderCount || 0}
                  </h2>
                )}
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
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
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <h2 className="text-3xl font-bold mt-1">
                    {stats?.activeQuotes || 0}
                  </h2>
                )}
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
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
                {statsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                ) : (
                  <h2 className="text-3xl font-bold mt-1">
                    {stats?.customerCount || 0}
                  </h2>
                )}
              </div>
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">18%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="revenue">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="quotes">Quotes</TabsTrigger>
              </TabsList>
            </div>
            
            <Card className={`${theme === 'dark' ? 'shadow-glow-primary' : ''} overflow-hidden`}>
              <CardContent className="p-6">
                <TabsContent value="revenue" className="mt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyRevenueData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value}`} />
                        <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="orders" className="mt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {orderStatusData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[entry.name as keyof typeof COLORS]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                
                <TabsContent value="quotes" className="mt-0">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quotesByTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {quotesByTypeData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[entry.name as keyof typeof COLORS]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <EnhancedCalendar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;