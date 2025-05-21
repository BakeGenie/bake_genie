import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertContactSchema } from "@shared/schema";
import { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, MailIcon, PhoneIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Extended schema with validation rules
const contactFormSchema = insertContactSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const Contacts = () => {
  const { toast } = useToast();
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = React.useState(false);
  const [isViewContactDialogOpen, setIsViewContactDialogOpen] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch contacts with refetch capability and debug
  const { data: contacts = [], isLoading, refetch } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
    onSuccess: (data) => {
      console.log("Contacts fetched successfully:", data);
    },
    onError: (error) => {
      console.error("Error fetching contacts:", error);
    }
  });

  // Form for new contact
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      businessName: "",
      address: "",
      notes: "",
    },
  });

  // Handle new contact submission
  const handleNewContactSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log("Submitting contact data:", data);
      
      // Use direct fetch instead of apiRequest
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error creating contact: ${response.status} ${errorText}`);
      }
      
      const newContact = await response.json();
      console.log("Contact created successfully:", newContact);
      
      // Manually add the new contact to the local data while we wait for the refetch
      const updatedContacts = [...contacts, newContact];
      
      // Force invalidate all queries to ensure UI updates
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      // Reset form and close dialog
      form.reset();
      setIsNewContactDialogOpen(false);
      
      toast({
        title: "Contact Created",
        description: `${data.firstName} ${data.lastName} has been added to your contacts.`,
      });
      
      // Force reload to ensure UI updates
      window.location.reload();
    } catch (error) {
      console.error("Error creating contact:", error);
      toast({
        title: "Error",
        description: "There was an error creating the contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle contact selection for viewing
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsViewContactDialogOpen(true);
  };

  // Table columns definition
  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "firstName",
      header: "First Name",
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      accessorKey: "businessName",
      header: "Company",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string;
        return email ? (
          <a href={`mailto:${email}`} className="flex items-center text-primary-600 hover:text-primary-800">
            <MailIcon className="h-4 w-4 mr-1" />
            {email}
          </a>
        ) : null;
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return phone ? (
          <a href={`tel:${phone}`} className="flex items-center text-primary-600 hover:text-primary-800">
            <PhoneIcon className="h-4 w-4 mr-1" />
            {phone}
          </a>
        ) : null;
      },
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Contacts"
        actions={
          <Button onClick={() => setIsNewContactDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" /> New Contact
          </Button>
        }
      />

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={contacts}
          isLoading={isLoading}
          searchPlaceholder="Search contacts..."
          searchKey="lastName"
          onRowClick={handleContactClick}
        />
      </div>

      {/* New Contact Dialog */}
      <Dialog open={isNewContactDialogOpen} onOpenChange={setIsNewContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Contact</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNewContactSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Surname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewContactDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Contact Dialog */}
      {selectedContact && (
        <Dialog open={isViewContactDialogOpen} onOpenChange={setIsViewContactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedContact.firstName} {selectedContact.lastName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedContact.businessName && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Company</h4>
                  <p>{selectedContact.businessName}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {selectedContact.email && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                    <a href={`mailto:${selectedContact.email}`} className="text-primary-600 hover:text-primary-800">
                      {selectedContact.email}
                    </a>
                  </div>
                )}
                {selectedContact.phone && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                    <a href={`tel:${selectedContact.phone}`} className="text-primary-600 hover:text-primary-800">
                      {selectedContact.phone}
                    </a>
                  </div>
                )}
              </div>
              
              {selectedContact.address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Address</h4>
                  <p>{selectedContact.address}</p>
                </div>
              )}
              
              {selectedContact.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                  <p className="text-gray-700">{selectedContact.notes}</p>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsViewContactDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewContactDialogOpen(false);
                    toast({
                      title: "Edit Contact",
                      description: "Contact editing will be implemented soon.",
                    });
                  }}
                >
                  Edit
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Contacts;
