import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, CalendarDaysIcon, XIcon } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface CalendarDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onAddEvent: () => void;
  onBlockDate: () => void;
}

const CalendarDateDialog: React.FC<CalendarDateDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onAddEvent,
  onBlockDate
}) => {
  const [, navigate] = useLocation();
  
  if (!selectedDate) return null;
  
  const handleCreateOrder = () => {
    if (selectedDate) {
      // Format and store the selected date as a string in yyyy-MM-dd format
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      console.log("Calendar: Storing selected date for new order:", formattedDate);
      
      // Use localStorage with string format - more reliable and avoids type issues
      localStorage.setItem('pendingEventDate', formattedDate);
      localStorage.setItem('selectedEventDate', selectedDate.toISOString());
      
      // Navigate without parameters - we'll get the date from localStorage
      navigate('/orders/new');
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Date Options: {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}</DialogTitle>
        <DialogDescription>
          Select an action for this date
        </DialogDescription>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <Button 
            className="flex items-center justify-start h-auto py-6 px-4"
            variant="outline"
            onClick={handleCreateOrder}
          >
            <div className="flex items-center">
              <PlusIcon className="mr-2 h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium text-left">Create New Order</h3>
                <p className="text-sm text-gray-500 text-left">Add a new order or quote for this date</p>
              </div>
            </div>
          </Button>
          
          <Button 
            className="flex items-center justify-start h-auto py-6 px-4"
            variant="outline"
            onClick={() => {
              onClose();
              onAddEvent();
            }}
          >
            <div className="flex items-center">
              <CalendarDaysIcon className="mr-2 h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-left">Add Event/Task</h3>
                <p className="text-sm text-gray-500 text-left">Add a reminder or task for this date</p>
              </div>
            </div>
          </Button>
          
          <Button 
            className="flex items-center justify-start h-auto py-6 px-4"
            variant="outline"
            onClick={() => {
              onClose();
              onBlockDate();
            }}
          >
            <div className="flex items-center">
              <XIcon className="mr-2 h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-left">Block Out Time</h3>
                <p className="text-sm text-gray-500 text-left">Mark this date as unavailable</p>
              </div>
            </div>
          </Button>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDateDialog;