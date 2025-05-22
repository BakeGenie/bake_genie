import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, CalendarX } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { OrderWithItems } from "@/types";

interface CalendarDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  ordersOnDate: OrderWithItems[];
  onOrderSelect?: (order: OrderWithItems) => void;
}

const CalendarDateDialog: React.FC<CalendarDateDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  ordersOnDate,
  onOrderSelect
}) => {
  const [, navigate] = useLocation();
  
  if (!selectedDate) return null;
  
  const handleCreateOrder = () => {
    // Save the selected date in localStorage for the new order form to use
    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
    
    // Navigate to the new order page
    navigate(`/orders/new?eventDate=${selectedDate.toISOString()}&date=${selectedDate.toISOString()}`);
    onClose();
  };
  
  const handleAddCalendarEvent = () => {
    // Implementation for adding a calendar event
    // For now, just show an alert as placeholder
    alert("Add Calendar Event feature coming soon!");
    onClose();
  };
  
  const handleBlockOutDate = () => {
    // Implementation for blocking out a date
    // For now, just show an alert as placeholder
    alert("Block Out Date feature coming soon!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 max-w-sm">
        <DialogTitle className="text-center text-lg font-semibold mb-4">
          What would you like to do?
        </DialogTitle>
        
        <div className="text-center text-blue-500 mb-4">
          {selectedDate ? format(selectedDate, 'EEE, d MMM yyyy') : ''}
        </div>
        
        {ordersOnDate.length === 0 ? (
          // Display options for dates with no orders
          <div className="flex flex-col gap-3 mb-4">
            <Button 
              onClick={handleCreateOrder} 
              variant="ghost"
              className="flex justify-between items-center px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                <span>Create New Order</span>
              </div>
              <span className="text-gray-400">›</span>
            </Button>
            
            <Button 
              onClick={handleAddCalendarEvent}
              variant="ghost" 
              className="flex justify-between items-center px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Add a Calendar Event</span>
              </div>
              <span className="text-gray-400">›</span>
            </Button>
            
            <Button 
              onClick={handleBlockOutDate}
              variant="ghost" 
              className="flex justify-between items-center px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <CalendarX className="h-5 w-5" />
                <span>Block out Date</span>
              </div>
              <span className="text-gray-400">›</span>
            </Button>
          </div>
        ) : (
          // Display orders for the selected date
          <div className="flex flex-col gap-2 mb-4">
            <h3 className="text-sm font-medium mb-1">Orders on this date:</h3>
            {ordersOnDate.map(order => (
              <Button
                key={order.id}
                variant="outline"
                className="flex justify-between items-center"
                onClick={() => onOrderSelect && onOrderSelect(order)}
              >
                <div>
                  <span className="font-medium">{order.orderNumber}</span>
                  <span className="text-xs block text-gray-500">
                    {order.contact?.firstName} {order.contact?.lastName}
                  </span>
                </div>
                <span className="text-gray-400">›</span>
              </Button>
            ))}
            
            <div className="mt-3">
              <Button 
                onClick={handleCreateOrder} 
                variant="default"
                className="flex justify-between items-center w-full"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  <span>Add Another Order</span>
                </div>
                <span>›</span>
              </Button>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          onClick={onClose} 
          className="w-full border mt-2"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDateDialog;