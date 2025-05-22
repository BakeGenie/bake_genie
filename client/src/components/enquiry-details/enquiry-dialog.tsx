import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface EnquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: any;
  onStatusChange: (id: number, status: string) => Promise<void>;
}

interface ParsedDetails {
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  message: string;
}

// Extract name and contact info from details field
const parseEnquiryDetails = (details: string): ParsedDetails => {
  const nameMatch = details.match(/Name: (.+?)(?:\n|$)/);
  const emailMatch = details.match(/Email: (.+?)(?:\n|$)/);
  const phoneMatch = details.match(/Phone: (.+?)(?:\n|$)/);
  const sourceMatch = details.match(/Source: (.+?)(?:\n|$)/);
  const messageMatch = details.match(/Message: ([\s\S]+?)(?:\n\n|$)/);
  
  return {
    name: nameMatch ? nameMatch[1] : "Unknown",
    email: emailMatch && emailMatch[1] !== "Not provided" ? emailMatch[1] : null,
    phone: phoneMatch && phoneMatch[1] !== "Not provided" ? phoneMatch[1] : null,
    source: sourceMatch ? sourceMatch[1] : null,
    message: messageMatch ? messageMatch[1] : details
  };
};

// Utility function to get appropriate badge for status
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'new':
      return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>;
    case 'contacted':
    case 'in progress':
      return <Badge className="bg-indigo-500 hover:bg-indigo-600">{status}</Badge>;
    case 'quoted':
      return <Badge className="bg-amber-500 hover:bg-amber-600">{status}</Badge>;
    case 'converted':
    case 'responded':
      return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
    case 'lost':
      return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const EnquiryDialog: React.FC<EnquiryDialogProps> = ({
  isOpen,
  onClose,
  enquiry,
  onStatusChange
}) => {
  const { toast } = useToast();

  if (!enquiry) return null;

  const { name, email, phone, message, source } = parseEnquiryDetails(enquiry.details || "");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Enquiry from {name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Enquiry Details</h3>
            <p className="text-sm text-gray-500">
              Received on {formatDate(new Date(enquiry.created_at), { withTime: true })}
            </p>
          </div>
          
          <div className="absolute top-4 right-10">
            {getStatusBadge(enquiry.status)}
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Name</h4>
              <p className="mt-1">{name}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Email</h4>
              {email ? (
                <a href={`mailto:${email}`} className="mt-1 block text-primary-600 hover:underline">
                  {email}
                </a>
              ) : (
                <p className="text-gray-400 mt-1">Not provided</p>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
              {phone ? (
                <p className="mt-1">{phone}</p>
              ) : (
                <p className="text-gray-400 mt-1">Not provided</p>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Message</h4>
              <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                <p className="whitespace-pre-wrap">{message}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
                <p className="mt-1">{enquiry.event_type}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Event Date</h4>
                <p className="mt-1">
                  {enquiry.event_date ? 
                    formatDate(new Date(enquiry.event_date)) : 
                    enquiry.date ? 
                      formatDate(new Date(enquiry.date)) : 
                      'Not specified'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                onStatusChange(enquiry.id, "In Progress");
              }}
            >
              Mark as In Progress
            </Button>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => {
                // Reply via email functionality
                if (email) {
                  window.open(`mailto:${email}`, '_blank');
                } else {
                  toast({
                    title: "No Email Available",
                    description: "This customer did not provide an email address",
                    variant: "destructive"
                  });
                }
              }}
            >
              Reply via Email
            </Button>
            
            <Button 
              variant="default"
              className="flex-1"
              onClick={() => {
                onStatusChange(enquiry.id, "Responded");
                onClose();
              }}
            >
              Mark as Responded
            </Button>
          </div>
          
          <div className="mt-2">
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Creating orders from enquiries will be available in a future update",
                });
              }}
            >
              Create Order from Enquiry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryDialog;