import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarIcon, FileText, List, X } from "lucide-react";
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
    // Store the selected date in localStorage so it persists across navigation
    localStorage.setItem('selectedEventDate', selectedDate.toISOString());
    navigate('/orders/new');
    onClose();
  };
  
  const handleAddCalendarEvent = () => {
    // Store the selected date in localStorage for the calendar event
    localStorage.setItem('selectedCalendarDate', selectedDate.toISOString());
    // This would navigate to a calendar event creation page in the future
    onClose();
  };
  
  const handleBlockOutDate = () => {
    // Handle blocking out the date
    // This would be implemented in the future
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="bg-blue-50 p-4">
          <DialogTitle className="text-center text-base">What would you like to do?</DialogTitle>
        </div>
        
        <div className="text-center py-2 border-b text-sm">
          {selectedDate && (
            <span className="font-medium">
              {format(selectedDate, "EEE, dd MMM yyyy")}
            </span>
          )}
        </div>
        
        <div className="flex flex-col divide-y">
          <Button 
            variant="ghost" 
            onClick={handleCreateOrder} 
            className="flex items-center justify-start gap-2 h-12 px-4 rounded-none hover:bg-gray-50"
          >
            <FileText className="h-5 w-5 text-blue-500" />
            <span>Create New Order</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleAddCalendarEvent} 
            className="flex items-center justify-start gap-2 h-12 px-4 rounded-none hover:bg-gray-50"
          >
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            <span>Add a Calendar Event</span>
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleBlockOutDate} 
            className="flex items-center justify-start gap-2 h-12 px-4 rounded-none hover:bg-gray-50"
          >
            <X className="h-5 w-5 text-blue-500" />
            <span>Block out Date</span>
          </Button>
        </div>
        
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full text-gray-500"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateSelectionDialog;