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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { PlusIcon, MailIcon, PhoneIcon, Trash2Icon, EditIcon, SearchIcon, XIcon } from "lucide-react";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false); 
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeletingContact, setIsDeletingContact] = React.useState(false);

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

  // State for tracking if we're editing a contact
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = React.useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = React.useState(false);
  
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
  
  // Form for editing contact
  const editForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      userId: 1,
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
      
      // Use the React Query setQueryData method to manually update the contacts in the cache
      // This avoids the need for a page refresh
      queryClient.setQueryData(["/api/contacts"], (oldData: Contact[] = []) => {
        return [...oldData, newContact];
      });
      
      // Also trigger a background refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      // Reset form and close dialog
      form.reset();
      setIsNewContactDialogOpen(false);
      
      toast({
        title: "Contact Created",
        description: `${data.firstName} ${data.lastName} has been added to your contacts.`,
      });
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
  
  // Handle initiating contact deletion
  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle initiating contact edit
  const handleEditClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the row click
    setSelectedContact(contact);
    
    // Reset the edit form with the selected contact's data
    editForm.reset({
      userId: contact.userId || 1,
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      businessName: contact.businessName || "",
      address: contact.address || "",
      notes: contact.notes || "",
    });
    
    setIsEditContactDialogOpen(true);
  };
  
  // Handle edit contact submission
  const handleEditContactSubmit = async (data: ContactFormValues) => {
    if (!selectedContact) return;
    
    setIsEditSubmitting(true);
    
    try {
      console.log("Submitting updated contact data:", data);
      
      // Make PUT request to API
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error updating contact: ${response.status} ${errorText}`);
      }
      
      const updatedContact = await response.json();
      console.log("Contact updated successfully:", updatedContact);
      
      // Update the cache with the updated contact
      queryClient.setQueryData(["/api/contacts"], (oldData: Contact[] = []) => {
        return oldData.map(contact => 
          contact.id === selectedContact.id ? updatedContact : contact
        );
      });
      
      // Also trigger a background refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      // Reset form and close dialog
      editForm.reset();
      setIsEditContactDialogOpen(false);
      
      toast({
        title: "Contact Updated",
        description: `${data.firstName} ${data.lastName}'s details have been updated.`,
      });
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: "Error",
        description: "There was an error updating the contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handle actual contact deletion
  const handleDeleteConfirm = async () => {
    if (!selectedContact) return;
    
    setIsDeletingContact(true);
    
    try {
      // Make DELETE request to API
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting contact: ${response.status}`);
      }
      
      // Update the cache to remove the deleted contact
      queryClient.setQueryData(["/api/contacts"], (oldData: Contact[] = []) => {
        return oldData.filter(contact => contact.id !== selectedContact.id);
      });
      
      // Also trigger a background refetch for consistency
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      toast({
        title: "Contact Deleted",
        description: `${selectedContact.firstName} ${selectedContact.lastName} has been removed from your contacts.`,
      });
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "There was an error deleting the contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingContact(false);
    }
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
    {
      id: "actions",
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleEditClick(contact, e)}
              title="Edit contact"
            >
              <EditIcon className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleDeleteClick(contact, e)}
              title="Delete contact"
            >
              <Trash2Icon className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Advanced search functionality
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const filteredContacts = React.useMemo(() => {
    if (!searchQuery.trim() || !contacts) return contacts;
    
    const lowerCaseQuery = searchQuery.toLowerCase();
    
    // Type-safe way to filter contacts with null handling
    return contacts.filter((contact: any) => {
      return (
        (contact.firstName || '').toLowerCase().includes(lowerCaseQuery) ||
        (contact.lastName || '').toLowerCase().includes(lowerCaseQuery) ||
        (contact.email || '').toLowerCase().includes(lowerCaseQuery) ||
        (contact.phone || '').toLowerCase().includes(lowerCaseQuery) ||
        (contact.businessName || '').toLowerCase().includes(lowerCaseQuery) ||
        (contact.address || '').toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [contacts, searchQuery]);

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
      
      <div className="w-full my-4 relative">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 pr-10"
            placeholder="Search by name, email, phone, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchQuery('')}
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filteredContacts || []}
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
              <DialogDescription>Contact details</DialogDescription>
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
                    // Create a synthetic event for the edit action
                    const syntheticEvent = { stopPropagation: () => {} } as React.MouseEvent<Element, MouseEvent>;
                    handleEditClick(selectedContact, syntheticEvent);
                  }}
                >
                  Edit
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Contact Dialog */}
      {selectedContact && (
        <Dialog open={isEditContactDialogOpen} onOpenChange={setIsEditContactDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
              <DialogDescription>
                Update {selectedContact.firstName} {selectedContact.lastName}'s information
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditContactSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
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
                  control={editForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditContactDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isEditSubmitting}>
                    {isEditSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the contact 
              {selectedContact && (
                <span className="font-medium">
                  {" "}{selectedContact.firstName} {selectedContact.lastName}
                </span>
              )}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingContact}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeletingContact}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingContact ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contacts;
