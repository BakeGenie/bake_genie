import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, List, X } from "lucide-react";
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
  
  const formattedDate = format(selectedDate, 'dd MMMM yyyy');
  
  const handleCreateOrder = () => {
    navigate(`/orders/new?date=${format(selectedDate, 'yyyy-MM-dd')}`);
    onClose();
  };
  
  const handleViewCalendar = () => {
    navigate('/calendar');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="text-center">What would you like to do?</DialogTitle>
        
        <div className="flex flex-col gap-3 py-4">
          <p className="text-center text-sm text-gray-500 mb-2">
            Selected date: {formattedDate}
          </p>
          
          <Button 
            onClick={handleCreateOrder} 
            className="flex items-center justify-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Create New Order
          </Button>
          
          <Button 
            onClick={handleViewCalendar} 
            variant="outline" 
            className="flex items-center justify-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            View Calendar
          </Button>
          
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateSelectionDialog;