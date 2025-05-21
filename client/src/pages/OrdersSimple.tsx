import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const OrdersSimple = () => {
  const [location, navigate] = useLocation();
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  
  // Fetch all orders from the API
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  console.log("Orders from API:", orders);
  
  // Filter orders for the current month/year
  const filteredOrders = React.useMemo(() => {
    if (!Array.isArray(orders)) return [];
    
    return orders.filter((order: any) => {
      const orderDate = new Date(order.event_date);
      return orderDate.getMonth() + 1 === month && 
             orderDate.getFullYear() === year;
    }).sort((a: any, b: any) => {
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
  }, [orders, month, year]);

  console.log("Filtered orders:", filteredOrders);
  
  const handleOrderClick = (order: any) => {
    navigate(`/orders/${order.id}`);
  };
  
  const getMonthName = (monthNum: number): string => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[monthNum - 1];
  };
  
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Orders & Quotes"
        actions={
          <Button onClick={() => navigate('/orders/new')} className="bg-blue-500 hover:bg-blue-600">
            New Order
          </Button>
        }
      />
      
      {/* Month selector */}
      <div className="bg-white p-4 rounded-md border mb-4">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Order Period:</h3>
        <div className="flex space-x-2">
          <select 
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-1 border rounded"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          
          <select 
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-1 border rounded"
          >
            {Array.from({ length: 5 }, (_, i) => year - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Orders list */}
      <div className="bg-white rounded-md border flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders found for {getMonthName(month)} {year}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredOrders.map((order: any) => {
              // Format the date
              const orderDate = new Date(order.event_date);
              const formattedDate = `${orderDate.getDate()} ${format(orderDate, 'MMM')} ${orderDate.getFullYear()}`;
              const dayName = format(orderDate, 'EEE');
              
              // Format price
              const price = parseFloat(order.total_amount || '0').toFixed(2);
              
              // Determine status style
              const isPaid = order.status === 'Paid';
              const isCancelled = order.status === 'Cancelled';
              
              return (
                <li 
                  key={order.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${isCancelled ? 'bg-gray-100' : ''}`}
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="flex justify-between">
                    <div className="flex space-x-3">
                      <div className="mt-1">
                        <div className={`w-3 h-3 rounded-full ${isCancelled ? 'bg-gray-400' : 'bg-red-500'}`}></div>
                      </div>
                      
                      <div>
                        <div className="text-gray-500 text-sm">
                          #{order.order_number} - {dayName}, {formattedDate}
                        </div>
                        <div className="text-blue-600">
                          Contact #{order.contact_id} <span className="text-gray-500">({order.event_type})</span>
                        </div>
                        <div className="text-gray-700 text-sm">
                          {order.notes || "No description available"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium">$ {price}</div>
                      <div className="mt-1">
                        <span className={
                          isCancelled 
                            ? "bg-gray-500 text-white text-xs px-2 py-0.5 rounded" 
                            : isPaid 
                              ? "bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded" 
                              : "bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                        }>
                          {order.status}
                        </span>
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
  );
};

export default OrdersSimple;