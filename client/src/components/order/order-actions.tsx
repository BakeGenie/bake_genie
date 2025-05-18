import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { MoreVerticalIcon, CalendarRange, ClipboardCopy, FileText, ExternalLink, Copy, Download, MailIcon, CheckIcon, FileTextIcon } from "lucide-react";
import EmailInvoiceButton from "./email-invoice-button";
import { OrderWithItems } from "@/types";

interface OrderActionsProps {
  order: OrderWithItems;
  onEdit: () => void;
}

const OrderActions: React.FC<OrderActionsProps> = ({ order, onEdit }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [emailForm, setEmailForm] = React.useState({
    to: order.contact?.email || "",
    cc: "",
    message: `Hi ${order.contact?.firstName || ""},\n\nPlease find your invoice attached.\n\nTo make an online payment for your order, please click on the link below. If you have any trouble viewing it, please contact us.\n\nThanks again`,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", `/api/orders/${order.id}/email`, emailForm);
      
      // Add a log entry for the email
      await apiRequest("POST", `/api/orders/${order.id}/logs`, {
        action: "Email Sent",
        details: `Recipient: ${emailForm.to}`,
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
      toast({
        title: "Email Sent",
        description: "The invoice has been emailed successfully.",
      });
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("PATCH", `/api/orders/${order.id}/status`, {
        status: "Cancelled",
      });
      
      // Add a log entry
      await apiRequest("POST", `/api/orders/${order.id}/logs`, {
        action: "Order Cancelled",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Cancelled",
        description: "The order has been cancelled successfully.",
      });
      setIsCancelDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async () => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("DELETE", `/api/orders/${order.id}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Deleted",
        description: "The order has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      window.history.back();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsReady = async () => {
    try {
      await apiRequest("PATCH", `/api/orders/${order.id}/status`, {
        status: "Ready",
      });
      
      // Add a log entry
      await apiRequest("POST", `/api/orders/${order.id}/logs`, {
        action: "Order Marked as Ready",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Ready",
        description: "The order has been marked as ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadOrderForm = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is coming soon.",
    });
  };

  const downloadDeliveryNote = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is coming soon.",
    });
  };

  const downloadJobSheet = () => {
    toast({
      title: "Coming Soon",
      description: "This feature is coming soon.",
    });
  };

  const openCustomerPortal = () => {
    toast({
      title: "Coming Soon",
      description: "Customer portal functionality is coming soon.",
    });
  };

  const duplicateOrder = async () => {
    try {
      const response = await apiRequest("POST", `/api/orders/${order.id}/duplicate`, {});
      const newOrder = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Duplicated",
        description: "The order has been duplicated successfully.",
      });
      
      // Navigate to the new order
      window.location.href = `/orders/${newOrder.id}`;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {order.status !== "Ready" && order.status !== "Delivered" && order.status !== "Cancelled" && (
          <Button size="sm" onClick={handleMarkAsReady}>
            <CheckIcon className="mr-2 h-4 w-4" /> Mark Order as Ready
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={downloadOrderForm}>
              <FileText className="mr-2 h-4 w-4" /> Download Order Form
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadDeliveryNote}>
              <FileText className="mr-2 h-4 w-4" /> Download Delivery Note
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadJobSheet}>
              <FileText className="mr-2 h-4 w-4" /> Download Job Sheet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsEmailDialogOpen(true)}>
              <MailIcon className="mr-2 h-4 w-4" /> Email Order
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openCustomerPortal}>
              <ExternalLink className="mr-2 h-4 w-4" /> Customer Portal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={duplicateOrder}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate Order
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.open("https://calendar.google.com/calendar/event", "_blank")}>
              <CalendarRange className="mr-2 h-4 w-4" /> Add To Calendar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.status !== "Cancelled" ? (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setIsCancelDialogOpen(true)}
              >
                Cancel Order
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => toast({ title: "Restore Order", description: "This feature is coming soon." })}>
                Uncancel Order
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete Order
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Invoice</DialogTitle>
            <DialogDescription>
              Send an email with the invoice to your customer.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="to">Email Address</Label>
                <Input
                  id="to"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                  placeholder="Email Address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cc">Cc Email Address</Label>
                <Input
                  id="cc"
                  value={emailForm.cc}
                  onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
                  placeholder="Cc Email Address"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="message">Message</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-sm"
                    onClick={() => setEmailForm({ ...emailForm, message: "" })}
                  >
                    Clear
                  </Button>
                </div>
                <Textarea
                  id="message"
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEmailDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
            >
              No, Keep Order
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Yes, Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              No, Keep Order
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Yes, Delete Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderActions;
