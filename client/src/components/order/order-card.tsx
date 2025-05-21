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

// Format date for display in order cards
const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
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
          #{orderNumber} - {formatDisplayDate(order.eventDate)}
        </div>
        
        {/* Customer name and event type */}
        <div className="text-blue-600">
          {order.contact && `${order.contact.firstName} ${order.contact.lastName}`} 
          {order.eventType && ` (${order.eventType})`}
        </div>
        
        {/* All order fields directly from database */}
        <div className="mt-2 text-xs text-gray-500 grid grid-cols-1 gap-1">
          {/* Display all database fields directly without labels */}
          <div>id: {order.id}</div>
          <div>order_number: {order.orderNumber}</div>
          <div>user_id: {order.userId}</div>
          <div>contact_id: {order.contactId}</div>
          <div>event_type: {order.eventType}</div>
          <div>event_date: {order.eventDate}</div>
          <div>status: {order.status}</div>
          <div>delivery_type: {order.deliveryType}</div>
          <div>delivery_time: {order.deliveryTime}</div>
          {order.deliveryAddress && <div>delivery_address: {order.deliveryAddress}</div>}
          {order.deliveryFee && <div>delivery_fee: {order.deliveryFee}</div>}
          {order.taxRate && <div>tax_rate: {order.taxRate}</div>}
          {order.discount && <div>discount: {order.discount}</div>}
          {order.total && <div>total: {order.total}</div>}
          {order.notes && <div>notes: {order.notes}</div>}
          <div>created_at: {order.createdAt}</div>
          <div>updated_at: {order.updatedAt}</div>
          
          {/* Order items listing (if available) */}
          {order.items && order.items.length > 0 && (
            <div className="mt-1">
              order_items:
              {order.items.map((item, idx) => (
                <div key={idx} className="ml-2 border-t border-gray-100 pt-1 mt-1">
                  <div>id: {item.id}</div>
                  <div>name: {item.name}</div>
                  <div>quantity: {item.quantity}</div>
                  <div>price: {item.price}</div>
                  {item.description && <div>description: {item.description}</div>}
                  {item.notes && <div>notes: {item.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Right column with price and status */}
      <div className="flex flex-col items-end ml-4">
        {/* Total price */}
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
