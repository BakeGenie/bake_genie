import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FormatCurrency } from "@/components/ui/format-currency";
import { Mail, FileText, Calendar, User, Truck, CreditCard } from "lucide-react";

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
  onEmailClick,
  onDownloadClick,
}) => {
  const isQuote = order.status === 'Quote';
  const isPaid = order.status === 'Paid';
  const isCancelled = order.status === "Cancelled";
  
  // Format date to display in standard format
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };
  
  // Handle email click
  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmailClick) onEmailClick(e);
  };
  
  // Handle document click
  const handleDocClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadClick) onDownloadClick(e);
  };
  
  // Get the total amount
  const totalAmount = order.total ? parseFloat(order.total.toString()) : 0;
  
  // Get customer name
  const customerName = order.contact 
    ? `${order.contact.firstName || ''} ${order.contact.lastName || ''}`
    : '';

  return (
    <div
      className={`relative px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : isCancelled ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Red indicator dot */}
      <div className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-red-500"></div>
      
      {/* Order header with number and price */}
      <div className="mb-2 pb-2 border-b border-gray-100">
        <div className="flex justify-between">
          <div className="flex ml-3">
            <div className="font-medium text-gray-800">
              {order.orderNumber ? `#${order.orderNumber}` : `#${order.id?.toString().padStart(2, '0')}`}
            </div>
          </div>
          <div className="text-base font-medium flex items-center">
            <CreditCard className="h-4 w-4 text-gray-400 mr-1" />
            <span>$ <FormatCurrency amount={totalAmount} showSymbol={false} /></span>
          </div>
        </div>
      </div>
      
      {/* Main info section */}
      <div className="grid gap-2 pl-3">
        {/* Customer info */}
        {customerName && (
          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-500 mr-2" />
            <div className={`text-sm ${isCancelled ? "text-gray-400 line-through" : "text-blue-600"}`}>
              {customerName}
            </div>
          </div>
        )}
        
        {/* Event details */}
        {order.eventType && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <div className="text-sm text-gray-700">
              <span className="font-medium">{order.eventType}</span>
              {order.eventDate && <span> - {formatDate(order.eventDate)}</span>}
            </div>
          </div>
        )}
        
        {/* Delivery info */}
        {order.deliveryType && (
          <div className="flex items-center">
            <Truck className="h-4 w-4 text-gray-500 mr-2" />
            <div className="text-sm text-gray-700">
              {order.deliveryType}
              {order.deliveryTime && ` at ${order.deliveryTime}`}
            </div>
          </div>
        )}
        
        {/* Notes */}
        {order.notes && (
          <div className="text-sm text-gray-600 mt-1 pl-6">
            <span className="italic">{order.notes}</span>
          </div>
        )}
        
        {/* Item summary */}
        {order.items && order.items.length > 0 && (
          <div className="text-sm text-gray-700 mt-1 pl-6">
            <span className="font-medium">Items:</span> {order.items.length} 
            {order.items.map((item, i) => (
              <span key={i} className="ml-2">
                {i > 0 && ", "}
                {item.quantity}x {item.name || item.description}
              </span>
            )).slice(0, 2)}
            {order.items.length > 2 && <span>...</span>}
          </div>
        )}
      </div>
      
      {/* Footer with status and actions */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        {/* Status badge */}
        <div>
          {isCancelled && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
          {isPaid && <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>}
          {isQuote && <Badge variant="outline" className="text-xs">Quote</Badge>}
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2">
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
  );
};

export default OrderCard;
