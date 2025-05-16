import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useTasks() {
  // Fetch all tasks
  const { data: tasks = [], isLoading, isError, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Create a new task
  const { mutate: createTask, isPending: isCreating } = useMutation({
    mutationFn: async (task: Omit<Task, "id" | "createdAt">) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Update a task
  const { mutate: updateTask, isPending: isUpdating } = useMutation({
    mutationFn: async (task: Partial<Task> & { id: number }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${task.id}`, task);
      return response as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Delete a task
  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Toggle task completion
  const { mutate: toggleTask, isPending: isToggling } = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, { completed });
      return response as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  return {
    tasks,
    isLoading,
    isError,
    error,
    createTask,
    isCreating,
    updateTask,
    isUpdating,
    deleteTask,
    isDeleting,
    toggleTask,
    isToggling,
    // Task filtering helpers
    getTasks: (filter?: {
      completed?: boolean;
      priority?: "low" | "medium" | "high";
      dueDate?: Date;
    }) => {
      if (!filter) return tasks;

      return tasks.filter((task) => {
        let match = true;
        
        if (filter.completed !== undefined) {
          match = match && task.completed === filter.completed;
        }
        
        if (filter.priority) {
          match = match && task.priority === filter.priority;
        }
        
        if (filter.dueDate) {
          const taskDate = new Date(task.dueDate);
          const filterDate = new Date(filter.dueDate);
          match =
            match &&
            taskDate.getFullYear() === filterDate.getFullYear() &&
            taskDate.getMonth() === filterDate.getMonth() &&
            taskDate.getDate() === filterDate.getDate();
        }
        
        return match;
      });
    },
    // Get overdue tasks (due date is in the past and not completed)
    getOverdueTasks: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return tasks.filter((task) => {
        if (task.completed) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });
    },
    // Get today's tasks
    getTodayTasks: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return tasks.filter((task) => {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return (
          dueDate.getFullYear() === today.getFullYear() &&
          dueDate.getMonth() === today.getMonth() &&
          dueDate.getDate() === today.getDate()
        );
      });
    },
    // Get upcoming tasks (due in the next week)
    getUpcomingTasks: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      return tasks.filter((task) => {
        if (task.completed) return false;
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= today && dueDate <= nextWeek;
      });
    },
  };
}