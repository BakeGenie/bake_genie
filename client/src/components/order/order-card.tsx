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
  
  // Get order number for display
  const orderNum = order.orderNumber || order.id?.toString().padStart(2, '0') || '';
  
  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-100" : "bg-gray-50"
      }`}
      onClick={onClick}
    >
      <div className="flex">
        <div className="mr-2">
          <div className="w-5 h-5 rounded-full flex items-center justify-center">
            <FileText className="h-4 w-4 text-gray-500" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-medium mb-2 text-blue-600">
            #{orderNum} -
          </div>
          
          {/* Display raw database fields exactly as in screenshot */}
          <div className="text-xs space-y-1 text-gray-800">
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">user_id:</div>
              <div>{order.userId}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">contact_id:</div>
              <div>{order.contactId}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">order_number:</div>
              <div>{order.orderNumber}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">title:</div>
              <div>{order.title || 'null'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">event_type:</div>
              <div>{order.eventType}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">event_date:</div>
              <div>{order.eventDate ? new Date(order.eventDate).toLocaleString() : 'null'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">delivery_type:</div>
              <div>{order.deliveryType}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">delivery_address:</div>
              <div>{order.deliveryAddress || 'null'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">delivery_fee:</div>
              <div>{order.deliveryFee || 0}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">delivery_time:</div>
              <div>{order.deliveryTime || 'null'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">total_amount:</div>
              <div>{order.total || 0}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">amount_paid:</div>
              <div>{order.amount_paid || 0}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">tax_rate:</div>
              <div>{order.taxRate || 0}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">created_at:</div>
              <div>{order.createdAt ? new Date(order.createdAt).toLocaleString() : 'null'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">updated_at:</div>
              <div>{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : 'null'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
