import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { MailIcon } from "lucide-react";
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
}) => {
  const isQuote = order.status === 'Quote';
  const isCancelled = order.status === "Cancelled";

  // Generate a placeholder order number if one doesn't exist
  const orderNum = order.id ? order.id.toString().padStart(2, '0') : '';
  
  // Format order number - use quote prefix for quotes and add # for display
  const formattedOrderNumber = order.orderNumber 
    ? (order.status === 'Quote' ? `Q${order.orderNumber.replace(/^Q/, '')}` : `#${order.orderNumber}`)
    : `#${orderNum}`;
    
  // Format date to display exactly like BakeDiary: "#30 - Thu, 15 May 2025"
  const formattedDate = order.eventDate ? 
    `${formattedOrderNumber} - ${new Date(order.eventDate).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).replace(",", "")}` : "";

  // Handle email click
  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmailClick) onEmailClick(e);
  };

  // Get correct customer name from contact
  const customerName = order.contact 
    ? `${order.contact.firstName || ''} ${order.contact.lastName || ''}${order.eventType ? ` (${order.eventType})` : ''}`
    : '';

  // Use theme field as description if no items with description exist
  // This matches the database structure which has a "title" field that appears to be used for description
  const description = order.items?.[0]?.description || order.items?.[0]?.name || order.theme || '';

  // Get the amount using different possible field names (schema has different versions)
  const amount = order.total_amount || order.total || 0;

  return (
    <div
      className={`relative flex flex-col px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : isCancelled ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Red indicator dot - event type color */}
      <div className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-red-500"></div>
      
      {/* Top row with order number and date */}
      <div className="flex justify-between mb-1">
        <div className={`text-sm font-medium ${isCancelled ? "text-gray-400 line-through" : "text-gray-500"}`}>
          {formattedDate}
        </div>
        <div className={`text-base font-medium ${isCancelled ? "text-gray-400" : ""}`}>
          $ <FormatCurrency amount={amount} showSymbol={false} />
        </div>
      </div>
      
      {/* Customer name with event type */}
      <div className={`text-sm pl-3 ${isCancelled ? "text-gray-400 line-through" : "text-blue-600"}`}>
        {customerName}
      </div>
      
      {/* Description (from theme or items) */}
      <div className={`text-sm pl-3 ${isCancelled ? "text-gray-400 line-through" : "text-gray-500"}`}>
        {description}
      </div>
      
      {/* Status and email icon */}
      <div className="flex justify-between items-center mt-1">
        <div>
          {isCancelled ? (
            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
          ) : isQuote ? (
            <Badge variant="outline" className="text-xs">Quote</Badge>
          ) : order.status === "Paid" ? (
            <Badge variant="default" className="text-xs">Paid</Badge>
          ) : null}
        </div>
        
        {/* Email icon - only show when needed */}
        {onEmailClick && (
          <button 
            onClick={handleEmailClick}
            className="text-gray-400 hover:text-gray-600"
          >
            <MailIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
