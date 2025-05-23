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
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = React.useState("profile");

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
          <div className="space-y-4">
            {/* Current Plan Card */}
            <Card className="overflow-hidden border-none shadow-sm">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/90 text-white p-2 rounded-full">
                      <CreditCardIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Professional Plan</h3>
                      <p className="text-sm text-muted-foreground">$20.00 per month</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-700 border border-green-500/50">Active</span>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium">Plan summary</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-primary font-medium"
                      onClick={() => {
                        toast({
                          title: "Change Plan",
                          description: "Plan change dialog would open here."
                        });
                      }}
                    >
                      Change plan
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next billing</span>
                      <span>Jun 21, 2025</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing cycle</span>
                      <span>Monthly</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payment method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-muted p-2 rounded-md">
                      <CreditCardIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Visa •••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expires 12/2024</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary"
                    onClick={() => {
                      toast({
                        title: "Update Payment Method",
                        description: "Payment method update dialog would open here."
                      });
                    }}
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Billing History Card */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Billing history</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center py-8 bg-muted/20 rounded-md">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No billing history available yet</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancel Subscription */}
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="text-muted-foreground hover:text-destructive border-gray-200"
                onClick={() => {
                  toast({
                    title: "Cancel Subscription",
                    description: "Are you sure you want to cancel your subscription?",
                    variant: "destructive"
                  });
                }}
              >
                Cancel subscription
              </Button>
            </div>
          </div>
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