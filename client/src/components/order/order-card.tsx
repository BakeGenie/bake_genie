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
      className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-gray-100" : isCancelled ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex">
          <div className={`h-10 w-10 flex items-center justify-center rounded mr-3 ${
            isCancelled
              ? "bg-gray-100 text-gray-500"
              : isSelected
              ? "bg-primary-100 text-primary-500"
              : "bg-gray-100 text-gray-500"
          }`}>
            {isCancelled ? <CircleXIcon size={18} /> : <FileTextIcon size={18} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <div className={`text-sm font-medium ${
                isCancelled ? "text-gray-400" : "text-gray-800"
              }`}>
                #{order.orderNumber || 'N/A'} - {formattedDate}
              </div>
              <div className="ml-2">{getStatusBadge()}</div>
            </div>
            <div className={`text-sm ${isCancelled ? "text-gray-400" : "text-gray-600"}`}>
              {order.contact?.firstName || ''} {order.contact?.lastName || ''}
              {order.eventType && (
                <span className={isCancelled ? "text-gray-400" : "text-primary-600"}>
                  {" "}({order.eventType})
                </span>
              )}
            </div>
            {order.description && (
              <div className={`text-sm ${isCancelled ? "text-gray-400" : "text-gray-500"}`}>
                {order.description}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-medium ${isCancelled ? "text-gray-400" : ""}`}>
          <FormatCurrency amount={order.total_amount || order.total || 0} />
        </div>
        {(onDownloadClick || onEmailClick) && (
          <div className="flex mt-1">
            {onDownloadClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownloadClick}
              >
                <FileDownIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            )}
            {onEmailClick && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEmailClick}
              >
                <MailIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
