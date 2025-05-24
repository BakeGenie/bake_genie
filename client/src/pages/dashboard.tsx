import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSignIcon, FileTextIcon, Clock4Icon, ClipboardCheckIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* This Week's Orders */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">This Week's Orders</CardTitle>
            <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
              + New Order
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border border-gray-300 rounded"></div>
                <div>
                  <p className="font-medium text-gray-900">#24 · Mike · 14 May 2025</p>
                  <p className="text-sm text-gray-600">Breakfast Tart (Birthday)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-900">$30.00</span>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                    <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="text-center py-4">
              <button className="text-blue-600 hover:text-blue-700 text-sm">All Orders</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Payments */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">Scheduled Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
              <span>Order</span>
              <span>Type</span>
              <span>Due Date</span>
              <span>Value</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm py-2">
              <span className="text-gray-900">#24 · Emily Parker</span>
              <span className="text-gray-600">Booking Fee</span>
              <span className="text-gray-600">Sun, 25 May 2025</span>
              <span className="text-gray-900">$50.00</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm py-2">
              <span className="text-gray-900">#25 · Shane Frankiel</span>
              <span className="text-gray-600">Booking Fee</span>
              <span className="text-gray-600">Sun, 25 May 2025</span>
              <span className="text-gray-900">$200.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Week's Events */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">This Week's Events</CardTitle>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
              View Calendar
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border border-gray-300 rounded"></div>
                <div>
                  <p className="font-medium text-gray-900">Thu 22 May 2025</p>
                  <p className="text-sm text-gray-600">6654</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Orders</CardTitle>
            <FileTextIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600">Active orders in system</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${stats?.totalRevenue || 0}</div>
            <p className="text-xs text-gray-600">From completed orders</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Upcoming Orders</CardTitle>
            <Clock4Icon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.upcomingOrders || 0}</div>
            <p className="text-xs text-gray-600">Due in next 7 days</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Pending Tasks</CardTitle>
            <ClipboardCheckIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.pendingTasks || 0}</div>
            <p className="text-xs text-gray-600">Tasks to complete</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-[#00c4cc]" />
              <h3 className="font-medium text-gray-900">New Order</h3>
              <p className="text-sm text-gray-600">Create a new order</p>
            </div>
          </Card>
          
          <Card className="bg-white border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <DollarSignIcon className="h-8 w-8 mx-auto mb-2 text-[#00c4cc]" />
              <h3 className="font-medium text-gray-900">Add Expense</h3>
              <p className="text-sm text-gray-600">Record new expense</p>
            </div>
          </Card>
          
          <Card className="bg-white border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <ClipboardCheckIcon className="h-8 w-8 mx-auto mb-2 text-[#00c4cc]" />
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-600">Business insights</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;