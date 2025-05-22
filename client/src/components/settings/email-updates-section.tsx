import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ChevronRightIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSettings } from "@/contexts/settings-context";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

// Import Settings type from the context
import type { Settings } from "@/contexts/settings-context";

// Update frequency options
const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

// Email settings schema
const emailSettingsSchema = z.object({
  emailAddress: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  secondaryEmailAddress: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  receiveUpcomingOrders: z.boolean().default(false),
  upcomingOrdersFrequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  receivePaymentReminders: z.boolean().default(false),
  receiveMarketingEmails: z.boolean().default(false),
  receiveProductUpdates: z.boolean().default(false),
});

type EmailSettings = z.infer<typeof emailSettingsSchema>;

export function EmailUpdatesSection() {
  const { settings, updateSettings } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showSecondaryEmailDialog, setShowSecondaryEmailDialog] = useState(false);
  const [emailAddress, setEmailAddress] = useState(settings?.emailAddress || "");
  const [secondaryEmailAddress, setSecondaryEmailAddress] = useState(settings?.secondaryEmailAddress || "");
  const [newEmail, setNewEmail] = useState("");
  const [newSecondaryEmail, setNewSecondaryEmail] = useState("");
  
  // Email subscription settings
  const [receiveUpcomingOrders, setReceiveUpcomingOrders] = useState(settings?.receiveUpcomingOrders || false);
  const [upcomingOrdersFrequency, setUpcomingOrdersFrequency] = useState(settings?.upcomingOrdersFrequency || "weekly");
  const [receivePaymentReminders, setReceivePaymentReminders] = useState(settings?.receivePaymentReminders || false);
  const [receiveMarketingEmails, setReceiveMarketingEmails] = useState(settings?.receiveMarketingEmails || false);
  const [receiveProductUpdates, setReceiveProductUpdates] = useState(settings?.receiveProductUpdates || false);

  // Update state when settings load or change
  useEffect(() => {
    if (settings) {
      setEmailAddress(settings.emailAddress || "");
      setSecondaryEmailAddress(settings.secondaryEmailAddress || "");
      setReceiveUpcomingOrders(settings.receiveUpcomingOrders || false);
      setUpcomingOrdersFrequency(settings.upcomingOrdersFrequency || "weekly");
      setReceivePaymentReminders(settings.receivePaymentReminders || false);
      setReceiveMarketingEmails(settings.receiveMarketingEmails || false);
      setReceiveProductUpdates(settings.receiveProductUpdates || false);
    }
  }, [settings]);

  // Mutation for updating email settings
  const updateEmailSettings = useMutation({
    mutationFn: async (data: Partial<EmailSettings>) => {
      // Convert all boolean values to actual booleans, not strings
      const processedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'boolean' || value === 'true' || value === 'false') {
          acc[key] = typeof value === 'boolean' ? value : value === 'true';
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      console.log("Sending data to server:", processedData);
      
      const response = await apiRequest("PATCH", "/api/settings", processedData);
      return await response.json();
    },
    onSuccess: (data) => {
      updateSettings(data);
      toast({
        title: "Success",
        description: "Email settings have been updated",
      });
    },
    onError: (error) => {
      console.error("Error updating email settings:", error);
      toast({
        title: "Error",
        description: "Failed to update email settings",
        variant: "destructive",
      });
    }
  });

  const handleUpdateEmailAddress = () => {
    if (!newEmail || !z.string().email().safeParse(newEmail).success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const updateData: Partial<Settings> = { emailAddress: newEmail };
    updateEmailSettings.mutate(updateData);
    setEmailAddress(newEmail);
    setShowEmailDialog(false);
    setNewEmail("");
  };

  const handleUpdateSecondaryEmailAddress = () => {
    if (newSecondaryEmail && !z.string().email().safeParse(newSecondaryEmail).success) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    const updateData: Partial<Settings> = { secondaryEmailAddress: newSecondaryEmail };
    updateEmailSettings.mutate(updateData);
    setSecondaryEmailAddress(newSecondaryEmail);
    setShowSecondaryEmailDialog(false);
    setNewSecondaryEmail("");
  };

  const handleToggleUpcomingOrders = (checked: boolean) => {
    setReceiveUpcomingOrders(checked);
    const updateData: Partial<Settings> = { 
      receiveUpcomingOrders: checked 
    };
    updateEmailSettings.mutate(updateData);
  };

  const handleChangeFrequency = (value: string) => {
    if (value === "daily" || value === "weekly" || value === "monthly") {
      setUpcomingOrdersFrequency(value);
      const frequency = value as "daily" | "weekly" | "monthly";
      const updateData: Partial<Settings> = { 
        upcomingOrdersFrequency: frequency
      };
      updateEmailSettings.mutate(updateData);
    }
  };

  const handleTogglePaymentReminders = (checked: boolean) => {
    setReceivePaymentReminders(checked);
    const updateData: Partial<Settings> = { 
      receivePaymentReminders: checked 
    };
    updateEmailSettings.mutate(updateData);
  };

  const handleToggleMarketingEmails = (checked: boolean) => {
    setReceiveMarketingEmails(checked);
    const updateData: Partial<Settings> = { 
      receiveMarketingEmails: checked 
    };
    updateEmailSettings.mutate(updateData);
  };

  const handleToggleProductUpdates = (checked: boolean) => {
    setReceiveProductUpdates(checked);
    const updateData: Partial<Settings> = { 
      receiveProductUpdates: checked 
    };
    updateEmailSettings.mutate(updateData);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Email Updates</CardTitle>
        <CardDescription>Change which emails you want to receive.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Email Addresses */}
          <div className="bg-background rounded-lg border">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setShowEmailDialog(true)}>
              <div className="flex flex-col">
                <span className="font-medium">Email Address</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-sm text-gray-500">{emailAddress || "Not set"}</span>
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setShowSecondaryEmailDialog(true)}>
              <div className="flex flex-col">
                <span className="font-medium">Secondary Email Address</span>
              </div>
              <div className="flex items-center text-gray-600">
                <span className="text-sm text-gray-500">{secondaryEmailAddress || "Not set"}</span>
                <ChevronRightIcon className="ml-2 h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="space-y-5">
            <h3 className="text-lg font-medium">Notification Preferences</h3>
            
            {/* Upcoming Orders */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="upcoming-orders" 
                  checked={receiveUpcomingOrders}
                  onCheckedChange={handleToggleUpcomingOrders}
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="upcoming-orders" className="font-medium">
                    Upcoming Orders
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive a report with information about your upcoming orders.
                  </p>
                  
                  {receiveUpcomingOrders && (
                    <div className="mt-3 pl-1">
                      <RadioGroup value={upcomingOrdersFrequency} onValueChange={handleChangeFrequency} className="space-y-2">
                        {frequencyOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={`frequency-${option.value}`} />
                            <Label htmlFor={`frequency-${option.value}`} className="text-sm font-normal">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Payment Reminders */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="payment-reminders" 
                  checked={receivePaymentReminders}
                  onCheckedChange={handleTogglePaymentReminders}
                />
                <div className="space-y-1">
                  <Label htmlFor="payment-reminders" className="font-medium">
                    Payment Reminders
                  </Label>
                  <p className="text-sm text-gray-500">
                    Get notified when a customer payment is due or overdue.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Product Updates */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="product-updates" 
                  checked={receiveProductUpdates}
                  onCheckedChange={handleToggleProductUpdates}
                />
                <div className="space-y-1">
                  <Label htmlFor="product-updates" className="font-medium">
                    Product Updates
                  </Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications about new features and improvements to BakeGenie.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Marketing Emails */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox 
                  id="marketing-emails" 
                  checked={receiveMarketingEmails}
                  onCheckedChange={handleToggleMarketingEmails}
                />
                <div className="space-y-1">
                  <Label htmlFor="marketing-emails" className="font-medium">
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-gray-500">
                    Stay updated with special offers, discount codes, and promotional messages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Email Address Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Email Address</DialogTitle>
            <DialogDescription>
              This email will be used for account notifications and updates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Enter your email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              type="email"
              className="mb-1"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEmailDialog(false);
                setNewEmail("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateEmailAddress} 
              disabled={updateEmailSettings.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secondary Email Address Dialog */}
      <Dialog open={showSecondaryEmailDialog} onOpenChange={setShowSecondaryEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Secondary Email Address</DialogTitle>
            <DialogDescription>
              Add an additional email for backup notifications. Leave empty to remove.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Enter secondary email address (optional)"
              value={newSecondaryEmail}
              onChange={(e) => setNewSecondaryEmail(e.target.value)}
              type="email"
              className="mb-1"
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSecondaryEmailDialog(false);
                setNewSecondaryEmail("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateSecondaryEmailAddress} 
              disabled={updateEmailSettings.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}