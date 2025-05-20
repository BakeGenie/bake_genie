import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Contact } from "@shared/schema";
import { X, Search, User } from "lucide-react";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CustomerSearchProps {
  onSelectContact: (contact: Contact) => void;
  selectedContactId?: number;
  placeholder?: string;
}

export function CustomerSearch({ onSelectContact, selectedContactId, placeholder = "Search customers..." }: CustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts');
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      return response.json() as Promise<Contact[]>;
    }
  });

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchLower = search.toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchLower)) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower))
    );
  });

  // Find the selected contact if there's a selectedContactId
  useEffect(() => {
    if (selectedContactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === selectedContactId);
      if (contact) {
        setSelectedContact(contact);
      }
    }
  }, [selectedContactId, contacts]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    onSelectContact(contact);
    setOpen(false);
  };

  const clearSelection = () => {
    setSelectedContact(null);
    // Pass a dummy contact with id = 0 to clear the selection
    onSelectContact({ id: 0 } as Contact);
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            {selectedContact ? (
              <div className="flex items-center border rounded-md p-2 justify-between bg-white">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {selectedContact.firstName} {selectedContact.lastName}
                    {selectedContact.company && ` (${selectedContact.company})`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={placeholder}
                  className="pl-8"
                  onClick={() => setOpen(true)}
                  readOnly
                />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
          <Command>
            <CommandInput 
              placeholder="Search by name, email or phone..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup heading="Customers">
                {filteredContacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.firstName} ${contact.lastName}`}
                    onSelect={() => handleSelectContact(contact)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.company && (
                        <span className="text-xs text-muted-foreground">
                          {contact.company}
                        </span>
                      )}
                      {contact.email && (
                        <span className="text-xs text-muted-foreground">
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}