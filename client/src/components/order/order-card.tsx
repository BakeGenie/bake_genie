import React from "react";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

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
}) => {
  // Get raw order data (we'll access it directly to display database fields)
  const rawOrder = order as any;
  
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
          {/* Order number */}
          <div className="text-sm font-medium mb-2 text-blue-600">
            #{rawOrder.order_number || rawOrder.id} -
          </div>
          
          {/* Display raw database fields exactly as in screenshot */}
          <div className="text-xs space-y-1 text-gray-800">
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">event_type:</div>
              <div>{rawOrder.event_type}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">event_date:</div>
              <div>{rawOrder.event_date ? new Date(rawOrder.event_date).toLocaleString() : 'null'}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">delivery_type:</div>
              <div>{rawOrder.delivery_type}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
              <div className="font-medium text-gray-500">delivery_address:</div>
              <div>{rawOrder.delivery_address || 'null'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
