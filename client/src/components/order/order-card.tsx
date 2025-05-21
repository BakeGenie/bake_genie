import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Mail, FileText } from "lucide-react";

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

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
  onEmailClick,
  onDownloadClick,
}) => {
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
  
  // Get properly formatted order number
  const orderNumber = order.orderNumber || `${order.id}`.padStart(2, '0');
  
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
        <div className="text-sm font-medium text-gray-700">
          #{orderNumber} - {formatOrderDate(order.eventDate)}
        </div>
        
        {/* Customer and event type */}
        <div className="text-blue-600">
          {order.contact && `${order.contact.firstName} ${order.contact.lastName}`} 
          {order.eventType && ` (${order.eventType})`}
        </div>
        
        {/* Display fields directly without labels */}
        <div className="text-xs space-y-1 mt-2 text-gray-600">
          <div>Delivery: {order.deliveryType} {order.deliveryTime && `at ${order.deliveryTime}`}</div>
          
          {/* Order notes */}
          {order.notes && <div>{order.notes}</div>}
          
          {/* Financial information */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {order.discount && parseFloat(order.discount.toString()) > 0 && (
              <span>Discount: ${parseFloat(order.discount.toString()).toFixed(2)}</span>
            )}
            
            {order.taxRate && (
              <span>Tax: {parseFloat(order.taxRate.toString()).toFixed(2)}%</span>
            )}
          </div>
          
          {/* Item information */}
          {order.items && order.items.length > 0 && (
            <div>
              Items:
              {order.items.map((item, index) => (
                <div key={index} className="ml-2 text-xs">
                  - {item.quantity}x {item.name} (${parseFloat(item.price.toString()).toFixed(2)})
                </div>
              ))}
            </div>
          )}
          
          {/* Order dates information */}
          <div className="flex gap-x-2 text-gray-500">
            <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(order.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* Right column with price and buttons */}
      <div className="flex flex-col items-end ml-2">
        {/* Price */}
        <div className="text-base font-medium text-right mb-1">
          $ {order.total ? parseFloat(order.total.toString()).toFixed(2) : '0.00'}
        </div>
        
        {/* Status badge */}
        <div className="mb-1">
          {order.status === 'Cancelled' && (
            <Badge variant="destructive" className="text-xs">Cancelled</Badge>
          )}
          {order.status === 'Paid' && (
            <Badge variant="default" className="text-xs py-1 px-2 bg-gray-200 hover:bg-gray-300 text-gray-800">Paid</Badge>
          )}
          {order.status === 'Quote' && (
            <Badge variant="outline" className="text-xs">Quote</Badge>
          )}
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
