import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

// This is a placeholder for mobile calendar event handling
// In a real implementation, this would integrate with the device's calendar API

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
    // Save the selected date in localStorage for the new order form to use
    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
    
    // Navigate to the new order page
    // We'll pass both formats of date parameters to ensure compatibility
    navigate(`/orders/new?eventDate=${selectedDate.toISOString()}&date=${selectedDate.toISOString()}`);
    onClose();
  };
  
  const handleViewCalendar = () => {
    // No need to store date or navigate - just close this dialog
    onClose();
  };
  
  const handleAddEvent = () => {
    // This would be implemented to add a calendar event 
    // For now just close the dialog
    console.log("Add calendar event for date:", selectedDate);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-4 max-w-sm">
        <DialogTitle className="text-center text-lg font-semibold mb-1">
          {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
        </DialogTitle>
        <p className="text-center text-gray-600 mb-4">
          What would you like to do?
        </p>
        
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