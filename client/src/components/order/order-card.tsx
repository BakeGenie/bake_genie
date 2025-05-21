import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FormatCurrency } from "@/components/ui/format-currency";

interface OrderCardProps {
  order: OrderWithItems;
  isSelected?: boolean;
  onClick?: () => void;
  onEmailClick?: (e: React.MouseEvent) => void;
  onDownloadClick?: (e: React.MouseEvent) => void;
}

// Label formatting helpers
const formatLabel = (key: string) => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
};

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
}) => {
  // Display all direct order fields from the database
  const renderOrderFields = () => {
    // Fields to exclude from rendering directly
    const excludeFields = ['items', 'contact', 'createdAt', 'updatedAt', 'imageUrls'];
    
    return Object.entries(order).map(([key, value]) => {
      // Skip excluded fields and null/undefined values
      if (excludeFields.includes(key) || value === null || value === undefined) {
        return null;
      }
      
      // Format dates
      if (key === 'eventDate' || key === 'dueDate') {
        const dateValue = value ? new Date(value).toLocaleDateString() : '';
        return (
          <div key={key} className="text-sm flex mb-1">
            <span className="font-medium text-gray-700 w-32">{formatLabel(key)}:</span>
            <span className="text-gray-600">{dateValue}</span>
          </div>
        );
      }
      
      // Format special fields like status
      if (key === 'status') {
        return (
          <div key={key} className="text-sm flex mb-1">
            <span className="font-medium text-gray-700 w-32">{formatLabel(key)}:</span>
            <Badge 
              variant={
                value === 'Paid' ? 'default' : 
                value === 'Quote' ? 'outline' :
                value === 'Cancelled' ? 'destructive' : 'secondary'
              }
              className="text-xs"
            >
              {value?.toString()}
            </Badge>
          </div>
        );
      }
      
      // Format price/money fields
      if (key === 'total' || key === 'discount' || key === 'setupFee' || key === 'taxRate') {
        return (
          <div key={key} className="text-sm flex mb-1">
            <span className="font-medium text-gray-700 w-32">{formatLabel(key)}:</span>
            <span className="text-gray-600">
              {typeof value === 'number' || typeof value === 'string' && !isNaN(parseFloat(value?.toString())) ? 
                `$${parseFloat(value?.toString()).toFixed(2)}` : value?.toString()}
            </span>
          </div>
        );
      }
      
      // Format customer name from contact_id if available
      if (key === 'contactId' && order.contact) {
        return (
          <div key={key} className="text-sm flex mb-1">
            <span className="font-medium text-gray-700 w-32">Customer:</span>
            <span className="text-blue-600">
              {order.contact.firstName} {order.contact.lastName}
            </span>
          </div>
        );
      }
      
      // Default rendering for other fields
      return (
        <div key={key} className="text-sm flex mb-1">
          <span className="font-medium text-gray-700 w-32">{formatLabel(key)}:</span>
          <span className="text-gray-600">{value?.toString()}</span>
        </div>
      );
    }).filter(Boolean); // Remove null entries
  };
  
  return (
    <div
      className={`relative px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : order.status === "Cancelled" ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Red indicator dot */}
      <div className="absolute left-1.5 top-5 w-2 h-2 rounded-full bg-red-500"></div>
      
      {/* Order header */}
      <div className="mb-3 pb-2 border-b border-gray-100">
        <div className="flex justify-between">
          <div className="flex">
            <div className="ml-3 font-medium">
              {order.orderNumber ? `#${order.orderNumber}` : `#${order.id?.toString().padStart(2, '0')}`}
            </div>
          </div>
          <div className="text-base font-medium">
            $ <FormatCurrency amount={order.total || 0} showSymbol={false} />
          </div>
        </div>
      </div>
      
      {/* Display ALL fields from the order record */}
      <div className="pl-3">
        {renderOrderFields()}
      </div>
      
      {/* Display order items if available */}
      {order.items && order.items.length > 0 && (
        <div className="mt-2 pl-3">
          <div className="font-medium mb-1 text-sm">Order Items:</div>
          {order.items.map((item, index) => (
            <div key={index} className="mb-2 pb-2 border-b border-gray-100 text-sm">
              <div className="font-medium">
                Item #{index + 1}: {item.quantity}x {item.name || item.description}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {Object.entries(item).map(([key, value]) => 
                  value !== null && value !== undefined && (
                    <div key={key} className="flex mb-0.5">
                      <span className="font-medium w-24">{formatLabel(key)}:</span> 
                      <span>{value?.toString()}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
