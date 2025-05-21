import React from "react";
import { formatDistanceToNow } from "date-fns";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FileTextIcon, CircleXIcon, FileDownIcon, MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const isQuote = order.status === 'Quote' || (order.orderNumber && order.orderNumber.startsWith("Q"));
  const isCancelled = order.status === "Cancelled";

  // Format date to display
  const formattedDate = order.eventDate ? new Date(order.eventDate).toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "";
  
  // Format order number - use quote prefix for quotes
  const formattedOrderNumber = order.orderNumber 
    ? (order.status === 'Quote' ? `Q${order.orderNumber.replace(/^Q/, '')}` : order.orderNumber)
    : 'N/A';

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
      className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ${
        isSelected ? "bg-blue-50" : isCancelled ? "bg-gray-50" : ""
      } ${isCancelled ? "" : "border-l-4 border-l-red-500"}`}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-start">
          <input 
            type="checkbox" 
            className="mr-3 mt-1.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
            readOnly
            checked={isSelected}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className="flex items-center">
              <div className={`text-sm font-medium ${
                isCancelled ? "text-gray-400 line-through" : "text-gray-800"
              }`}>
                #{formattedOrderNumber} - {formattedDate}
              </div>
            </div>
            <div className={`text-sm mt-0.5 ${isCancelled ? "text-gray-400 line-through" : "text-gray-600"}`}>
              <span className="font-medium">
                {order.contact?.firstName || ''} {order.contact?.lastName || ''}
              </span>
              {order.eventType && (
                <span className={`ml-1 ${isCancelled ? "text-gray-400" : "text-blue-600"}`}>
                  ({order.eventType})
                </span>
              )}
            </div>
            {order.title && (
              <div className={`text-sm mt-0.5 ${isCancelled ? "text-gray-400 line-through" : "text-gray-500"}`}>
                {order.title}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className={`text-sm font-medium ${isCancelled ? "text-gray-400" : ""}`}>
          <FormatCurrency amount={order.total_amount || order.total || 0} />
        </div>
        <div className="mt-1">
          {order.status && (
            <div className="inline-flex items-center">
              {getStatusBadge()}
            </div>
          )}
        </div>
        <div className="flex mt-1">
          {onDownloadClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDownloadClick}
              title="Download"
            >
              <FileDownIcon className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
            </Button>
          )}
          {onEmailClick && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEmailClick}
              title="Email"
            >
              <MailIcon className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
