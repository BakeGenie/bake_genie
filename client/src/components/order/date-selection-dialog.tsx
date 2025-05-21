import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface DateSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
}

const DateSelectionDialog: React.FC<DateSelectionDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
}) => {
  const [, navigate] = useLocation();
  
  if (!selectedDate) return null;
  
  const handleCreateOrder = () => {
    // Navigate to new order page with date parameter
    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
    navigate(`/orders?newOrder=true&date=${selectedDate.toISOString()}`);
    onClose();
  };
  
  const handleViewCalendar = () => {
    // Navigate to the calendar page with the selected date
    localStorage.setItem('selectedCalendarDate', selectedDate.toISOString());
    navigate('/calendar');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 max-w-sm">
        <DialogTitle className="text-center text-lg font-semibold mb-4">
          What would you like to do?
        </DialogTitle>
        
        <div className="flex flex-col gap-3 mb-4">
          <Button 
            onClick={handleCreateOrder} 
            className="flex justify-start items-center gap-2 py-3"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create New Order</span>
          </Button>
          
          <Button 
            onClick={handleViewCalendar}
            variant="outline" 
            className="flex justify-start items-center gap-2 py-3"
          >
            <Calendar className="h-5 w-5" />
            <span>View Calendar</span>
          </Button>
        </div>
        
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

export default DateSelectionDialog;