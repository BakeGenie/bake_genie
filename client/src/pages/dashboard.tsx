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
      {/* Priority Dashboard Sections */}
      <div className="space-y-6">
        {/* Upcoming Orders - Priority View */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Orders</CardTitle>
              <Clock4Icon className="h-6 w-6 text-[#00c4cc]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{stats?.upcomingOrders || 0}</div>
                <p className="text-sm text-gray-600">Due in next 7 days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">2</div>
                <p className="text-sm text-gray-600">Due this week</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">1</div>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">Next delivery: <span className="font-medium">Birthday Cake - Tomorrow 2:00 PM</span></p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Pending Tasks</CardTitle>
                <ClipboardCheckIcon className="h-6 w-6 text-[#00c4cc]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">{stats?.pendingTasks || 0}</span>
                  <span className="text-sm text-gray-600">Total tasks</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">High priority</span>
                    <span className="font-medium text-red-600">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Medium priority</span>
                    <span className="font-medium text-orange-600">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Low priority</span>
                    <span className="font-medium text-gray-600">0</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">Next: <span className="font-medium">Follow up with client about wedding cake details</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Payments */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Scheduled Payments</CardTitle>
                <DollarSignIcon className="h-6 w-6 text-[#00c4cc]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">$850</span>
                  <span className="text-sm text-gray-600">Expected this week</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending invoices</span>
                    <span className="font-medium text-orange-600">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overdue payments</span>
                    <span className="font-medium text-red-600">1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid this month</span>
                    <span className="font-medium text-green-600">8</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">Next payment: <span className="font-medium">$400 due Friday</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
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