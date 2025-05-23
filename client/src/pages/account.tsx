import React, { useState, useEffect } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import UpdatePaymentMethodDialog from "@/components/payment/update-payment-method-dialog";
import CancelSubscriptionDialog from "@/components/payment/cancel-subscription-dialog";
import TrialBanner from "@/components/subscription/trial-banner";
import { Switch } from "@/components/ui/switch";
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
  ReceiptIcon,
  LoaderIcon,
  CheckCircle2Icon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

// Schema for notification preferences
const notificationPrefsSchema = z.object({
  orderUpdates: z.boolean().default(true),
  upcomingEvents: z.boolean().default(true),
  newEnquiries: z.boolean().default(true),
  marketingTips: z.boolean().default(false),
  smsOrderConfirmations: z.boolean().default(false),
  smsDeliveryReminders: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationPrefsValues = z.infer<typeof notificationPrefsSchema>;

const Account = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = React.useState("profile");
  const [isUpdatePaymentDialogOpen, setIsUpdatePaymentDialogOpen] = useState(false);
  const [isCancelSubscriptionOpen, setIsCancelSubscriptionOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch user profile data
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/users/current'],
    retry: 1,
  });
  
  // Fetch notification preferences
  const { data: notificationPrefs, isLoading: isNotificationPrefsLoading } = useQuery({
    queryKey: ['/api/users/notification-preferences'],
    retry: 1,
  });
  
  // Fetch user's active sessions
  const { data: userSessions } = useQuery({
    queryKey: ['/api/users/sessions'],
    retry: 1,
  });
  
  // Fetch payment method data
  const { data: paymentMethodData, refetch: refetchPaymentMethod } = useQuery({
    queryKey: ['/api/subscription/payment-method'],
    retry: false,
    staleTime: 0, // Don't use cached data
  });
  
  // Fetch subscription data
  const { data: subscriptionData } = useQuery({
    queryKey: ['/api/subscription/current'],
    retry: 1,
  });
  
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
  
  // Notification preferences form
  const notificationForm = useForm<NotificationPrefsValues>({
    resolver: zodResolver(notificationPrefsSchema),
    defaultValues: {
      orderUpdates: true,
      upcomingEvents: true,
      newEnquiries: true,
      marketingTips: false,
      smsOrderConfirmations: false,
      smsDeliveryReminders: false,
    },
  });
  
  // Update profile form values when data is fetched
  useEffect(() => {
    if (userData) {
      console.log("Loading user data into profile form:", userData);
      profileForm.reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        businessName: userData.businessName || "",
        address: userData.address || "",
        city: userData.city || "",
        state: userData.state || "",
        zip: userData.zip || "",
        country: userData.country || "",
      });
    }
  }, [userData, profileForm]);
  
  // Update notification preferences form values when data is fetched
  useEffect(() => {
    if (notificationPrefs) {
      notificationForm.reset({
        orderUpdates: notificationPrefs.orderUpdates ?? true,
        upcomingEvents: notificationPrefs.upcomingEvents ?? true,
        newEnquiries: notificationPrefs.newEnquiries ?? true,
        marketingTips: notificationPrefs.marketingTips ?? false,
        smsOrderConfirmations: notificationPrefs.smsOrderConfirmations ?? false,
        smsDeliveryReminders: notificationPrefs.smsDeliveryReminders ?? false,
      });
    }
  }, [notificationPrefs, notificationForm]);
  
  // Handle payment method update
  const handlePaymentMethodUpdated = () => {
    refetchPaymentMethod();
    toast({
      title: "Payment Method Updated",
      description: "Your payment information has been successfully updated."
    });
  };
  
  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      return await apiRequest('PATCH', '/api/users/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/current'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: error.message || "There was an error updating your profile.",
        variant: "destructive",
      });
    }
  });
  
  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      return await apiRequest('POST', '/api/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error("Password update error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "There was an error updating your password.",
        variant: "destructive",
      });
    }
  });
  
  // Notification preferences update mutation
  const updateNotificationPrefsMutation = useMutation({
    mutationFn: async (data: NotificationPrefsValues) => {
      return await apiRequest('PATCH', '/api/users/notification-preferences', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/notification-preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been successfully updated.",
      });
    },
    onError: (error: any) => {
      console.error("Notification preferences update error:", error);
      toast({
        title: "Error",
        description: "There was an error updating your notification preferences.",
        variant: "destructive",
      });
    }
  });
  
  // Sign out from all devices mutation
  const terminateSessionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/users/terminate-sessions', {});
    },
    onSuccess: () => {
      toast({
        title: "Sessions Terminated",
        description: "You have been signed out from all other devices.",
      });
      // Refresh sessions data
      queryClient.invalidateQueries({ queryKey: ['/api/users/sessions'] });
    },
    onError: (error: any) => {
      console.error("Terminate sessions error:", error);
      toast({
        title: "Error",
        description: "There was an error signing out from other devices.",
        variant: "destructive",
      });
    }
  });

  // Handle profile update
  const handleProfileSubmit = async (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle password update
  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    updatePasswordMutation.mutate(data);
  };
  
  // Handle notification preferences update
  const handleNotificationPrefsSubmit = async (data: NotificationPrefsValues) => {
    updateNotificationPrefsMutation.mutate(data);
  };
  
  // Handle terminate all sessions
  const handleTerminateSessions = () => {
    terminateSessionsMutation.mutate();
  };

  return (
    <div className="p-6">
      {/* Payment Method Update Dialog */}
      <UpdatePaymentMethodDialog
        open={isUpdatePaymentDialogOpen}
        onOpenChange={setIsUpdatePaymentDialogOpen}
        onSuccess={handlePaymentMethodUpdated}
      />
      
      <PageHeader title="Account Settings" />
      <TrialBanner />

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

                      <Button 
                        type="submit"
                        disabled={updatePasswordMutation.isPending}
                      >
                        {updatePasswordMutation.isPending ? (
                          <>
                            <LoaderIcon className="h-4 w-4 mr-2 animate-spin" /> Updating...
                          </>
                        ) : (
                          <>
                            <KeyIcon className="h-4 w-4 mr-2" /> Update Password
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">
                    Enable Two-Factor Authentication
                  </Button>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-medium mb-4">Sessions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your active sessions and sign out from other devices.
                  </p>
                  
                  {userSessions && userSessions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-md border">
                        <div className="p-3 text-sm">
                          <div className="font-medium mb-2">Active Sessions</div>
                          <div className="grid grid-cols-3 gap-2 text-muted-foreground mb-2">
                            <div>Device</div>
                            <div>IP Address</div>
                            <div>Last Activity</div>
                          </div>
                          {userSessions.map((session) => (
                            <div key={session.id} className="grid grid-cols-3 gap-2 py-2 border-t">
                              <div>{session.deviceInfo || "Unknown Device"}</div>
                              <div>{session.ipAddress || "Unknown"}</div>
                              <div>{new Date(session.lastActive).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        onClick={handleTerminateSessions}
                        disabled={terminateSessionsMutation.isPending}
                      >
                        {terminateSessionsMutation.isPending ? (
                          <>
                            <LoaderIcon className="h-4 w-4 mr-2 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            <LogOutIcon className="h-4 w-4 mr-2" /> Sign Out From All Other Devices
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4 text-center bg-muted/20 rounded-md">
                      <p className="text-sm text-muted-foreground">No active sessions found</p>
                      <p className="text-xs text-muted-foreground mt-1">Only your current session is active</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-4">
            {/* Cancel Subscription Dialog */}
            <CancelSubscriptionDialog
              open={isCancelSubscriptionOpen}
              onOpenChange={setIsCancelSubscriptionOpen}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
                toast({
                  title: "Subscription Cancelled",
                  description: "Your subscription has been successfully cancelled."
                });
              }}
            />
            
            {/* Current Plan Card */}
            <Card className="overflow-hidden border-none shadow-sm">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/90 text-white p-2 rounded-full">
                      <CreditCardIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {subscriptionData?.plan?.name || "Professional Plan"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscriptionData?.plan?.price ? `$${subscriptionData.plan.price} per ${subscriptionData.plan.interval}` : "$20.00 per month"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      subscriptionData?.status === "active" 
                        ? "bg-green-500/20 text-green-700 border border-green-500/50" 
                        : "bg-yellow-500/20 text-yellow-700 border border-yellow-500/50"
                    }`}>
                      {subscriptionData?.status === "active" ? "Active" : (subscriptionData?.status || "Processing")}
                    </span>
                    
                    {subscriptionData?.status === "active" && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-destructive font-medium"
                        onClick={() => setIsCancelSubscriptionOpen(true)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
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
                        navigate("/plans");
                      }}
                    >
                      Change plan
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next billing</span>
                      <span>
                        {subscriptionData?.currentPeriodEnd 
                          ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString() 
                          : "Not available"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Billing cycle</span>
                      <span className="capitalize">{subscriptionData?.plan?.interval || "Monthly"}</span>
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
                {paymentMethodData?.paymentMethod ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="bg-muted p-2 rounded-md">
                        <CreditCardIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {`${paymentMethodData.paymentMethod.brand.charAt(0).toUpperCase() + paymentMethodData.paymentMethod.brand.slice(1)} •••• ${paymentMethodData.paymentMethod.last4}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires {`${paymentMethodData.paymentMethod.expMonth}/${paymentMethodData.paymentMethod.expYear}`}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary"
                      onClick={() => setIsUpdatePaymentDialogOpen(true)}
                    >
                      Update
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No payment method on file</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsUpdatePaymentDialogOpen(true)}
                    >
                      <CreditCardIcon className="h-4 w-4 mr-2" /> Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing History Card */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Billing history</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigate("/billing-history");
                    }}
                  >
                    <ReceiptIcon className="h-4 w-4 mr-2" /> View all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center py-8 bg-muted/20 rounded-md">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No billing history available yet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              {isNotificationPrefsLoading ? (
                <div className="flex justify-center my-12">
                  <LoaderIcon className="h-8 w-8 animate-spin text-primary/70" />
                </div>
              ) : (
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(handleNotificationPrefsSubmit)} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Order Updates</p>
                            <p className="text-sm text-muted-foreground">Receive notifications when an order status changes</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="orderUpdates"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Upcoming Events</p>
                            <p className="text-sm text-muted-foreground">Get reminded about upcoming event dates</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="upcomingEvents"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Enquiries</p>
                            <p className="text-sm text-muted-foreground">Get notified when you receive a new enquiry</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="newEnquiries"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Marketing & Tips</p>
                            <p className="text-sm text-muted-foreground">Receive baking tips and product updates</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="marketingTips"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
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
                          <FormField
                            control={notificationForm.control}
                            name="smsOrderConfirmations"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Delivery Reminders</p>
                            <p className="text-sm text-muted-foreground">Get SMS reminders for upcoming deliveries</p>
                          </div>
                          <FormField
                            control={notificationForm.control}
                            name="smsDeliveryReminders"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="mt-4"
                      disabled={updateNotificationPrefsMutation.isPending}
                    >
                      {updateNotificationPrefsMutation.isPending ? (
                        <>
                          <LoaderIcon className="h-4 w-4 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <SaveIcon className="h-4 w-4 mr-2" /> Save Preferences
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;