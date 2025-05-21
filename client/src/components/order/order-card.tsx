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
            {/* Delivery information exactly like in the screenshot */}
            <div className={`text-sm ${isCancelled ? "text-gray-400 line-through" : "text-gray-700"}`}>
              Delivery: {order.deliveryType || 'Pickup'} 
              {order.deliveryTime ? ` - ${order.deliveryTime}` : ''}
              {order.deliveryAddress && ` - ${order.deliveryAddress}`}
            </div>
          </div>
          
          <div className="flex flex-col items-end ml-4">
            {/* Price display exactly like in screenshot - right aligned with spacing */}
            <div className={`text-base font-medium ${isCancelled ? "text-gray-400" : ""}`}>
              $ <FormatCurrency amount={order.total_amount || order.total || 0} showSymbol={false} />
            </div>
            
            {/* Only show Paid badge like in screenshot */}
            {order.status === "Paid" && (
              <div className="mt-1">
                <Badge variant="default">Paid</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
