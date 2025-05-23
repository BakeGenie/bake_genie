import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon, FileTextIcon, Clock4Icon, ClipboardCheckIcon, BarChartIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Link } from "wouter";
import SidebarCalendar from "@/components/calendar/sidebar-calendar";
import { DashboardStats } from "@/types/dashboard";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileTextIcon className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Including cancelled orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileTextIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/quotes">
                <span className="text-primary-500 hover:underline cursor-pointer">Active: {stats?.activeQuotes || 0}</span>
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              From confirmed and paid orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Orders</CardTitle>
            <Clock4Icon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              In the next 7 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <ClipboardCheckIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/tasks">
                <span className="text-primary-500 hover:underline cursor-pointer">View task list</span>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Revenue from orders over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats?.monthlyRevenue || []} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value}`, 'Revenue']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional analytics and calendar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Upcoming orders and events</CardDescription>
          </CardHeader>
          <CardContent>
            <SidebarCalendar />
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Orders by Type</CardTitle>
            <CardDescription>
              Distribution of orders by event type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats?.ordersByType || []} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <XAxis type="number" />
                  <YAxis dataKey="type" type="category" width={100} />
                  <Tooltip 
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--chart-1))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>
              Access frequently used features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/orders">
                <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center text-center cursor-pointer">
                  <FileTextIcon className="h-8 w-8 text-primary-500 mb-2" />
                  <span className="text-sm font-medium">Orders & Quotes</span>
                </div>
              </Link>
              <Link href="/calendar">
                <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center text-center cursor-pointer">
                  <Clock4Icon className="h-8 w-8 text-amber-500 mb-2" />
                  <span className="text-sm font-medium">Calendar</span>
                </div>
              </Link>
              <Link href="/reports">
                <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center text-center cursor-pointer">
                  <BarChartIcon className="h-8 w-8 text-blue-500 mb-2" />
                  <span className="text-sm font-medium">Reports</span>
                </div>
              </Link>
              <Link href="/tasks">
                <div className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center text-center cursor-pointer">
                  <ClipboardCheckIcon className="h-8 w-8 text-green-500 mb-2" />
                  <span className="text-sm font-medium">Tasks</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
