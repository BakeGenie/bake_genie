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
      <DialogContent className="p-0 max-w-sm rounded-lg shadow-lg">
        <div className="relative">
          <DialogTitle className="text-base font-medium p-4">
            What would you like to do?
          </DialogTitle>
          <button 
            className="absolute right-4 top-4 rounded-full w-6 h-6 inline-flex items-center justify-center text-gray-500 hover:text-gray-700"
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
          <div className="py-2 px-4 text-center bg-blue-50 text-blue-600 font-medium mb-2">
            {selectedDate && format(selectedDate, "EEE, dd MMM yyyy")}
          </div>
          
          <div className="flex flex-col">
            <div className="py-1 px-3 border-b">
              <button 
                onClick={handleCreateOrder}
                className="w-full flex items-center justify-between py-2.5 text-sm hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Create New Order</span>
                </div>
                <span className="text-gray-400">&gt;</span>
              </button>
            </div>
            
            <div className="py-1 px-3 border-b">
              <button 
                onClick={handleAddEvent}
                className="w-full flex items-center justify-between py-2.5 text-sm hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Add a Calendar Event</span>
                </div>
                <span className="text-gray-400">&gt;</span>
              </button>
            </div>
            
            <div className="py-1 px-3">
              <button 
                onClick={handleBlockDate}
                className="w-full flex items-center justify-between py-2.5 text-sm hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Block out Date</span>
                </div>
                <span className="text-gray-400">&gt;</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 flex justify-center border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full max-w-xs"
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