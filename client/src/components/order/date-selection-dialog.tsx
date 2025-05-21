import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
  if (!selectedDate) return null;
  
  const handleCreateOrder = () => {
    // Store the selected date in localStorage so it persists across navigation
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

  const handleBlockOutDate = () => {
    // This would be implemented in the future
    toast({
      title: "Coming Soon",
      description: "The block out date feature will be available in a future update.",
    });
    onClose();
  };
  
  // Format the date to display like "Today's Date" and "22 May Thursday"
  const formattedMonth = format(selectedDate, "MMMM yyyy");
  const formattedDay = format(selectedDate, "dd");
  const formattedMonthName = format(selectedDate, "MMMM");
  const formattedDayName = format(selectedDate, "EEEE");
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="p-0 max-w-md rounded-lg">
        {/* Header with date information */}
        <div className="p-6 bg-blue-100 text-center">
          <div className="text-sm text-blue-600 font-medium">Today's Date</div>
          <div className="flex justify-center items-baseline gap-2">
            <span className="text-6xl font-bold text-gray-700">{formattedDay}</span>
            <div className="flex flex-col items-start">
              <span className="text-xl text-gray-700">{formattedMonthName}</span>
              <span className="text-sm text-gray-500">{formattedDayName}</span>
            </div>
          </div>
          <div className="text-center mt-4 text-base font-medium">
            What would you like to do?
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="p-4 flex flex-col gap-3">
          <Button 
            onClick={handleCreateOrder} 
            className="justify-start gap-2 py-6"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Create New Order</span>
          </Button>
          
          <Button 
            onClick={handleViewCalendar} 
            variant="outline"
            className="justify-start gap-2 py-6"
          >
            <CalendarIcon className="h-5 w-5" />
            <span>View Calendar</span>
          </Button>
          
          <Button 
            onClick={handleBlockOutDate} 
            variant="outline"
            className="justify-start gap-2 py-6"
          >
            <span className="rounded-full bg-gray-200 w-5 h-5 flex items-center justify-center">
              ×
            </span>
            <span>Block out Date</span>
          </Button>
        </div>
        
        {/* Cancel button */}
        <div className="p-4 pt-0">
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full border"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateSelectionDialog;