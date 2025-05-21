import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FormatCurrency } from "@/components/ui/format-currency";
import { Mail, FileText, Info, Calendar, Tag, DollarSign, Clock, Truck, MapPin } from "lucide-react";

interface OrderCardProps {
  order: OrderWithItems;
  isSelected?: boolean;
  onClick?: () => void;
  onEmailClick?: (e: React.MouseEvent) => void;
  onDownloadClick?: (e: React.MouseEvent) => void;
}

// Format date to match screenshot format exactly
const formatOrderDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Format currency with $ sign and 2 decimal places
const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return "$0.00";
  return `$${parseFloat(value.toString()).toFixed(2)}`;
};

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
  onEmailClick,
  onDownloadClick,
}) => {
  const isQuote = order.status === 'Quote' || order.isQuote;
  const isPaid = order.status === 'Paid' || (order.balancePaid && order.depositPaid);
  const isCancelled = order.status === "Cancelled";
  
  // Generate order number with padded zeros
  const orderNumber = order.orderNumber || (order.id ? order.id.toString().padStart(2, '0') : '');
  
  // Format date strings for order header
  const eventDate = order.eventDate ? new Date(order.eventDate) : null;
  const orderDateDisplay = `#${orderNumber} - ${formatOrderDate(eventDate)}`;
  
  // Get customer name and handle null cases
  const customerName = order.contact 
    ? `${order.contact.firstName || ''} ${order.contact.lastName || ''}`.trim()
    : '';
  
  // Get business name if available
  const businessName = order.contact?.businessName || '';
  
  // Combine customer with event type (like in screenshot)
  const customerDisplay = customerName + (order.eventType ? ` (${order.eventType})` : '');
  
  // Get description or theme text to display under customer
  const descriptionText = order.notes || 
    (order.items && order.items.length > 0 ? (order.items[0].description || order.items[0].name) : '');
  
  // Handle email icon click
  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmailClick) onEmailClick(e);
  };
  
  // Handle document icon click
  const handleDocClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadClick) onDownloadClick(e);
  };

  return (
    <div
      className={`relative px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Left dot marker (red for normal orders, or square Q for quotes) */}
      <div className="absolute left-2 top-5">
        {isQuote ? (
          <div className="w-5 h-5 rounded-sm bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-300">
            Q
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-500"></div>
        )}
      </div>
      
      {/* Main content flex container */}
      <div className="flex justify-between ml-7">
        {/* Left column - Order details */}
        <div className="flex-1">
          {/* Order Number and Date */}
          <div className={`text-sm font-medium ${isCancelled ? "text-gray-400 line-through" : "text-gray-700"}`}>
            {orderDateDisplay}
          </div>
          
          {/* Customer Name with Event Type */}
          <div className={`${isCancelled ? "text-gray-400 line-through" : "text-blue-600"}`}>
            {customerDisplay}
          </div>
          
          {/* Business Name if available */}
          {businessName && (
            <div className="text-sm text-gray-500">
              {businessName} {businessName && order.contact?.address ? " - " + order.contact.address : ""}
            </div>
          )}
          
          {/* Description/Item Text */}
          <div className={`text-sm ${isCancelled ? "text-gray-400 line-through" : "text-gray-600"}`}>
            {descriptionText}
          </div>
          
          {/* Order Financial and Delivery Details */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
            {/* Tax Amount */}
            {order.tax && (
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                <span>Tax: {formatCurrency(order.tax)}</span>
              </div>
            )}
            
            {/* Tax Rate */}
            {order.taxRate && (
              <div className="flex items-center">
                <Info className="h-3 w-3 mr-1" />
                <span>Rate: {parseFloat(order.taxRate.toString()).toFixed(2)}%</span>
              </div>
            )}
            
            {/* Discount */}
            {order.discount && parseFloat(order.discount.toString()) > 0 && (
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                <span>Discount: {formatCurrency(order.discount)}</span>
              </div>
            )}
            
            {/* Deposit information */}
            {order.depositAmount && (
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>Deposit: {formatCurrency(order.depositAmount)}</span>
                {order.depositPaid && <span className="ml-1 text-green-600">✓</span>}
              </div>
            )}
            
            {/* Deposit Paid Date */}
            {order.depositPaidDate && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Paid on: {new Date(order.depositPaidDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {/* Balance Paid Date */}
            {order.balancePaidDate && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Fully paid: {new Date(order.balancePaidDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {/* Subtotal (if different from total) */}
            {order.subtotal && order.subtotal !== order.total && (
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>Subtotal: {formatCurrency(order.subtotal)}</span>
              </div>
            )}
            
            {/* Delivery Type */}
            {order.deliveryType && (
              <div className="flex items-center col-span-2">
                <Truck className="h-3 w-3 mr-1" />
                <span>{order.deliveryType}</span>
                {order.deliveryFee && <span className="ml-2">Fee: {formatCurrency(order.deliveryFee)}</span>}
              </div>
            )}
            
            {/* Delivery Date/Time */}
            {(order.deliveryDate || order.deliveryTime) && (
              <div className="flex items-center col-span-2">
                <Clock className="h-3 w-3 mr-1" />
                <span>
                  {order.deliveryDate && `${new Date(order.deliveryDate).toLocaleDateString()}`}
                  {order.deliveryDate && order.deliveryTime && " at "}
                  {order.deliveryTime && order.deliveryTime}
                </span>
              </div>
            )}
            
            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="flex items-center col-span-2">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{order.deliveryAddress}</span>
              </div>
            )}
            
            {/* Item summary */}
            {order.items && order.items.length > 0 && (
              <div className="flex items-start col-span-2 mt-1 border-t border-gray-100 pt-1">
                <div className="font-medium">Items ({order.items.length}):</div>
                <div className="ml-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="mb-0.5">
                      {item.quantity}× {item.name} ({formatCurrency(item.price)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Price and Status */}
        <div className="flex flex-col items-end ml-4 min-w-[80px]">
          {/* Price */}
          <div className="text-base font-medium text-right">
            {formatCurrency(order.total)}
          </div>
          
          {/* Status Badge */}
          <div className="mt-1 mb-auto">
            {isCancelled && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
            {isPaid && <Badge variant="default" className="text-xs py-1 px-2 bg-green-100 hover:bg-green-200 text-green-800">Paid</Badge>}
            {isQuote && <Badge variant="outline" className="text-xs">Quote</Badge>}
            {!isQuote && !isPaid && !isCancelled && <Badge variant="secondary" className="text-xs">Pending</Badge>}
          </div>
          
          {/* Action Icons */}
          <div className="flex space-x-1 mt-2">
            {onDownloadClick && (
              <button 
                onClick={handleDocClick}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <FileText className="h-4 w-4" />
              </button>
            )}
            {onEmailClick && (
              <button 
                onClick={handleEmailClick}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Mail className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
