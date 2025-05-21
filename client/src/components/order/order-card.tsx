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

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isSelected = false,
  onClick,
}) => {
  const isQuote = order.status === 'Quote';
  const isPaid = order.status === 'Paid';
  
  // Get the amount from the total field
  const amount = order.total || 0;

  return (
    <div
      className={`relative flex justify-between items-center px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
        isSelected ? "bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      {/* Red indicator dot */}
      <div className="w-2 h-2 rounded-full bg-red-500 mr-3"></div>
      
      {/* Price amount */}
      <div className="text-base font-medium ml-auto">
        $ <FormatCurrency amount={amount} showSymbol={false} />
      </div>
      
      {/* Status badge - only show Quote or Paid */}
      <div className="ml-3">
        {isQuote && (
          <Badge variant="outline" className="text-xs">Quote</Badge>
        )}
        {isPaid && (
          <Badge variant="default" className="text-xs">Paid</Badge>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
