import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react";
import OrderForm from "@/components/order/order-form";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import OrderCalendar from "@/components/order/order-calendar";

const Orders = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Check if we should open the new order dialog
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const shouldOpenNew = searchParams.get("newOrder") === "true";
  const preselectedDate = searchParams.get("date");

  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] =
    React.useState(shouldOpenNew);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [selectedDate, setSelectedDate] = React.useState<Date | null>(
    preselectedDate ? new Date(preselectedDate) : null,
  );

  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());

  // Fetch orders
  const { data: rawOrders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  console.log("Orders from API:", rawOrders);

  // Transform backend data to frontend format
  const orders = React.useMemo(() => {
    return (Array.isArray(rawOrders) ? rawOrders : []).map((order: any) => ({
      id: order.id,
      userId: order.user_id,
      contactId: order.contact_id,
      orderNumber: order.order_number,
      eventType: order.event_type,
      eventDate: order.event_date,
      status: order.status,
      deliveryType: order.delivery_type,
      deliveryTime: order.delivery_time,
      total: order.total_amount,
      totalAmount: order.total_amount,
      amountPaid: order.amount_paid,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      contact: order.contact,
      items: order.items || [],
    }));
  }, [rawOrders]);

  // States for filters
  const [filterMode, setFilterMode] = React.useState("all"); // "all" or "month"
  
  // Filter orders based on current filter mode
  const filteredOrders = React.useMemo(() => {
    // First apply date filtering if in month mode
    const dateFiltered = filterMode === "month" 
      ? orders.filter((order: any) => {
          if (!order.eventDate) return false;
          
          try {
            const orderDate = new Date(order.eventDate);
            // Check if the date is valid before comparing
            if (isNaN(orderDate.getTime())) {
              console.warn("Invalid date found:", order.eventDate, "for order:", order.id);
              return false;
            }
            return (
              orderDate.getMonth() + 1 === month && orderDate.getFullYear() === year
            );
          } catch (error) {
            console.error("Error parsing date for order:", order.id, error);
            return false;
          }
        })
      : orders; // Show all orders if in "all" mode
    
    // Then sort the filtered results by date
    return dateFiltered.sort((a: any, b: any) => {
      try {
        if (!a.eventDate || !b.eventDate) {
          return 0;
        }
        return (
          new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );
      } catch (error) {
        return 0;
      }
    });
  }, [orders, month, year, filterMode]);

  const handleOrderClick = (order: any) => {
    navigate(`/orders/${order.id}`);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getMonthName = (monthNum: number): string => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return monthNames[monthNum - 1];
  };

  const closeNewOrderDialog = () => {
    setIsNewOrderDialogOpen(false);

    // Remove the query parameter from the URL
    if (shouldOpenNew) {
      navigate("/orders");
    }
  };

  const handleNewOrderSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Submit the order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      // Invalidate the orders query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });

      toast({
        title: "Order created",
        description: "The order has been created successfully.",
      });

      // Close the dialog
      closeNewOrderDialog();
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Orders & Quotes"
        actions={
          <>
            <Button
              onClick={() => setIsFilterDialogOpen(true)}
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-gray-200 hover:bg-gray-100 hover:text-gray-900"
            >
              <FilterIcon className="h-5 w-5" />
            </Button>
            <Button 
              onClick={() => setIsNewOrderDialogOpen(true)}
              className="rounded-full bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </>
        }
      />

      {/* Tools and Views Selector */}
      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search orders..." 
              className="pl-9 w-64 rounded-full border-gray-200 focus-visible:ring-blue-500" 
            />
          </div>
          
          {/* Filter Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-full">
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterMode === "all" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setFilterMode("all")}
            >
              All Orders
            </button>
            <button
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterMode === "month" 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setFilterMode("month")}
            >
              Current Month
            </button>
          </div>

          {/* Month/Year Selector - Only visible when "month" filter is active */}
          {filterMode === "month" && (
            <div className="flex space-x-2">
              <Select
                value={month.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger className="w-[150px] rounded-full border-gray-200">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-lg">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {getMonthName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger className="w-[120px] rounded-full border-gray-200">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-lg">
                  {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Month/Year display - Only visible when "month" filter is active */}
        {filterMode === "month" && (
          <div className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            {getMonthName(month)} {year}
          </div>
        )}
        
        {/* Total Orders Count - Show when displaying all */}
        {filterMode === "all" && (
          <div className="text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            {orders.length} Total Orders
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 flex-grow mx-2">
        {/* Today's Date */}
        <div className="mb-2 md:mb-0 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 font-medium">Today's Date</div>
          <div className="flex items-baseline mt-1">
            <span className="text-5xl font-bold mr-3 text-blue-600">
              {format(new Date(), "dd")}
            </span>
            <div className="flex flex-col">
              <span className="text-xl font-medium">
                {format(new Date(), "MMMM")}
              </span>
              <span className="text-sm text-gray-500">
                {format(new Date(), "EEEE")}
              </span>
            </div>
          </div>
        </div>
        {/* Calendar and Date Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex flex-row md:justify-between items-center mb-4">
              {/* Month Selector */}
              <div className="flex items-center space-x-3">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                  onClick={() => {
                    const newMonth = month === 1 ? 12 : month - 1;
                    const newYear = month === 1 ? year - 1 : year;
                    setMonth(newMonth);
                    setYear(newYear);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div className="text-xl font-medium text-gray-800">
                  {getMonthName(month)} {year}
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                  onClick={() => {
                    const newMonth = month === 12 ? 1 : month + 1;
                    const newYear = month === 12 ? year + 1 : year;
                    setMonth(newMonth);
                    setYear(newYear);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              
              {/* Legend */}
              <div className="hidden md:flex items-center space-x-4 text-xs">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                  <span>Quote</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                  <span>Completed</span>
                </div>
              </div>
            </div>

            {/* Calendar Component */}
            <OrderCalendar
              orders={orders}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              month={month}
              year={year}
            />
          </div>
        </div>

        {/* Order List */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800">Orders</h3>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 rounded-full px-4 border-gray-200"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                <FilterIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Filter</span>
              </Button>
            </div>
          </div>
          <div className="flex-grow overflow-auto max-h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-center p-6">
                <div className="text-gray-300 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">
                  No orders found
                </h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                  No orders found for {getMonthName(month)} {year}. Try
                  adjusting your filters or create a new order.
                </p>
                <Button
                  className="mt-6 rounded-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsNewOrderDialogOpen(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create New Order
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredOrders.map((order: any) => {
                  // Format the date
                  const orderDate = new Date(order.eventDate);
                  const formattedDate = format(orderDate, "dd MMM yyyy");

                  // Format price
                  const price = parseFloat(order.totalAmount || "0").toFixed(2);

                  // Determine status style
                  const isCancelled = order.status === "Cancelled";

                  return (
                    <li
                      key={order.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${isCancelled ? "bg-gray-100" : ""}`}
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-start space-x-2">
                          {order.status === "Quote" && (
                            <div className="mt-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                          )}
                          {order.status === "In Progress" && (
                            <div className="mt-1.5">
                              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            </div>
                          )}

                          <div>
                            <div className="text-gray-500 text-xs">
                              #{order.orderNumber} - {formattedDate}
                            </div>
                            <div className="text-blue-600 font-medium">
                              {order.contact
                                ? `${order.contact.firstName} ${order.contact.lastName}`
                                : `Contact #${order.contactId}`}
                              <span className="text-gray-500 font-normal ml-1">
                                ({order.eventType})
                              </span>
                            </div>
                            <div className="text-gray-700 text-sm mt-1 line-clamp-1">
                              {order.notes || "No description available"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="font-medium text-right">
                            $ {price}
                          </div>
                          <div className="mt-1 flex space-x-1 items-center">
                            <span
                              className={
                                isCancelled
                                  ? "bg-gray-500 text-white text-xs px-2 py-0.5 rounded"
                                  : order.status === "Paid"
                                    ? "bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded"
                                    : order.status === "Quote"
                                      ? "bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                                      : "bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded"
                              }
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className="flex space-x-1 mt-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* New Order Dialog */}
      <Dialog
        open={isNewOrderDialogOpen}
        onOpenChange={setIsNewOrderDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogTitle>New Order</DialogTitle>
          <DialogDescription>
            Create a new order by filling out the form below.
          </DialogDescription>
          <OrderForm
            onSubmit={handleNewOrderSubmit}
            initialValues={
              selectedDate
                ? { eventDate: selectedDate, orderDate: new Date() }
                : { eventDate: new Date() }
            }
          />
        </DialogContent>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogTitle>Filter Orders</DialogTitle>
          <DialogDescription>
            Apply filters to narrow down the orders list.
          </DialogDescription>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="wedding">Wedding</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Delivery Type</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsFilterDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button>Apply Filters</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
