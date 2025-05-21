import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, X } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { OrderWithItems } from "@/types";

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderWithItems | null;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [, navigate] = useLocation();
  
  if (!order) return null;
  
  const formattedDate = order.eventDate 
    ? format(new Date(order.eventDate), 'EEE, dd MMM yyyy') 
    : '';
  
  const handleViewOrder = () => {
    navigate(`/orders/${order.id}`);
    onClose();
  };
  
  // Extract order number without the 'ORD-' prefix if it exists
  const quoteNumber = order.orderNumber?.includes('-') 
    ? order.orderNumber.split('-')[1] 
    : order.orderNumber;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="flex items-center flex-col p-6 pb-4 text-center border-b">
          <div className="bg-blue-50 rounded-full p-4 mb-3">
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-medium">{order.contact?.firstName} {order.contact?.lastName}</h2>
          <p className="text-gray-500 text-sm">{formattedDate}</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Quote No:</p>
              <p className="font-medium">{quoteNumber || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-gray-500">Event:</p>
              <p className="font-medium">{order.eventType || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-gray-500">Theme:</p>
              <p className="font-medium">{order.theme || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-gray-500">Status:</p>
              <p className="font-medium">{order.status || 'N/A'}</p>
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-gray-500 mb-1">Order Details:</h3>
            <div className="bg-gray-50 p-3 rounded">
              {order.items && order.items.length > 0 
                ? order.items.map((item, index) => (
                    <p key={index} className="font-medium mb-1">
                      {item.quantity} {item.description || item.productName || 'Item'}
                    </p>
                  ))
                : <p className="font-medium">No items</p>
              }
            </div>
          </div>
          
          <div className="pt-2">
            <h3 className="text-gray-500 mb-1">Delivery / Collection:</h3>
            <div className="bg-gray-50 p-3 rounded">
              {order.deliveryType === 'Delivery' 
                ? <p className="font-medium">Delivery to: {order.deliveryAddress || 'N/A'}</p>
                : <p className="font-medium">Collected from: {order.deliveryAddress || 'Shop address'}</p>
              }
            </div>
          </div>
        </div>
        
        <div className="flex items-center p-6 pt-0 gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleViewOrder} className="flex-1 bg-blue-500 hover:bg-blue-600">
            View Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;