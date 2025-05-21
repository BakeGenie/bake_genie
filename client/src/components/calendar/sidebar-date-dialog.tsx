import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface SidebarDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onAddEvent?: () => void;
  onBlockDate?: () => void;
}

const SidebarDateDialog: React.FC<SidebarDateDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onAddEvent,
  onBlockDate
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
  
  const handleAddEvent = () => {
    if (onAddEvent) {
      onAddEvent();
    } else {
      // Default behavior if no handler is provided
      console.log("Add calendar event for date:", selectedDate);
    }
    onClose();
  };
  
  const handleBlockDate = () => {
    if (onBlockDate) {
      onBlockDate();
    } else {
      // Default behavior if no handler is provided
      console.log("Block date:", selectedDate);
    }
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="bg-white p-0 max-w-sm rounded-md shadow border">
        <div className="relative border-b">
          <DialogTitle className="text-base font-semibold p-3">
            What would you like to do?
          </DialogTitle>
          <button 
            className="absolute right-3 top-3 w-5 h-5 inline-flex items-center justify-center text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            ×
          </button>
          <DialogDescription className="sr-only">
            Select an action for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "this date"}
          </DialogDescription>
        </div>
        
        <div className="py-2">
          <div className="py-2 px-4 text-center bg-blue-50 text-blue-600 font-medium">
            {selectedDate && format(selectedDate, "EEE, dd MMM yyyy")}
          </div>
          
          <div className="flex flex-col">
            <button 
              onClick={handleCreateOrder}
              className="w-full flex items-center justify-between py-3 px-4 border-b hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 4V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Create New Order</span>
              </div>
              <span className="text-gray-400">&gt;</span>
            </button>
            
            <button 
              onClick={handleAddEvent}
              className="w-full flex items-center justify-between py-3 px-4 border-b hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M1.5 6.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Add a Calendar Event</span>
              </div>
              <span className="text-gray-400">&gt;</span>
            </button>
            
            <button 
              onClick={handleBlockDate}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Block out Date</span>
              </div>
              <span className="text-gray-400">&gt;</span>
            </button>
          </div>
        </div>
        
        <div className="p-3 flex justify-center border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-28"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SidebarDateDialog;