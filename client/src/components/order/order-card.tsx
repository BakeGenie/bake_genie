import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FormatCurrency } from "@/components/ui/format-currency";

interface OrderCardProps {
  order: OrderWithItems;
  isSelected?: boolean;
  onClick?: () => void;
  onEmailClick?: (e: React.MouseEvent) => void;
  onDownloadClick?: (e: React.MouseEvent) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
}) => {
  const isQuote = order.status === 'Quote';
  const isPaid = order.status === 'Paid';
  const isCancelled = order.status === "Cancelled";
  
  // Format date to display in standard format
  const formattedDate = order.eventDate ? 
    new Date(order.eventDate).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }) : "";

  // Get the amount from the total field
  const amount = order.total || 0;
  
  // Generate order number display
  const orderNumber = order.orderNumber || `#${order.id?.toString().padStart(2, '0')}`;
  
  // Get customer name from contact
  const customerName = order.contact 
    ? `${order.contact.firstName || ''} ${order.contact.lastName || ''}`
    : '';

  return (
    <div
      className={`relative flex justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : isCancelled ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Left side with red dot and order details */}
      <div className="flex flex-col">
        {/* Red indicator dot and order number/date */}
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
          <div className="text-sm font-medium text-gray-600">
            {orderNumber} - {formattedDate}
          </div>
        </div>
        
        {/* Customer name with event type */}
        <div className="text-sm pl-5 mt-1 text-blue-600">
          {customerName} {order.eventType && `(${order.eventType})`}
        </div>
        
        {/* Display all order items with full details */}
        {order.items && order.items.length > 0 && (
          <div className="pl-5">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm text-gray-700 mt-1">
                <span className="font-medium">{item.quantity}x</span> {item.name || item.description} 
                {item.unitPrice && <span className="text-gray-500 ml-2">${parseFloat(item.unitPrice.toString()).toFixed(2)}/ea</span>}
                {item.price && <span className="text-gray-500 ml-2">= ${parseFloat(item.price.toString()).toFixed(2)}</span>}
                {item.notes && <div className="text-xs text-gray-500 ml-4">{item.notes}</div>}
              </div>
            ))}
          </div>
        )}
        
        {/* Delivery information if available */}
        {order.deliveryType && (
          <div className="text-xs pl-5 text-gray-500 mt-1">
            Delivery: {order.deliveryType}
            {order.deliveryTime && ` - ${order.deliveryTime}`}
          </div>
        )}
      </div>
      
      {/* Right side with price and status */}
      <div className="flex flex-col items-end">
        {/* Price amount */}
        <div className="text-base font-medium">
          $ <FormatCurrency amount={amount} showSymbol={false} />
        </div>
        
        {/* Status badge */}
        <div className="mt-1">
          {isQuote && <Badge variant="outline" className="text-xs">Quote</Badge>}
          {isPaid && <Badge variant="default" className="text-xs">Paid</Badge>}
          {isCancelled && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
