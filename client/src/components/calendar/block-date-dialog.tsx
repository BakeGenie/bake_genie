import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BlockDateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onBlockDate: (blockInfo: BlockDateInfo) => void;
}

export interface BlockDateInfo {
  startDate: string;
  endDate: string;
  reason: string;
}

const BlockDateDialog: React.FC<BlockDateDialogProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onBlockDate
}) => {
  const [startDate, setStartDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
  const [endDate, setEndDate] = useState(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
  const [reason, setReason] = useState('');
  
  const handleSave = () => {
    if (!startDate) {
      alert("Please select a start date");
      return;
    }
    
    // Create block date info
    const blockInfo: BlockDateInfo = {
      startDate,
      endDate: endDate || startDate,
      reason
    };
    
    onBlockDate(blockInfo);
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setStartDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
    setEndDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : '');
    setReason('');
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
          <DialogTitle>Block Out Date</DialogTitle>
          <DialogDescription>
            Block this date from having any orders or appointments
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="block-start-date" className="text-sm font-medium col-span-4">
              Start Date
            </label>
            <Input
              id="block-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-4"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="block-end-date" className="text-sm font-medium col-span-4">
              End Date (Optional)
            </label>
            <Input
              id="block-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="col-span-4"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="block-reason" className="text-sm font-medium col-span-4">
              Reason (Optional)
            </label>
            <Textarea
              id="block-reason"
              placeholder="Why are you blocking this date?"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-4"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSave}>Block Date</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BlockDateDialog;