import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema } from "@shared/schema";
import { CalendarIcon, PlusIcon, PencilIcon, CheckIcon, Clock3Icon, AlarmClockIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { cn, formatDate } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";

// Extended schema with validation rules
const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(1, "Title is required"),
  dueDate: z.date().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TaskList = () => {
  const { toast } = useToast();
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = React.useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { tasks, isLoading } = useTasks();
  
  // Task toggle function
  const toggleTaskCompletion = async (id: number, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
        credentials: 'include'
      });
      
      // Refresh the tasks list
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  // Form for new task
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      title: "",
      description: "",
      dueDate: undefined,
      completed: false,
      priority: "Medium",
    },
  });

  // Form for editing task
  const editForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      userId: 1,
      title: "",
      description: "",
      dueDate: undefined,
      completed: false,
      priority: "Medium",
    },
  });

  // Set edit form values when selected task changes
  React.useEffect(() => {
    if (selectedTask) {
      editForm.reset({
        userId: selectedTask.userId,
        orderId: selectedTask.orderId,
        title: selectedTask.title,
        description: selectedTask.description || "",
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate) : undefined,
        completed: selectedTask.completed,
        priority: selectedTask.priority as "Low" | "Medium" | "High",
      });
    }
  }, [selectedTask, editForm]);

  // Handle new task submission
  const handleNewTaskSubmit = async (data: TaskFormValues) => {
    setIsSubmitting(true);
    console.log("Submitting task form data:", data);
    
    try {
      // Manually construct the request for better control
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Only pass the exact fields needed by the API and use correct field names
          userId: 1,
          title: data.title,
          description: data.description || null,
          priority: data.priority || "Medium",
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
          completed: false
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create task: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Task created successfully:", result);
      
      // Invalidate tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      // Reset form and close dialog
      form.reset();
      setIsNewTaskDialogOpen(false);
      
      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "There was an error creating the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit task submission
  const handleEditTaskSubmit = async (data: TaskFormValues) => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    console.log("Submitting edit form data:", data);
    
    try {
      // Use fetch directly for more control
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          priority: data.priority || "Medium",
          dueDate: data.dueDate ? data.dueDate.toISOString() : null,
          completed: data.completed || false
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update task: ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Task updated successfully:", result);
      
      // Invalidate tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      // Close dialog
      setIsEditTaskDialogOpen(false);
      
      toast({
        title: "Task Updated",
        description: "Your task has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "There was an error updating the task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tasks by completion status
  const completedTasks = tasks.filter((task) => task.completed);
  const incompleteTasks = tasks.filter((task) => !task.completed);

  // Get priority badge class
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-500">High</Badge>;
      case "Medium":
        return <Badge className="bg-amber-500">Medium</Badge>;
      case "Low":
        return <Badge className="bg-green-500">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Task List"
        actions={
          <Button onClick={() => setIsNewTaskDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" /> New Task
          </Button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6">
        {/* Incomplete Tasks */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Tasks To Complete</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : incompleteTasks.length > 0 ? (
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <Card key={task.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Checkbox
                        className="mt-1"
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id, !task.completed)}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{task.title}</h3>
                          <div className="flex items-center space-x-2">
                            {task.dueDate && (
                              <div className="flex items-center text-sm text-gray-500">
                                <AlarmClockIcon className="h-4 w-4 mr-1" />
                                {formatDate(new Date(task.dueDate))}
                              </div>
                            )}
                            {getPriorityBadge(task.priority)}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsEditTaskDialogOpen(true);
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="shadow-sm bg-gray-50">
              <CardContent className="p-6 text-center">
                <CheckIcon className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <h3 className="font-medium text-gray-900 mb-1">All caught up!</h3>
                <p className="text-sm text-gray-500">You have no pending tasks.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="shadow-sm bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <Checkbox
                        className="mt-1"
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id, !task.completed)}
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium line-through text-gray-500">{task.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsEditTaskDialogOpen(true);
                              }}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-500 mt-1 line-through">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNewTaskSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTaskDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditTaskSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Task title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Task description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as completed</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTaskDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;
