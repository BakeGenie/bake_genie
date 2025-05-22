import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { MailIcon, CheckCircleIcon, XCircleIcon, PlusCircleIcon, ClockIcon, PlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import AddEnquiryDialog from "@/components/enquiry/add-enquiry-dialog";
import EnquiryDialog from "@/components/enquiry-details/enquiry-dialog";

// Define DatabaseEnquiry type to match the actual database structure (snake_case fields)
interface DatabaseEnquiry {
  id: number;
  user_id: number;
  contact_id: number | null;
  date: string;
  event_type: string;
  event_date: string | null;
  details: string;
  status: string;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
  // Added fields from the JOIN with users table
  user_name?: string;
  user_email?: string;
}

const Enquiries = () => {
  const { toast } = useToast();
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<DatabaseEnquiry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  // Fetch enquiries
  const { data: allEnquiries = [], isLoading } = useQuery<DatabaseEnquiry[]>({
    queryKey: ["/api/enquiries"],
  });
  
  // Apply status filter if selected
  const enquiries = React.useMemo(() => {
    if (!statusFilter) return allEnquiries;
    return allEnquiries.filter(enquiry => 
      enquiry.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }, [allEnquiries, statusFilter]);

  // Handle enquiry status update
  const updateEnquiryStatus = async (id: number, status: string) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("PATCH", `/api/enquiries/${id}/status`, { status });
      
      // Invalidate enquiries query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/enquiries"] });
      
      toast({
        title: "Enquiry Updated",
        description: `Enquiry status has been updated to ${status}.`,
      });
      
      setIsViewDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating the enquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge component based on enquiry status
  const getStatusBadge = (status: string) => {
    // Normalize status to handle case differences
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case "new":
        return <Badge className="bg-blue-500">New</Badge>;
      case "in progress":
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case "responded":
        return <Badge className="bg-green-500">Responded</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Extract name and contact info from details field
  const parseEnquiryDetails = (details: string) => {
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

  // Table columns definition
  const columns: ColumnDef<DatabaseEnquiry>[] = [
    {
      accessorFn: (row) => {
        // Use customer name from details field first
        const details = row.details || "";
        const nameMatch = details.match(/Name: (.+?)(?:\n|$)/);
        const customerName = nameMatch ? nameMatch[1] : "Unknown";
        
        // Return the customer name from the enquiry form
        return customerName;
      },
      id: "name",
      header: "Customer",
      enableSorting: true,
    },
    {
      accessorFn: (row) => {
        // Extract email from details field first
        const details = row.details || "";
        const emailMatch = details.match(/Email: (.+?)(?:\n|$)/);
        const customerEmail = emailMatch && emailMatch[1] !== "Not provided" ? emailMatch[1] : null;
        
        // Return the customer email from the enquiry form
        return customerEmail;
      },
      id: "email",
      header: "Email",
      enableSorting: true,
      cell: ({ getValue }) => {
        const email = getValue() as string;
        return email ? (
          <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-800">
            {email}
          </a>
        ) : "N/A";
      },
    },

    {
      accessorKey: "event_type",
      header: "Event Type",
      enableSorting: true,
    },
    {
      accessorKey: "date",
      header: "Event Date",
      enableSorting: true,
      cell: ({ row }) => {
        // In your database, 'date' appears to be the event date field
        const date = row.original.date as string;
        return date ? formatDate(new Date(date)) : "Not specified";
      },
      sortingFn: (rowA, rowB, columnId) => {
        const rowADate = rowA.original.date as string;
        const rowBDate = rowB.original.date as string;
        
        // Handle case where one or both dates are null/undefined
        if (!rowADate && !rowBDate) return 0;
        if (!rowADate) return -1;
        if (!rowBDate) return 1;
        
        return new Date(rowADate).getTime() - new Date(rowBDate).getTime();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: "created_at",
      header: "Received",
      enableSorting: true,
      cell: ({ row }) => {
        // Match what's actually in the database (snake_case)
        const date = row.original.created_at;
        return date ? formatDate(new Date(date), { withTime: true }) : "N/A";
      },
    },
  ];

  // We'll keep this function, but just make it empty since we're not using it anymore
  // and the data table doesn't support customFilter
  const searchEnquiry = () => true;

  // Handle enquiry click to view details
  const handleEnquiryClick = (enquiry: DatabaseEnquiry) => {
    setSelectedEnquiry(enquiry);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-3">Enquiries</h1>
        <div className="flex space-x-2">
          <AddEnquiryDialog />
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/enquiry-form"}
          >
            <MailIcon className="h-4 w-4 mr-2" />
            Manage Enquiry Form
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <div className="text-sm font-medium">Filter by status:</div>
        <Button 
          variant={statusFilter === null ? "default" : "outline"} 
          onClick={() => setStatusFilter(null)}
          className="text-xs h-8 bg-yellow-500 hover:bg-yellow-600"
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "New" ? "default" : "outline"} 
          onClick={() => setStatusFilter("New")}
          className="text-xs h-8 bg-sky-500 hover:bg-sky-600"
        >
          New
        </Button>
        <Button 
          variant={statusFilter === "In Progress" ? "default" : "outline"} 
          onClick={() => setStatusFilter("In Progress")}
          className="text-xs h-8 bg-amber-500 hover:bg-amber-600"
        >
          In Progress
        </Button>
        <Button 
          variant={statusFilter === "Responded" ? "default" : "outline"} 
          onClick={() => setStatusFilter("Responded")}
          className="text-xs h-8 bg-green-500 hover:bg-green-600"
        >
          Responded
        </Button>
        <Button 
          variant={statusFilter === "Closed" ? "default" : "outline"} 
          onClick={() => setStatusFilter("Closed")}
          className="text-xs h-8"
        >
          Closed
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={enquiries}
          searchPlaceholder="Search enquiries..."
          onRowClick={handleEnquiryClick}
        />
      </div>

      {/* View Enquiry Dialog */}
      {selectedEnquiry && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={() => setIsViewDialogOpen(false)}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
            
            <DialogTitle className="pb-2">
              Enquiry from {selectedEnquiry.details ? 
                parseEnquiryDetails(selectedEnquiry.details).name : 
                "Unknown"}
            </DialogTitle>
            
            <div className="absolute top-4 right-10">
              {getStatusBadge(selectedEnquiry.status)}
            </div>
            
            {selectedEnquiry.details && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Enquiry Details</h3>
                  <p className="text-sm text-gray-500">
                    Received on {formatDate(new Date(selectedEnquiry.created_at), { withTime: true })}
                  </p>
                </div>
                
                {(() => {
                  const { name, email, phone, message, source } = parseEnquiryDetails(selectedEnquiry.details);
                  
                  return (
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
                          <p className="mt-1">{selectedEnquiry.event_type}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Event Date</h4>
                          <p className="mt-1">
                            {selectedEnquiry.event_date ? 
                              formatDate(new Date(selectedEnquiry.event_date)) : 
                              selectedEnquiry.date ? 
                                formatDate(new Date(selectedEnquiry.date)) : 
                                'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      updateEnquiryStatus(selectedEnquiry.id, "In Progress");
                    }}
                    disabled={isSubmitting}
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
                      const email = parseEnquiryDetails(selectedEnquiry.details).email;
                      if (email) {
                        window.location.href = `mailto:${email}?subject=Re: Your Enquiry`;
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
                      updateEnquiryStatus(selectedEnquiry.id, "Responded");
                    }}
                    disabled={isSubmitting}
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
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Enquiries;
