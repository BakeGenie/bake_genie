import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Enquiry } from "@shared/schema";
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

const Enquiries = () => {
  const { toast } = useToast();
  const [selectedEnquiry, setSelectedEnquiry] = React.useState<Enquiry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null);

  // Fetch enquiries
  const { data: allEnquiries = [], isLoading } = useQuery<Enquiry[]>({
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

  // Table columns definition
  const columns: ColumnDef<Enquiry>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email ? (
          <a href={`mailto:${email}`} className="text-primary-600 hover:text-primary-800">
            {email}
          </a>
        ) : "N/A";
      },
    },
    {
      accessorKey: "eventType",
      header: "Event Type",
      enableSorting: true,
    },
    {
      accessorKey: "eventDate",
      header: "Event Date",
      enableSorting: true,
      cell: ({ row }) => {
        const date = row.getValue("eventDate") as string;
        return date ? formatDate(new Date(date)) : "Not specified";
      },
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = rowA.getValue(columnId) as string;
        const dateB = rowB.getValue(columnId) as string;
        
        // Handle case where one or both dates are null/undefined
        if (!dateA && !dateB) return 0;
        if (!dateA) return -1;
        if (!dateB) return 1;
        
        return new Date(dateA).getTime() - new Date(dateB).getTime();
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
      accessorKey: "createdAt",
      header: "Received",
      enableSorting: true,
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return formatDate(new Date(date), { withTime: true });
      },
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = rowA.getValue(columnId) as string;
        const dateB = rowB.getValue(columnId) as string;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      },
    },
  ];

  // Handle enquiry click to view details
  const handleEnquiryClick = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Enquiries" />
        <div className="flex space-x-2 ml-auto">
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
      
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <div className="text-sm font-medium">Filter by status:</div>
        <Button 
          variant={statusFilter === null ? "default" : "outline"} 
          className="text-xs h-8 bg-yellow-500 hover:bg-yellow-600"
          onClick={() => setStatusFilter(null)}
        >
          All
        </Button>
        <Button 
          variant={statusFilter === "New" ? "default" : "outline"} 
          className="text-xs h-8 bg-sky-500 hover:bg-sky-600"
          onClick={() => setStatusFilter("New")}
        >
          New
        </Button>
        <Button 
          variant={statusFilter === "In Progress" ? "default" : "outline"} 
          className="text-xs h-8 bg-amber-500 hover:bg-amber-600"
          onClick={() => setStatusFilter("In Progress")}
        >
          In Progress
        </Button>
        <Button 
          variant={statusFilter === "Responded" ? "default" : "outline"} 
          className="text-xs h-8 bg-green-500 hover:bg-green-600"
          onClick={() => setStatusFilter("Responded")}
        >
          Responded
        </Button>
        <Button 
          variant={statusFilter === "Closed" ? "default" : "outline"} 
          className="text-xs h-8"
          onClick={() => setStatusFilter("Closed")}
        >
          Closed
        </Button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={enquiries}
          searchPlaceholder="Search enquiries..."
          searchKey="name"
          onRowClick={handleEnquiryClick}
        />
      </div>

      {/* View Enquiry Dialog */}
      {selectedEnquiry && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enquiry from {selectedEnquiry.name}</DialogTitle>
            </DialogHeader>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Enquiry Details</CardTitle>
                  {getStatusBadge(selectedEnquiry.status)}
                </div>
                <CardDescription>
                  Received on {formatDate(new Date(selectedEnquiry.createdAt), { withTime: true })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Name</h4>
                    <p>{selectedEnquiry.name}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <a href={`mailto:${selectedEnquiry.email}`} className="text-primary-600 hover:text-primary-800">
                      {selectedEnquiry.email}
                    </a>
                  </div>
                </div>
                
                {selectedEnquiry.phone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <a href={`tel:${selectedEnquiry.phone}`} className="text-primary-600 hover:text-primary-800">
                      {selectedEnquiry.phone}
                    </a>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedEnquiry.eventType && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
                      <p>{selectedEnquiry.eventType}</p>
                    </div>
                  )}
                  {selectedEnquiry.eventDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Event Date</h4>
                      <p>{formatDate(new Date(selectedEnquiry.eventDate))}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Message</h4>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="whitespace-pre-line">{selectedEnquiry.message}</p>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.href = `mailto:${selectedEnquiry.email}?subject=Re: Your Enquiry`;
                    }}
                  >
                    <MailIcon className="h-4 w-4 mr-1" /> Reply via Email
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = `mailto:${selectedEnquiry.email}?subject=Re: Your Enquiry`;
                      updateEnquiryStatus(selectedEnquiry.id, "Responded");
                    }}
                    disabled={isSubmitting}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" /> Mark as Responded
                  </Button>
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
