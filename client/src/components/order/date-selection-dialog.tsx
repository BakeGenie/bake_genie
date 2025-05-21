import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, Ban } from "lucide-react";
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
    // Save the selected date in localStorage for the new order form to use
    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
    
    // Navigate to the new order page
    // We'll pass both formats of date parameters to ensure compatibility
    navigate(`/orders/new?eventDate=${selectedDate.toISOString()}&date=${selectedDate.toISOString()}`);
    onClose();
  };
  
  const handleViewCalendar = () => {
    // Save the selected date in localStorage for the calendar page to use
    localStorage.setItem('selectedCalendarDate', selectedDate.toISOString());
    
    // Navigate to the main Calendar page in the sidebar and pass the date
    navigate(`/calendar?date=${selectedDate.toISOString()}`);
    onClose();
  };
  
  const handleAddEvent = () => {
    // This would be implemented to add a calendar event 
    // For now just close the dialog
    console.log("Add calendar event for date:", selectedDate);
    onClose();
  };
  
  const handleBlockDate = () => {
    // This would mark the date as unavailable in the calendar
    console.log("Block date:", selectedDate);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-0 max-w-sm">
        <DialogTitle className="text-lg p-3 border-b bg-gray-50">
          What would you like to do?
        </DialogTitle>
        
        <div className="py-2">
          <div className="py-2 px-4 text-center bg-blue-50 text-blue-600 font-medium">
            {selectedDate && format(selectedDate, "EEE, dd MMM yyyy")}
          </div>
          
          <div className="flex flex-col">
            <Button 
              onClick={handleCreateOrder} 
              variant="ghost"
              className="flex justify-between items-center border-b py-3 px-4 rounded-none"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                <span>Create New Order</span>
              </div>
              <span className="text-gray-400">&gt;</span>
            </Button>
            
            <Button 
              onClick={handleAddEvent}
              variant="ghost"
              className="flex justify-between items-center border-b py-3 px-4 rounded-none"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Add a Calendar Event</span>
              </div>
              <span className="text-gray-400">&gt;</span>
            </Button>
            
            <Button 
              onClick={handleBlockDate}
              variant="ghost" 
              className="flex justify-between items-center py-3 px-4 rounded-none"
            >
              <div className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                <span>Block out Date</span>
              </div>
              <span className="text-gray-400">&gt;</span>
            </Button>
          </div>
        </div>
        
        <div className="border-t p-2 bg-gray-50">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateSelectionDialog;