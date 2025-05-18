import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, PlusCircle, Clock, Send, Trash2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

// Define schema for reminder schedule
const reminderScheduleSchema = z.object({
  templateId: z.number().optional().nullable(),
  daysBefore: z.number().min(0).max(90).optional().nullable(),
  isOverdue: z.boolean().default(false),
  customSubject: z.string().optional().nullable(),
  customBody: z.string().optional().nullable(),
  isEnabled: z.boolean().default(true),
});

// Define schema for reminder template
const reminderTemplateSchema = z.object({
  name: z.string().min(1, { message: "Template name is required" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  body: z.string().min(1, { message: "Body content is required" }),
  isDefault: z.boolean().default(false),
});

type ReminderSchedule = z.infer<typeof reminderScheduleSchema> & {
  id?: number;
  orderId: number;
  userId: number;
  lastSent?: Date | null;
  nextSend?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type ReminderTemplate = z.infer<typeof reminderTemplateSchema> & {
  id?: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type ReminderHistory = {
  id: number;
  scheduleId: number;
  orderId: number;
  sentTo: string;
  subject: string;
  body: string;
  status: string;
  sentAt: Date;
};

interface PaymentReminderSettingsProps {
  orderId: number;
  dueDate?: string | null;
  contactEmail?: string | null;
  orderStatus: string;
}

export default function PaymentReminderSettings({ 
  orderId, 
  dueDate, 
  contactEmail,
  orderStatus
}: PaymentReminderSettingsProps) {
  const [activeTab, setActiveTab] = useState("schedules");
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  
  const toast = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const { 
    data: schedules = [], 
    isLoading: isLoadingSchedules 
  } = useQuery({
    queryKey: ['/api/reminders/order', orderId],
    queryFn: () => apiRequest(`/api/reminders/order/${orderId}`),
    enabled: !!orderId,
  });
  
  const { 
    data: templates = [], 
    isLoading: isLoadingTemplates 
  } = useQuery({
    queryKey: ['/api/reminders/templates'],
    queryFn: () => apiRequest('/api/reminders/templates'),
  });
  
  const { 
    data: reminderHistory = [], 
    isLoading: isLoadingHistory 
  } = useQuery({
    queryKey: ['/api/reminders/history/order', orderId],
    queryFn: () => apiRequest(`/api/reminders/history/order/${orderId}`),
    enabled: !!orderId,
  });
  
  // Form for adding/editing a schedule
  const scheduleForm = useForm<z.infer<typeof reminderScheduleSchema>>({
    resolver: zodResolver(reminderScheduleSchema),
    defaultValues: {
      templateId: null,
      daysBefore: 7, // Default to 7 days before
      isOverdue: false,
      customSubject: null,
      customBody: null,
      isEnabled: true,
    },
  });
  
  // Form for adding/editing a template
  const templateForm = useForm<z.infer<typeof reminderTemplateSchema>>({
    resolver: zodResolver(reminderTemplateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      isDefault: false,
    },
  });
  
  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/reminders/order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/order', orderId] });
      setIsAddingSchedule(false);
      scheduleForm.reset();
      toast.toast({
        title: "Success",
        description: "Reminder schedule created successfully",
      });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: "Failed to create reminder schedule",
        variant: "destructive",
      });
    },
  });
  
  const updateScheduleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest(`/api/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/order', orderId] });
      setEditingScheduleId(null);
      scheduleForm.reset();
      toast.toast({
        title: "Success",
        description: "Reminder schedule updated successfully",
      });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: "Failed to update reminder schedule",
        variant: "destructive",
      });
    },
  });
  
  const deleteScheduleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/reminders/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/order', orderId] });
      toast.toast({
        title: "Success",
        description: "Reminder schedule deleted successfully",
      });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: "Failed to delete reminder schedule",
        variant: "destructive",
      });
    },
  });
  
  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/reminders/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/templates'] });
      setIsAddingTemplate(false);
      templateForm.reset();
      toast.toast({
        title: "Success",
        description: "Reminder template created successfully",
      });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: "Failed to create reminder template",
        variant: "destructive",
      });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiRequest(`/api/reminders/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/templates'] });
      setEditingTemplateId(null);
      templateForm.reset();
      toast.toast({
        title: "Success",
        description: "Reminder template updated successfully",
      });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: "Failed to update reminder template",
        variant: "destructive",
      });
    },
  });
  
  const sendReminderMutation = useMutation({
    mutationFn: (scheduleId: number) => apiRequest(`/api/reminders/send/${scheduleId}`, {
      method: 'POST',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['/api/reminders/history/order', orderId] });
      toast.toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    },
  });
  
  // Effect to update form when editing a schedule
  useEffect(() => {
    if (editingScheduleId) {
      const schedule = schedules.find((s: ReminderSchedule) => s.id === editingScheduleId);
      if (schedule) {
        scheduleForm.reset({
          templateId: schedule.templateId || null,
          daysBefore: schedule.daysBefore || null,
          isOverdue: schedule.isOverdue || false,
          customSubject: schedule.customSubject || null,
          customBody: schedule.customBody || null,
          isEnabled: schedule.isEnabled,
        });
      }
    }
  }, [editingScheduleId, schedules]);
  
  // Effect to update form when editing a template
  useEffect(() => {
    if (editingTemplateId) {
      const template = templates.find((t: ReminderTemplate) => t.id === editingTemplateId);
      if (template) {
        templateForm.reset({
          name: template.name,
          subject: template.subject,
          body: template.body,
          isDefault: template.isDefault || false,
        });
      }
    }
  }, [editingTemplateId, templates]);
  
  // Handlers
  const handleAddSchedule = (data: z.infer<typeof reminderScheduleSchema>) => {
    createScheduleMutation.mutate(data);
  };
  
  const handleUpdateSchedule = (data: z.infer<typeof reminderScheduleSchema>) => {
    if (editingScheduleId) {
      updateScheduleMutation.mutate({ id: editingScheduleId, data });
    }
  };
  
  const handleDeleteSchedule = (id: number) => {
    if (confirm("Are you sure you want to delete this reminder schedule?")) {
      deleteScheduleMutation.mutate(id);
    }
  };
  
  const handleAddTemplate = (data: z.infer<typeof reminderTemplateSchema>) => {
    createTemplateMutation.mutate(data);
  };
  
  const handleUpdateTemplate = (data: z.infer<typeof reminderTemplateSchema>) => {
    if (editingTemplateId) {
      updateTemplateMutation.mutate({ id: editingTemplateId, data });
    }
  };
  
  const handleSendReminder = (scheduleId: number) => {
    if (confirm("Are you sure you want to send this reminder now?")) {
      sendReminderMutation.mutate(scheduleId);
    }
  };
  
  const renderScheduleDescription = (schedule: ReminderSchedule) => {
    if (schedule.isOverdue) {
      return "Sent after the due date is passed";
    } else if (schedule.daysBefore === 1) {
      return "Sent 1 day before due date";
    } else {
      return `Sent ${schedule.daysBefore} days before due date`;
    }
  };
  
  // Check if payment reminders should be available based on order status
  const isReminderAvailable = orderStatus === 'Confirmed' || orderStatus === 'Paid';
  
  // Format help text for reminder message placeholders
  const placeholdersHelp = (
    <FormDescription>
      Available placeholders:
      <ul className="list-disc pl-5 mt-1 text-xs">
        <li>[ORDER_NUMBER] - The order number</li>
        <li>[CUSTOMER_NAME] - Full customer name</li>
        <li>[CUSTOMER_FIRST_NAME] - First name only</li>
        <li>[AMOUNT_DUE] - The total amount due</li>
        <li>[DUE_DATE] - The payment due date</li>
        <li>[DAYS_REMAINING] - Days remaining until due date</li>
        <li>[BUSINESS_NAME] - Your business name</li>
      </ul>
    </FormDescription>
  );
  
  if (!isReminderAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Reminders</CardTitle>
          <CardDescription>
            Payment reminders are only available for orders with a Confirmed or Paid status.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!dueDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Reminders</CardTitle>
          <CardDescription>
            Please set a payment due date for this order to enable payment reminders.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!contactEmail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Reminders</CardTitle>
          <CardDescription>
            The customer doesn't have an email address. Please add an email to the customer record to enable payment reminders.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Reminders</CardTitle>
        <CardDescription>
          Set up automatic payment reminders for this order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="schedules">Reminder Schedules</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          {/* Schedules Tab */}
          <TabsContent value="schedules">
            {isLoadingSchedules ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {!isAddingSchedule && !editingScheduleId && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingSchedule(true)}
                      className="w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Reminder Schedule
                    </Button>
                  </div>
                )}
                
                {(isAddingSchedule || editingScheduleId) && (
                  <Form {...scheduleForm}>
                    <form 
                      onSubmit={scheduleForm.handleSubmit(
                        editingScheduleId ? handleUpdateSchedule : handleAddSchedule
                      )}
                      className="mb-6 space-y-4 border p-4 rounded-md"
                    >
                      <h3 className="text-lg font-medium">
                        {editingScheduleId ? "Edit Reminder Schedule" : "New Reminder Schedule"}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <FormField
                            control={scheduleForm.control}
                            name="isOverdue"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                <div className="space-y-0.5">
                                  <FormLabel>Overdue Reminder</FormLabel>
                                  <FormDescription>
                                    Send reminder after due date has passed
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      if (checked) {
                                        scheduleForm.setValue('daysBefore', null);
                                      } else {
                                        scheduleForm.setValue('daysBefore', 7);
                                      }
                                    }}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {!scheduleForm.watch('isOverdue') && (
                          <div>
                            <FormField
                              control={scheduleForm.control}
                              name="daysBefore"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Days Before Due Date</FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value?.toString() || ""}
                                      onValueChange={(value) => field.onChange(parseInt(value))}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select days" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1 day before</SelectItem>
                                        <SelectItem value="3">3 days before</SelectItem>
                                        <SelectItem value="7">7 days before</SelectItem>
                                        <SelectItem value="14">14 days before</SelectItem>
                                        <SelectItem value="30">30 days before</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <FormField
                          control={scheduleForm.control}
                          name="templateId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reminder Template</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value?.toString() || ""}
                                  onValueChange={(value) => {
                                    const templateId = value ? parseInt(value) : null;
                                    field.onChange(templateId);
                                    
                                    // If template selected, clear custom fields
                                    if (templateId) {
                                      scheduleForm.setValue('customSubject', null);
                                      scheduleForm.setValue('customBody', null);
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a template or use custom message" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Custom message</SelectItem>
                                    {templates.map((template: ReminderTemplate) => (
                                      <SelectItem key={template.id} value={template.id?.toString() || ""}>
                                        {template.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Show custom fields if no template is selected */}
                      {!scheduleForm.watch('templateId') && (
                        <>
                          <div>
                            <FormField
                              control={scheduleForm.control}
                              name="customSubject"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Subject</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Payment Reminder for Your Order"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div>
                            <FormField
                              control={scheduleForm.control}
                              name="customBody"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Message</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="e.g., Hi [CUSTOMER_FIRST_NAME], This is a friendly reminder that your payment of [AMOUNT_DUE] is due in [DAYS_REMAINING] days."
                                      rows={5}
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  {placeholdersHelp}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <FormField
                          control={scheduleForm.control}
                          name="isEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Enable Reminder</FormLabel>
                                <FormDescription>
                                  Turn this reminder on or off
                                </FormDescription>
                              </div>
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
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingSchedule(false);
                            setEditingScheduleId(null);
                            scheduleForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}>
                          {(createScheduleMutation.isPending || updateScheduleMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {editingScheduleId ? "Update" : "Create"} Reminder
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
                
                {/* List of existing schedules */}
                {schedules.length > 0 ? (
                  <div className="space-y-4">
                    {schedules.map((schedule: ReminderSchedule) => (
                      <Card key={schedule.id} className={`relative ${!schedule.isEnabled ? 'opacity-60' : ''}`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between">
                            <div className="flex items-center">
                              {schedule.isOverdue ? (
                                <span>Overdue Reminder</span>
                              ) : (
                                <span>{schedule.daysBefore} {schedule.daysBefore === 1 ? 'Day' : 'Days'} Before Due Date</span>
                              )}
                              {!schedule.isEnabled && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                  Disabled
                                </span>
                              )}
                            </div>
                          </CardTitle>
                          <CardDescription>
                            {renderScheduleDescription(schedule)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-sm">
                            <p className="font-medium">Template: {
                              schedule.templateId ? 
                                templates.find((t: ReminderTemplate) => t.id === schedule.templateId)?.name || "Custom" :
                                "Custom Message"
                            }</p>
                            {schedule.lastSent && (
                              <p className="text-muted-foreground mt-1">
                                Last sent: {format(new Date(schedule.lastSent), 'MMM d, yyyy')}
                              </p>
                            )}
                            {schedule.nextSend && (
                              <p className="text-muted-foreground">
                                Next send: {format(new Date(schedule.nextSend), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReminder(schedule.id!)}
                            disabled={sendReminderMutation.isPending}
                          >
                            {sendReminderMutation.isPending && (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            )}
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Send Now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingScheduleId(schedule.id!)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id!)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md">
                    <p className="text-muted-foreground">No reminder schedules set up yet</p>
                    {!isAddingSchedule && (
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingSchedule(true)}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Reminder Schedule
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Templates Tab */}
          <TabsContent value="templates">
            {isLoadingTemplates ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {!isAddingTemplate && !editingTemplateId && (
                  <div className="mb-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingTemplate(true)}
                      className="w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Reminder Template
                    </Button>
                  </div>
                )}
                
                {(isAddingTemplate || editingTemplateId) && (
                  <Form {...templateForm}>
                    <form 
                      onSubmit={templateForm.handleSubmit(
                        editingTemplateId ? handleUpdateTemplate : handleAddTemplate
                      )}
                      className="mb-6 space-y-4 border p-4 rounded-md"
                    >
                      <h3 className="text-lg font-medium">
                        {editingTemplateId ? "Edit Reminder Template" : "New Reminder Template"}
                      </h3>
                      
                      <div>
                        <FormField
                          control={templateForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Template Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., 7-Day Reminder"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={templateForm.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Subject</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Payment Reminder for Your Order"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={templateForm.control}
                          name="body"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., Hi [CUSTOMER_FIRST_NAME], This is a friendly reminder that your payment of [AMOUNT_DUE] is due in [DAYS_REMAINING] days."
                                  rows={6}
                                  {...field}
                                />
                              </FormControl>
                              {placeholdersHelp}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div>
                        <FormField
                          control={templateForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Default Template</FormLabel>
                                <FormDescription>
                                  Make this your default template
                                </FormDescription>
                              </div>
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
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingTemplate(false);
                            setEditingTemplateId(null);
                            templateForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                          {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {editingTemplateId ? "Update" : "Create"} Template
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
                
                {/* List of existing templates */}
                {templates.length > 0 ? (
                  <div className="space-y-4">
                    {templates.map((template: ReminderTemplate) => (
                      <Card key={template.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between">
                            <span>{template.name}</span>
                            {template.isDefault && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                            )}
                          </CardTitle>
                          <CardDescription>Subject: {template.subject}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="text-sm">
                            <p className="line-clamp-3">{template.body}</p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTemplateId(template.id!)}
                          >
                            Edit
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border rounded-md">
                    <p className="text-muted-foreground">No reminder templates created yet</p>
                    {!isAddingTemplate && (
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingTemplate(true)}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Reminder Template
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history">
            {isLoadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                {reminderHistory.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {reminderHistory.map((record: ReminderHistory) => (
                        <Card key={record.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              Sent on {format(new Date(record.sentAt), 'MMM d, yyyy')}
                            </CardTitle>
                            <CardDescription>To: {record.sentTo}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="text-sm">
                              <p className="font-medium">Subject: {record.subject}</p>
                              <p className="line-clamp-3 mt-1">{record.body}</p>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <span className={`text-xs px-2 py-1 rounded ${
                              record.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 border rounded-md">
                    <p className="text-muted-foreground">No reminder history yet</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}