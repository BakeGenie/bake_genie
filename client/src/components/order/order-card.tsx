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
        
        {/* Order details - direct database content display */}
        <div className="mt-3 text-xs grid grid-cols-2 gap-x-2 gap-y-1">
          {/* Show key-value pairs directly from all order properties - with specified fields excluded */}
          {Object.entries(order).map(([key, value]) => {
            // Skip the items array, contact object, and excluded fields
            if (key === 'items' || 
                key === 'contact' || 
                key === 'id' || 
                key === 'userId' || 
                key === 'special_instructions' || 
                key === 'deliveryFee' || 
                key === 'status' || 
                key === 'notes' || 
                key === 'taxRate') return null;
            
            // Format value based on type
            let displayValue = 'null';
            
            if (value !== null && value !== undefined) {
              if (key.includes('date') || key.includes('Date') || key.includes('At')) {
                // Format dates
                displayValue = new Date(value.toString()).toLocaleString();
              } else if (typeof value === 'object') {
                // Format objects
                displayValue = JSON.stringify(value);
              } else {
                // Default format
                displayValue = value.toString();
              }
            }
            
            return (
              <div key={key} className="col-span-2 border-b border-gray-100 pb-1 flex">
                <span className="font-semibold w-40 flex-shrink-0">{key}:</span>
                <span className="text-gray-700">{displayValue}</span>
              </div>
            );
          })}
          
          {/* Contact information if available */}
          {order.contact && (
            <div className="col-span-2 mt-2 border-t border-gray-200 pt-2">
              <div className="font-semibold mb-1">Contact:</div>
              {Object.entries(order.contact).map(([key, value]) => {
                if (value === null || value === undefined) return null;
                
                return (
                  <div key={key} className="ml-2 flex">
                    <span className="font-semibold w-32 flex-shrink-0">{key}:</span>
                    <span className="text-gray-700">{value.toString()}</span>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Order items listing */}
          {order.items && order.items.length > 0 && (
            <div className="col-span-2 mt-2 border-t border-gray-200 pt-2">
              <div className="font-semibold">Order Items ({order.items.length}):</div>
              {order.items.map((item, idx) => (
                <div key={idx} className="ml-2 mt-2 pb-2 border-b border-gray-100">
                  <div className="font-medium">Item #{idx + 1}</div>
                  {Object.entries(item).map(([key, value]) => {
                    if (value === null || value === undefined) return null;
                    
                    return (
                      <div key={key} className="ml-2 flex">
                        <span className="font-semibold w-24 flex-shrink-0">{key}:</span>
                        <span className="text-gray-700">{value.toString()}</span>
                      </div>
                    );
                  })}
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
