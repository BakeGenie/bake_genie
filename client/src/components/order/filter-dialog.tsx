import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showOrders: boolean;
  setShowOrders: (value: boolean) => void;
  showQuotes: boolean;
  setShowQuotes: (value: boolean) => void;
  showNoPayments: boolean;
  setShowNoPayments: (value: boolean) => void;
  showBookingPayments: boolean;
  setShowBookingPayments: (value: boolean) => void;
  showPartialPayments: boolean;
  setShowPartialPayments: (value: boolean) => void;
  showPaidInFull: boolean;
  setShowPaidInFull: (value: boolean) => void;
  showCompleted: boolean;
  setShowCompleted: (value: boolean) => void;
  showCancelled: boolean;
  setShowCancelled: (value: boolean) => void;
}

export function FilterDialog({
  open,
  onOpenChange,
  showOrders,
  setShowOrders,
  showQuotes,
  setShowQuotes,
  showNoPayments,
  setShowNoPayments,
  showBookingPayments,
  setShowBookingPayments,
  showPartialPayments,
  setShowPartialPayments,
  showPaidInFull,
  setShowPaidInFull,
  showCompleted,
  setShowCompleted,
  showCancelled,
  setShowCancelled,
}: FilterDialogProps) {
  const { toast } = useToast();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Change Order Filters</DialogTitle>
        <div className="space-y-3 py-3">
          {/* Order Type Filters */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="orders-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showOrders}
                onChange={(e) => setShowOrders(e.target.checked)}
              />
              <label htmlFor="orders-filter" className="text-sm font-medium text-gray-700">
                Orders
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="quotes-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showQuotes}
                onChange={(e) => setShowQuotes(e.target.checked)}
              />
              <label htmlFor="quotes-filter" className="text-sm font-medium text-gray-700">
                Quotes
              </label>
            </div>
          </div>
          
          {/* Payment Status Filters */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="no-payments-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showNoPayments}
                onChange={(e) => setShowNoPayments(e.target.checked)}
              />
              <label htmlFor="no-payments-filter" className="text-sm font-medium text-gray-700">
                Orders with No Payments
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="booking-payments-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showBookingPayments}
                onChange={(e) => setShowBookingPayments(e.target.checked)}
              />
              <label htmlFor="booking-payments-filter" className="text-sm font-medium text-gray-700">
                Orders with Booking Payments
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="partial-payments-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showPartialPayments}
                onChange={(e) => setShowPartialPayments(e.target.checked)}
              />
              <label htmlFor="partial-payments-filter" className="text-sm font-medium text-gray-700">
                Orders with Partial Payments
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="paid-in-full-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showPaidInFull}
                onChange={(e) => setShowPaidInFull(e.target.checked)}
              />
              <label htmlFor="paid-in-full-filter" className="text-sm font-medium text-gray-700">
                Orders Paid in Full
              </label>
            </div>
          </div>
          
          {/* Order Status Filters */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="completed-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
              <label htmlFor="completed-filter" className="text-sm font-medium text-gray-700">
                Completed Orders
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cancelled-filter"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
              />
              <label htmlFor="cancelled-filter" className="text-sm font-medium text-gray-700">
                Cancelled Orders
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              // Apply all filters and close dialog
              onOpenChange(false);
              
              // Show success toast
              toast({
                title: "Filters Applied",
                description: "Your order filters have been updated."
              });
            }}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}