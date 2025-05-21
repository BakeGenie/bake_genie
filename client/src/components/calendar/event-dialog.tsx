import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onSaveEvent: (event: CalendarEvent) => void;
}

export interface CalendarEvent {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  description: string;
}

const eventTypes = [
  'Admin', 'Baking', 'Decorating', 'Delivery', 'Personal', 
  'Appointment', 'Market', 'Class', 'Workshop', 'Other'
];

const EventDialog: React.FC<EventDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSaveEvent
}) => {
  const [eventType, setEventType] = useState('Admin');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
  const [endDate, setEndDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
  
  const handleSave = () => {
    if (!startDate) {
      alert("Please select a start date");
      return;
    }
    
    // Create a new calendar event
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      startDate,
      endDate: endDate || startDate,
      type: eventType,
      description
    };
    
    onSaveEvent(newEvent);
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setEventType('Admin');
    setDescription('');
    setStartDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
    setEndDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Calendar Event</DialogTitle>
          <DialogDescription>
            Create a new event on the calendar
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="event-type" className="text-sm font-medium col-span-4">
              Event Type
            </label>
            <div className="col-span-4">
              <Select 
                value={eventType} 
                onValueChange={setEventType}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="start-date" className="text-sm font-medium col-span-4">
              Start Date
            </label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-4"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="end-date" className="text-sm font-medium col-span-4">
              End Date (Optional)
            </label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="col-span-4"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="description" className="text-sm font-medium col-span-4">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Add details about this event..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-4"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDialog;