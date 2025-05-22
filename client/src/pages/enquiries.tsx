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
    return allEnquiries.filter(enquiry => enquiry.status === statusFilter);
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
    switch (status) {
      case "New":
        return <Badge className="bg-blue-500">New</Badge>;
      case "In Progress":
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case "Responded":
        return <Badge className="bg-green-500">Responded</Badge>;
      case "Closed":
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Enquiry {selectedEnquiry.details ? 
                  `from ${parseEnquiryDetails(selectedEnquiry.details).name}` : 
                  `#${selectedEnquiry.id}`}
              </DialogTitle>
            </DialogHeader>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Enquiry Details</CardTitle>
                  <div>
                    {getStatusBadge(selectedEnquiry.status)}
                  </div>
                </div>
                <CardDescription>
                  Received on {formatDate(new Date(selectedEnquiry.created_at), { withTime: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedEnquiry.details && (
                  <>
                    {(() => {
                      const { name, email, phone, message } = parseEnquiryDetails(selectedEnquiry.details);
                      
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Name</h4>
                              <p>{name}</p>
                            </div>
                            {email && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-500">Email</h4>
                                <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-800">
                                  {email}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {phone && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                              <a href={`tel:${phone}`} className="text-primary-600 hover:text-primary-800">
                                {phone}
                              </a>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Message</h4>
                            <div className="mt-1 p-3 bg-gray-50 rounded-md">
                              <p className="whitespace-pre-wrap">{message}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedEnquiry.event_type && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
                      <p>{selectedEnquiry.event_type}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Event Date</h4>
                    <p>{selectedEnquiry.event_date ? formatDate(new Date(selectedEnquiry.event_date)) : 
                       selectedEnquiry.date ? formatDate(new Date(selectedEnquiry.date)) : 
                       'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateEnquiryStatus(selectedEnquiry.id, "Closed")}
                    disabled={isSubmitting}
                  >
                    <XCircleIcon className="h-4 w-4 mr-1" /> Close
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateEnquiryStatus(selectedEnquiry.id, "In Progress")}
                    disabled={isSubmitting}
                  >
                    <ClockIcon className="h-4 w-4 mr-1" /> Mark as In Progress
                  </Button>
                </div>
                <div className="flex space-x-2">
                  {parseEnquiryDetails(selectedEnquiry.details || "").email && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const email = parseEnquiryDetails(selectedEnquiry.details || "").email;
                          if (email) {
                            window.location.href = `mailto:${email}?subject=Re: Your Enquiry`;
                          }
                        }}
                      >
                        <MailIcon className="h-4 w-4 mr-1" /> Reply via Email
                      </Button>
                      <Button
                        onClick={() => {
                          const email = parseEnquiryDetails(selectedEnquiry.details || "").email;
                          if (email) {
                            window.location.href = `mailto:${email}?subject=Re: Your Enquiry`;
                          }
                          updateEnquiryStatus(selectedEnquiry.id, "Responded");
                        }}
                        disabled={isSubmitting}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" /> Mark as Responded
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Create Order",
                    description: "Converting enquiry to order will be implemented soon.",
                  });
                }}
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" /> Create Order from Enquiry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Enquiries;
