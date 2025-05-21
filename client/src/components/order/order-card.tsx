import React from "react";
import { formatDistanceToNow } from "date-fns";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, CircleXIcon, FileDownIcon, MailIcon, AlertCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormatCurrency } from "@/components/ui/format-currency";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const isQuote = order.status === 'Quote' || (order.orderNumber && order.orderNumber.startsWith("Q"));
  const isCancelled = order.status === "Cancelled";

  // Generate a placeholder order number if one doesn't exist
  const orderNum = order.id ? order.id.toString().padStart(2, '0') : '';
  
  // Format order number - use quote prefix for quotes and add # for display
  const formattedOrderNumber = order.orderNumber 
    ? (order.status === 'Quote' ? `Q${order.orderNumber.replace(/^Q/, '')}` : `#${order.orderNumber}`)
    : `#${orderNum}`;
    
  // Format date to display (Matches BakeDiary format: "#30 - Thu, 15 May 2025")
  const formattedDate = order.eventDate ? 
    `${formattedOrderNumber} - ${new Date(order.eventDate).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).replace(",", "")}` : "";

  // Handle status badge color
  const getStatusBadge = () => {
    switch (order.status) {
      case "Draft":
        return <Badge variant="outline">Draft</Badge>;
      case "Confirmed":
        return <Badge variant="secondary">Confirmed</Badge>;
      case "Paid":
        return <Badge variant="default">Paid</Badge>;
      case "Ready":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Ready</Badge>;
      case "Delivered":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Delivered</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmailClick) onEmailClick(e);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadClick) onDownloadClick(e);
  };

  return (
    <div
      className={`relative flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : isCancelled ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Small colored circle indicating event type - exactly matching the screenshot */}
      <div className="mr-2 w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1"></div>
      
      <div className="flex-1">
        <div className="flex items-start">
          <div className="flex-1">
            <div className={`text-sm font-medium ${
              isCancelled ? "text-gray-400 line-through" : "text-gray-800"
            }`}>
              {formattedDate}
            </div>
            
            {/* Customer information expanded with contact details */}
            <div className={`text-sm ${isCancelled ? "text-gray-400 line-through" : "text-blue-600"}`}>
              {order.contact?.firstName || ''} {order.contact?.lastName || ''}
            </div>
            
            {/* Event type displayed prominently */}
            {order.eventType && (
              <div className={`text-sm font-medium ${isCancelled ? "text-gray-400 line-through" : "text-gray-700"}`}>
                Event type: {order.eventType}
              </div>
            )}
            
            {/* Customer additional information */}
            {order.contact && (
              <div className={`text-xs ${isCancelled ? "text-gray-400 line-through" : "text-gray-500"}`}>
                {order.contact.email && `${order.contact.email} · `}
                {order.contact.phone && `${order.contact.phone}`}
              </div>
            )}
            
            {/* Order description or title - exactly like screenshot */}
            <div className={`text-sm ${isCancelled ? "text-gray-400 line-through" : "text-gray-500"}`}>
              {order.items?.[0]?.description || order.items?.[0]?.name || order.title || ''}
            </div>
            
            {/* Event date shown clearly if different from order date */}
            {order.eventDate && formattedDate && (
              <div className={`text-xs ${isCancelled ? "text-gray-400 line-through" : "text-gray-500"}`}>
                Event date: {new Date(order.eventDate).toLocaleDateString()}
              </div>
            )}
            {/* Delivery information with icon */}
            {order.delivery_type && (
              <div className={`text-xs flex items-center ${isCancelled ? "text-gray-400 line-through" : "text-gray-400"}`}>
                <span className="font-medium mr-1">Delivery:</span> {order.delivery_type} 
                {order.delivery_time ? ` - ${order.delivery_time}` : ''}
                {order.delivery_address && ` - ${order.delivery_address}`}
                {order.delivery_fee > 0 && ` (+${order.delivery_fee})`}
              </div>
            )}
            
            {/* Special instructions */}
            {order.special_instructions && (
              <div className={`text-xs flex items-center mt-1 ${isCancelled ? "text-gray-400 line-through" : "text-amber-500"}`}>
                <AlertCircleIcon className="h-3 w-3 mr-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>Special instructions</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{order.special_instructions}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end ml-4">
            <div className={`text-base font-medium ${isCancelled ? "text-gray-400" : ""}`}>
              $ <FormatCurrency amount={order.total_amount || order.total || 0} showSymbol={false} />
            </div>
            
            <div className="mt-1">
              {order.status && (
                <div className="inline-flex items-center">
                  {getStatusBadge()}
                </div>
              )}
            </div>
            
            <div className="flex mt-1">
              {onEmailClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleEmailClick}
                  title="Email"
                >
                  <MailIcon className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              )}
              {onDownloadClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleDownloadClick}
                  title="Download"
                >
                  <FileDownIcon className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
