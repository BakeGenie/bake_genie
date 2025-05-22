import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { OrderWithItems } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ReceiptIcon } from "lucide-react";

interface CalendarOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithItems | null;
}

const CalendarOrderDialog: React.FC<CalendarOrderDialogProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const [, navigate] = useLocation();
  
  if (!order) return null;
  
  const handleViewOrder = () => {
    navigate(`/orders/${order.id}`);
    onClose();
  };
  
  // Format delivery address for display
  const deliveryDisplay = order.deliveryType === 'Delivery' && order.deliveryAddress 
    ? `Delivered to ${order.deliveryAddress}`
    : 'Pickup from your location';
  
  // Get order/quote number without the prefix
  const orderNumber = order.orderNumber?.split('-')[1] || '';
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 max-w-sm">
        <DialogTitle className="sr-only">Order Details</DialogTitle>
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <div className="p-2 border border-dashed border-gray-300 rounded-lg inline-flex items-center justify-center">
              <div className="h-6 w-6 text-red-500">$</div>
            </div>
          </div>
          <h2 className="text-lg font-semibold">
            {order.contact?.firstName} {order.contact?.lastName}
          </h2>
          <p className="text-sm text-gray-600">
            {order.eventDate ? format(new Date(order.eventDate), 'EEE, d MMM yyyy') : ''}
          </p>
        </div>
        
        <div className="space-y-2 mb-4 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-600">Quote No:</span>
            <span className="font-medium text-right">{orderNumber}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-600">Event:</span>
            <span className="font-medium text-right">{order.eventType}</span>
          </div>
          
          {order.notes && (
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-600">Theme:</span>
              <span className="font-medium text-right">{order.notes}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-600">Status:</span>
            <div className="text-right">
              <Badge 
                className="bg-gray-500 text-white text-xs font-normal"
              >
                {order.status}
              </Badge>
            </div>
          </div>
        </div>
        
        {order.items && order.items.length > 0 && (
          <div className="mb-4">
            <h3 className="text-gray-600 font-medium mb-1 text-sm">Order Details:</h3>
            <div className="text-sm space-y-1">
              {order.items.map((item, index) => (
                <div key={index} className="text-gray-700">
                  {item.quantity && item.quantity > 1 ? `${item.quantity} ` : ''}{item.description || item.name}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="text-gray-600 font-medium mb-1 text-sm">Delivery / Collection:</h3>
          <div className="text-sm text-gray-700">
            {deliveryDisplay}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleViewOrder} 
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            View Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarOrderDialog;