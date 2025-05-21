import React from "react";
import PageHeader from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserIcon,
  Building2Icon,
  SaveIcon,
  LogOutIcon,
  KeyIcon,
  CreditCardIcon,
  BellIcon,
  ShieldIcon,
  ChevronRightIcon,
  XCircleIcon,
  ReceiptIcon
} from "lucide-react";

// Extended schema with validation rules for user profile
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  businessName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

// Schema for password change
const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Account = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("profile");
  const [setLocation] = useLocation();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      businessName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle profile update
  const handleProfileSubmit = async (data: ProfileFormValues) => {
    try {
      // API call would go here
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  };

  // Handle password update
  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    try {
      // API call would go here
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      passwordForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error updating your password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Account Settings" />

      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldIcon className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCardIcon className="h-4 w-4 mr-2" /> Billing
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <BellIcon className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Manage your personal and business information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-6" />
                  
                  <div className="flex items-center mb-4">
                    <Building2Icon className="h-5 w-5 mr-2 text-primary-500" />
                    <h3 className="text-lg font-medium">Business Information</h3>
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="mt-4">
                    <SaveIcon className="h-4 w-4 mr-2" /> Save Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Current password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="New password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm new password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit">
                        <KeyIcon className="h-4 w-4 mr-2" /> Update Password
                      </Button>
                    </form>
                  </Form>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">
                    Enable Two-Factor Authentication
                  </Button>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-medium mb-4">Sessions</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage your active sessions and sign out from other devices.
                  </p>
                  <Button variant="outline">
                    <LogOutIcon className="h-4 w-4 mr-2" /> Sign Out From All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Update your subscription details, change your billing information or download your billing receipts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div 
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setLocation("/manage-subscription")}
                >
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">Manage Subscription</p>
                      <p className="text-sm text-muted-foreground">Update plan, change billing cycle</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">Active</span>
                    <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div 
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    // Handle update billing details
                    toast({
                      title: "Update Billing Details",
                      description: "This feature will allow changing payment methods."
                    });
                  }}
                >
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">Update Billing Details</p>
                      <p className="text-sm text-muted-foreground">Change payment method, billing address</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div 
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => {
                    // Handle billing history
                    toast({
                      title: "Billing History",
                      description: "View and download past invoices."
                    });
                  }}
                >
                  <div className="flex items-center">
                    <ReceiptIcon className="h-5 w-5 mr-3 text-primary" />
                    <div>
                      <p className="font-medium">Billing History</p>
                      <p className="text-sm text-muted-foreground">View and download past invoices</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div 
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted transition-colors border-destructive/20 hover:bg-destructive/10"
                  onClick={() => {
                    // Handle cancel subscription
                    toast({
                      title: "Cancel Subscription",
                      description: "Starting the cancellation process.",
                      variant: "destructive"
                    });
                  }}
                >
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 mr-3 text-destructive" />
                    <div>
                      <p className="font-medium">Cancel Subscription</p>
                      <p className="text-sm text-muted-foreground">End your subscription and delete billing information</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-muted-foreground">Receive notifications when an order status changes</p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="order-updates" className="h-4 w-4 mr-2" defaultChecked />
                        <label htmlFor="order-updates" className="text-sm">Enabled</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Upcoming Events</p>
                        <p className="text-sm text-muted-foreground">Get reminded about upcoming event dates</p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="upcoming-events" className="h-4 w-4 mr-2" defaultChecked />
                        <label htmlFor="upcoming-events" className="text-sm">Enabled</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">New Enquiries</p>
                        <p className="text-sm text-muted-foreground">Get notified when you receive a new enquiry</p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="new-enquiries" className="h-4 w-4 mr-2" defaultChecked />
                        <label htmlFor="new-enquiries" className="text-sm">Enabled</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing & Tips</p>
                        <p className="text-sm text-muted-foreground">Receive baking tips and product updates</p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="marketing" className="h-4 w-4 mr-2" />
                        <label htmlFor="marketing" className="text-sm">Enabled</label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-medium mb-4">SMS Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order Confirmations</p>
                        <p className="text-sm text-muted-foreground">Receive SMS when an order is confirmed</p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="sms-orders" className="h-4 w-4 mr-2" />
                        <label htmlFor="sms-orders" className="text-sm">Enabled</label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delivery Reminders</p>
                        <p className="text-sm text-muted-foreground">Get SMS reminders for upcoming deliveries</p>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="sms-deliveries" className="h-4 w-4 mr-2" />
                        <label htmlFor="sms-deliveries" className="text-sm">Enabled</label>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="mt-4">
                  <SaveIcon className="h-4 w-4 mr-2" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;