import React from "react";
import { Task } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTaskSchema } from "@shared/schema";
import { CalendarIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn, formatDate } from "@/lib/utils";
import { useTasks } from "@/hooks/use-tasks";

// Extended schema with validation rules
const taskFormSchema = insertTaskSchema.extend({
  title: z.string().min(1, "Title is required"),
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
      userId: 1, 
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
        relatedOrderId: selectedTask.relatedOrderId,
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Task List</h1>
        <Button 
          className="bg-emerald-500 hover:bg-emerald-600 text-white" 
          onClick={() => setIsNewTaskDialogOpen(true)}
        >
          <PlusIcon className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      <div className="mt-6 bg-white rounded-md shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <Input 
                placeholder="Search Tasks" 
                className="pl-8 w-64 h-9"
              />
              <div className="absolute left-2.5 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
              </div>
            </div>
            
            <Button variant="outline" className="flex items-center gap-1 text-sm font-normal h-9">
              <span>Open Tasks</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-2 bg-gray-50 py-3 px-4 border-b">
              <div className="font-medium text-gray-600">Task</div>
              <div className="font-medium text-gray-600">Order</div>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">
                <span className="animate-pulse">Loading tasks...</span>
              </div>
            ) : tasks.length > 0 ? (
              <div>
                {tasks.map((task) => (
                  <div key={task.id} className="grid grid-cols-2 py-3 px-4 border-b hover:bg-gray-50 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={task.completed === true}
                        onCheckedChange={() => toggleTaskCompletion(task.id, !task.completed)}
                      />
                      <div className={`${task.completed ? 'text-gray-400 line-through' : ''}`}>
                        {task.title}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">
                        {task.relatedOrderId ? `Order #${task.relatedOrderId}` : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsEditTaskDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No tasks found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Add a new task to your list</DialogDescription>
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
                                <span>Select date</span>
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
            <DialogDescription>Update task details</DialogDescription>
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
                                <span>Select date</span>
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                  {isSubmitting ? "Updating..." : "Update Task"}
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