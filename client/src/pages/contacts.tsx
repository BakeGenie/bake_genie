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

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
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
      company: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      notes: "",
    },
  });

  // Handle new contact submission
  const handleNewContactSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/contacts", data);
      
      // Invalidate contacts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      
      // Reset form and close dialog
      form.reset();
      setIsNewContactDialogOpen(false);
      
      toast({
        title: "Contact Created",
        description: `${data.firstName} ${data.lastName} has been added to your contacts.`,
      });
    } catch (error) {
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
      accessorKey: "company",
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
                        <Input placeholder="John" {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
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
                        <Input type="email" placeholder="john@example.com" {...field} />
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
                        <Input placeholder="+1 (555) 123-4567" {...field} />
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
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="USA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional information..." {...field} />
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
              {selectedContact.company && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Company</h4>
                  <p>{selectedContact.company}</p>
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
              
              {(selectedContact.address || selectedContact.city || selectedContact.state || selectedContact.zip || selectedContact.country) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Address</h4>
                  <p>
                    {selectedContact.address && `${selectedContact.address}, `}
                    {selectedContact.city && `${selectedContact.city}, `}
                    {selectedContact.state && `${selectedContact.state} `}
                    {selectedContact.zip && `${selectedContact.zip}, `}
                    {selectedContact.country}
                  </p>
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
