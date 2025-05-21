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

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
  onEmailClick,
  onDownloadClick,
}) => {
  // Format order number properly with # prefix
  const orderNum = order.orderNumber || (order.id ? order.id.toString().padStart(2, '0') : '');
  
  // Format date to Tue, 06 May 2025 format
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Format money values to show $ and 2 decimal places
  const formatMoney = (value: any) => {
    if (value === undefined || value === null) return '';
    return `$${parseFloat(value.toString()).toFixed(2)}`;
  };
  
  // Handle email and doc clicks
  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmailClick) onEmailClick(e);
  };
  
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
      {/* Status indicator dot */}
      <div className="mr-3 pt-1">
        {order.status === 'Quote' || order.status === 'Cancelled' ? (
          <div className="w-5 h-5 rounded-sm bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-300">
            Q
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0"></div>
        )}
      </div>
      
      {/* Order details column */}
      <div className="flex-1">
        {/* Order number and date */}
        <div className="text-sm font-medium text-gray-700">
          #{orderNum} - {formatDate(order.eventDate)}
        </div>
        
        {/* Customer name with event type */}
        <div className="text-blue-600">
          {order.contact && `${order.contact.firstName} ${order.contact.lastName}`} 
          {order.eventType && ` (${order.eventType})`}
        </div>
        
        {/* Description text */}
        <div className="text-sm text-gray-600">
          {order.notes}
        </div>
        
        {/* Display ALL order data without titles */}
        <div className="mt-1 text-xs text-gray-500 grid grid-cols-2 gap-x-2 gap-y-1">
          {order.deliveryType && <div>{order.deliveryType}</div>}
          {order.deliveryTime && <div>{order.deliveryTime}</div>}
          {order.deliveryAddress && <div>{order.deliveryAddress}</div>}
          {order.deliveryFee && <div>{formatMoney(order.deliveryFee)}</div>}
          {order.tax && <div>{formatMoney(order.tax)}</div>}
          {order.taxRate && <div>{order.taxRate}%</div>}
          {order.discount && <div>Discount: {formatMoney(order.discount)}</div>}
          {order.depositAmount && (
            <div>
              Deposit: {formatMoney(order.depositAmount)}
              {order.depositPaid && " ✓"}
            </div>
          )}
          {order.subtotal && <div>{formatMoney(order.subtotal)}</div>}
          {order.jobSheetNotes && <div className="col-span-2">{order.jobSheetNotes}</div>}
        </div>
      </div>
      
      {/* Right column with price, status and actions */}
      <div className="flex flex-col items-end ml-2">
        {/* Total price */}
        <div className="text-base font-medium">
          {formatMoney(order.total)}
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
