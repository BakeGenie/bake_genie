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
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Orders</CardTitle>
            <FileTextIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-gray-600">
              Active orders in system
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Total Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">${stats?.totalRevenue || 0}</div>
            <p className="text-xs text-gray-600">
              From completed orders
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Orders */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Upcoming Orders</CardTitle>
            <Clock4Icon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.upcomingOrders || 0}</div>
            <p className="text-xs text-gray-600">
              Due in next 7 days
            </p>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">Pending Tasks</CardTitle>
            <ClipboardCheckIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.pendingTasks || 0}</div>
            <p className="text-xs text-gray-600">
              Tasks to complete
            </p>
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