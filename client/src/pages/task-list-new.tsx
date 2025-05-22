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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [taskFilter, setTaskFilter] = React.useState<string>("Open Tasks");
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
  const editForm = useForm<TaskFormValues & { hasDueDate: boolean }>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      userId: 1,
      title: "",
      description: "",
      dueDate: undefined,
      completed: false,
      priority: "Medium",
      hasDueDate: false,
    },
  });

  // Set edit form values when selected task changes
  React.useEffect(() => {
    if (selectedTask) {
      console.log("Selected task for editing:", selectedTask);
      
      // Handle different property names in the backend response
      // The server returns data with snake_case but our form uses camelCase
      const taskDueDate = selectedTask.dueDate || (selectedTask as any).due_date;
      const hasDueDate = taskDueDate ? true : false;
      const dueDate = taskDueDate ? new Date(taskDueDate) : undefined;
      
      editForm.reset({
        userId: selectedTask.userId || (selectedTask as any).user_id,
        relatedOrderId: selectedTask.relatedOrderId || (selectedTask as any).related_order_id,
        title: selectedTask.title,
        description: selectedTask.description || "",
        dueDate: dueDate,
        completed: selectedTask.completed,
        priority: selectedTask.priority || "Normal",
        hasDueDate: hasDueDate,
      });
      
      // Force the hasDueDate field to be set correctly
      setTimeout(() => {
        editForm.setValue("hasDueDate", hasDueDate);
        if (dueDate) {
          editForm.setValue("dueDate", dueDate);
        }
      }, 0);
      
      console.log("Reset form with:", { 
        ...selectedTask, 
        hasDueDate,
        dueDate
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
          // Handle date conversion safely
          dueDate: data.dueDate 
            ? (typeof data.dueDate === 'string' 
                ? new Date(data.dueDate).toISOString() 
                : data.dueDate instanceof Date 
                  ? data.dueDate.toISOString() 
                  : null)
            : null,
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
  const handleEditTaskSubmit = async (data: any) => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    console.log("Edit Task Submit Button Clicked!");
    console.log("Form data:", data);
    console.log("Selected task:", selectedTask);
    
    try {
      // Convert form data to the format expected by the server
      const payload = {
        title: data.title,
        description: data.description || null,
        priority: data.priority || "Medium",
        // Handle date conversion properly
        due_date: data.hasDueDate && data.dueDate 
          ? (typeof data.dueDate === 'string' 
              ? new Date(data.dueDate).toISOString() 
              : data.dueDate instanceof Date 
                ? data.dueDate.toISOString() 
                : null)
          : null,
        completed: data.completed || false
      };
      
      console.log("Sending payload to server:", payload);
      console.log(`Updating task with ID: ${selectedTask.id}`);
      
      // Use fetch directly for more control
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      console.log("Server response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error response from server:", errorData);
        throw new Error(`Failed to update task: ${errorData || response.statusText}`);
      }
      
      // Try to parse the response as JSON if possible
      let result;
      try {
        // First try to parse the JSON directly
        const responseText = await response.text();
        console.log("Raw response:", responseText);
        
        if (responseText) {
          try {
            result = JSON.parse(responseText);
            console.log("Task updated successfully:", result);
          } catch (parseError) {
            console.log("Response was not valid JSON:", responseText);
          }
        }
      } catch (e) {
        console.log("Error handling response:", e);
      }
      
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1 text-sm font-normal h-9">
                  <span>{taskFilter}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTaskFilter("Open Tasks")}>
                  Open Tasks
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTaskFilter("High Priority")}>
                  High Priority
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTaskFilter("Medium Priority")}>
                  Medium Priority
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTaskFilter("Normal Priority")}>
                  Normal Priority
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setTaskFilter("Completed Tasks")}>
                  Completed Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                {tasks
                  .filter(task => {
                    switch (taskFilter) {
                      case 'Open Tasks':
                        return !task.completed;
                      case 'High Priority':
                        return task.priority?.toLowerCase() === 'high';
                      case 'Medium Priority':
                        return task.priority?.toLowerCase() === 'medium';
                      case 'Normal Priority':
                        return task.priority?.toLowerCase() === 'normal';
                      case 'Completed Tasks':
                        return task.completed;
                      default:
                        return true;
                    }
                  })
                  .map((task) => (
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
        <DialogContent className="sm:max-w-[425px]" aria-describedby="create-task-description">
          <DialogTitle className="sr-only">Create New Task</DialogTitle>
          <DialogDescription id="create-task-description" className="sr-only">
            Create a new task for your order management
          </DialogDescription>
          
          <button 
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100" 
            onClick={() => setIsNewTaskDialogOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
          
          <div className="flex flex-col items-center text-center mb-4">
            <div className="mb-2">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  {/* Notepad with checkmark */}
                  <rect x="8" y="6" width="30" height="35" rx="2" fill="#f5f5f5" />
                  <line x1="14" y1="16" x2="32" y2="16" stroke="#ddd" strokeWidth="2" />
                  <line x1="14" y1="22" x2="32" y2="22" stroke="#ddd" strokeWidth="2" />
                  <line x1="14" y1="28" x2="32" y2="28" stroke="#ddd" strokeWidth="2" />
                  <path d="M20 16L22 18L27 13" stroke="#ffa500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                  {/* Orange pencil */}
                  <path d="M35 12L16 31L14 37L20 35L39 16L35 12Z" fill="#FFA066" />
                  <path d="M35 12L39 16L42 13L38 9L35 12Z" fill="#FF7F3F" />
                  <path d="M14 37L16 31L20 35L14 37Z" fill="#FFD2B3" />
                  
                  {/* Blue plus button */}
                  <circle cx="42" cy="38" r="10" fill="#2563EB" />
                  <path d="M42 33V43M37 38H47" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-1">Add Task</h2>
            <p className="text-gray-500 text-sm">
              Add tasks to help keep organised<br/>and on top of all your orders
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNewTaskSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter Task Description" 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Priority</h3>
                <div className="flex space-x-2">
                  {/* Use watch to ensure the buttons update when priority changes */}
                  {(() => {
                    const currentPriority = form.watch("priority");
                    return (
                      <>
                        <Button 
                          type="button"
                          variant={currentPriority === "None" ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${currentPriority === "None" ? "bg-gray-300 hover:bg-gray-400" : ""}`}
                          onClick={() => form.setValue("priority", "None")}
                        >
                          None
                        </Button>
                        <Button 
                          type="button"
                          variant={currentPriority === "Normal" ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${currentPriority === "Normal" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                          onClick={() => form.setValue("priority", "Normal")}
                        >
                          Normal
                        </Button>
                        <Button 
                          type="button"
                          variant={currentPriority === "Medium" ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${currentPriority === "Medium" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                          onClick={() => form.setValue("priority", "Medium")}
                        >
                          Medium
                        </Button>
                        <Button 
                          type="button"
                          variant={currentPriority === "High" ? "default" : "outline"}
                          size="sm" 
                          className={`flex-1 ${currentPriority === "High" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                          onClick={() => form.setValue("priority", "High")}
                        >
                          High
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={!!field.value}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange(new Date());
                          } else {
                            field.onChange(undefined);
                          }
                        }}
                        id="add-due-date-checkbox"
                      />
                    </FormControl>
                    <label 
                      htmlFor="add-due-date-checkbox" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Add a due date
                    </label>
                  </FormItem>
                )}
              />
              
              {form.watch("dueDate") && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Date</h3>
                    <div className="relative">
                      <Input
                        type="text"
                        value={form.getValues("dueDate") ? formatDate(form.getValues("dueDate") as Date) : ""}
                        readOnly
                        className="pr-10"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={form.getValues("dueDate") as Date}
                            onSelect={(date) => form.setValue("dueDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Time</h3>
                    <div className="grid grid-cols-3 gap-1">
                      <Select defaultValue="1">
                        <SelectTrigger>
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="00">
                        <SelectTrigger>
                          <SelectValue placeholder="00" />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map((min) => (
                            <SelectItem key={min} value={min}>
                              {min}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="AM">
                        <SelectTrigger>
                          <SelectValue placeholder="AM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewTaskDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isSubmitting ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="edit-task-description">
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
          <DialogDescription id="edit-task-description" className="sr-only">
            Edit your task details
          </DialogDescription>
          
          <button 
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100" 
            onClick={() => setIsEditTaskDialogOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </button>
          
          <div className="flex flex-col items-center text-center mb-4">
            <div className="mb-2">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g>
                  {/* Notepad with checkmark */}
                  <rect x="8" y="6" width="30" height="35" rx="2" fill="#f5f5f5" />
                  <line x1="14" y1="16" x2="32" y2="16" stroke="#ddd" strokeWidth="2" />
                  <line x1="14" y1="22" x2="32" y2="22" stroke="#ddd" strokeWidth="2" />
                  <line x1="14" y1="28" x2="32" y2="28" stroke="#ddd" strokeWidth="2" />
                  <path d="M20 16L22 18L27 13" stroke="#ffa500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                
                  {/* Orange pencil */}
                  <path d="M35 12L16 31L14 37L20 35L39 16L35 12Z" fill="#FFA066" />
                  <path d="M35 12L39 16L42 13L38 9L35 12Z" fill="#FF7F3F" />
                  <path d="M14 37L16 31L20 35L14 37Z" fill="#FFD2B3" />
                  
                  {/* Blue plus button */}
                  <circle cx="42" cy="38" r="10" fill="#2563EB" />
                  <path d="M42 33V43M37 38H47" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-1">Edit Task</h2>
            <p className="text-gray-500 text-sm">
              Add tasks to help keep organised<br/>and on top of all your orders
            </p>
          </div>
          
          <Form {...editForm}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Form submitted!");
                editForm.handleSubmit(handleEditTaskSubmit)(e);
              }} 
              className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter Task Description" 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Priority</h3>
                <div className="flex space-x-2">
                  {/* Use an IIFE to ensure the buttons update when priority changes */}
                  {(() => {
                    const currentPriority = editForm.watch("priority");
                    return (
                      <>
                        <Button 
                          type="button"
                          variant={currentPriority === "None" ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${currentPriority === "None" ? "bg-gray-300 hover:bg-gray-400" : ""}`}
                          onClick={() => editForm.setValue("priority", "None", { shouldDirty: true })}
                        >
                          None
                        </Button>
                        <Button 
                          type="button"
                          variant={currentPriority === "Normal" ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${currentPriority === "Normal" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                          onClick={() => editForm.setValue("priority", "Normal", { shouldDirty: true })}
                        >
                          Normal
                        </Button>
                        <Button 
                          type="button"
                          variant={currentPriority === "Medium" ? "default" : "outline"}
                          size="sm"
                          className={`flex-1 ${currentPriority === "Medium" ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                          onClick={() => editForm.setValue("priority", "Medium", { shouldDirty: true })}
                        >
                          Medium
                        </Button>
                        <Button 
                          type="button"
                          variant={currentPriority === "High" ? "default" : "outline"}
                          size="sm" 
                          className={`flex-1 ${currentPriority === "High" ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
                          onClick={() => editForm.setValue("priority", "High", { shouldDirty: true })}
                        >
                          High
                        </Button>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <FormField
                control={editForm.control}
                name="hasDueDate"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value || editForm.watch("dueDate") !== undefined}
                        onCheckedChange={(value) => {
                          field.onChange(value);
                          if (!value) {
                            editForm.setValue("dueDate", undefined);
                          } else if (!editForm.getValues("dueDate")) {
                            // Set default due date to tomorrow if none exists
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            editForm.setValue("dueDate", tomorrow);
                          }
                        }}
                        id="due-date-checkbox-edit"
                      />
                    </FormControl>
                    <label 
                      htmlFor="due-date-checkbox-edit" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Add a due date
                    </label>
                  </FormItem>
                )}
              />
              
              {editForm.watch("hasDueDate") && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Date</h3>
                    <FormField
                      control={editForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal flex justify-between",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? formatDate(field.value) : "Select date"}
                                  <CalendarIcon className="h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => field.onChange(date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium">Time</h3>
                    <div className="grid grid-cols-3 gap-1">
                      <Select defaultValue="1">
                        <SelectTrigger>
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (
                            <SelectItem key={i} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="00">
                        <SelectTrigger>
                          <SelectValue placeholder="00" />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "15", "30", "45"].map((min) => (
                            <SelectItem key={min} value={min}>
                              {min}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select defaultValue="AM">
                        <SelectTrigger>
                          <SelectValue placeholder="AM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditTaskDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  disabled={isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={() => {
                    console.log("Update button clicked directly");
                    const data = editForm.getValues();
                    handleEditTaskSubmit(data);
                  }}
                >
                  {isSubmitting ? "Updating..." : "Update Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskList;