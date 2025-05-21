import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Mail, FileText } from "lucide-react";
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
  onEmailClick,
  onDownloadClick,
}) => {
  const isQuote = order.status === 'Quote';
  const isPaid = order.status === 'Paid';
  const isCancelled = order.status === "Cancelled";
  
  // Format order number and date in the exact style from the screenshot
  const formatOrderNumberAndDate = () => {
    // Get order number
    const orderNum = order.orderNumber || (order.id ? order.id.toString().padStart(2, '0') : '');
    
    // Format date like "Tue, 06 May 2025"
    const eventDate = order.eventDate ? new Date(order.eventDate) : null;
    const formattedDate = eventDate ? eventDate.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : '';
    
    // Return in format "#21 - Tue, 06 May 2025"
    return `#${orderNum} - ${formattedDate}`;
  };
  
  // Get the customer name with event type in parentheses
  const customerDisplay = () => {
    if (!order.contact) return '';
    
    const name = `${order.contact.firstName || ''} ${order.contact.lastName || ''}`;
    const eventType = order.eventType ? `(${order.eventType})` : '';
    
    return (
      <div className={`${isCancelled ? "text-gray-400 line-through" : "text-blue-600"}`}>
        {name} {eventType}
      </div>
    );
  };
  
  // Get the description text (first item description or notes)
  const descriptionText = order.items && order.items.length > 0 
    ? (order.items[0].description || order.items[0].name) 
    : order.notes || '';
  
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

  return (
    <div
      className={`relative flex items-start px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Red/Gray indicator dot based on status */}
      <div className="mr-3 pt-1">
        {order.status === 'Quote' || order.status === 'Cancelled' ? (
          <div className="w-5 h-5 rounded-sm bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-300">
            Q
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0"></div>
        )}
      </div>
      
      {/* Order details left column */}
      <div className="flex-1">
        {/* Order number and date */}
        <div className={`text-sm font-medium ${isCancelled ? "text-gray-400 line-through" : "text-gray-700"}`}>
          {formatOrderNumberAndDate()}
        </div>
        
        {/* Customer and event type */}
        {customerDisplay()}
        
        {/* Description/theme */}
        <div className={`text-sm ${isCancelled ? "text-gray-400 line-through" : "text-gray-600"}`}>
          {descriptionText}
        </div>
      </div>
      
      {/* Right column with price and buttons */}
      <div className="flex flex-col items-end ml-2">
        {/* Price */}
        <div className="text-base font-medium text-right mb-1">
          {order.total ? 
            `$ ${parseFloat(order.total.toString() || '0').toFixed(2)}` : 
            '$ 0.00'
          }
        </div>
        
        {/* Status badge */}
        <div className="mb-1">
          {isCancelled ? (
            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
          ) : isPaid ? (
            <Badge variant="default" className="text-xs py-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-800">Paid</Badge>
          ) : isQuote ? (
            <Badge variant="outline" className="text-xs">Quote</Badge>
          ) : null}
        </div>
        
        {/* Action icons */}
        <div className="flex space-x-1">
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
