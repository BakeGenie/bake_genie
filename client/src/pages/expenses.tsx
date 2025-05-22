import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronLeft, 
  Plus 
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "wouter";

// Define the expense type
type Expense = {
  id: number;
  userId: number;
  category: string;
  amount: string;
  date: string;
  description: string | null;
  taxDeductible: boolean;
  receiptUrl: string | null;
  createdAt: string;
  supplier?: string | null;
  paymentSource?: string | null;
  vat?: string | null;
  totalIncTax?: string | null;
  isRecurring?: boolean;
};

// Define expense categories
const expenseCategories = [
  "Advertising",
  "Board",
  "Box",
  "Courses",
  "Electronic Devices", 
  "Ingredients",
  "Insurance",
  "Internet",
  "Landline Cost",
  "Magazines",
  "Meals",
  "Memberships",
  "Mobile",
  "Other",
  "Postage",
  "Printing",
  "Refunds",
  "Rent",
  "Salary",
  "Stationery",
  "Supplies",
  "Tickets",
  "Travel",
  "Vehicle",
  "Website"
];

// Define payment sources
const paymentSources = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "PayPal",
  "Other",
];

// Define expense schema
const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  description: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  paymentSource: z.string().default("Cash"),
  vat: z.string().optional().default("0.00"),
  totalIncTax: z.string().optional().default("0.00"),
  taxDeductible: z.boolean().optional().default(false),
  isRecurring: z.boolean().default(false),
  receiptUrl: z.string().optional().nullable(),
});

const ExpensesPage = () => {
  const { toast } = useToast();
  // Current date for default value
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, 'MMM'));
  const [selectedYear, setSelectedYear] = useState(format(currentDate, 'yyyy'));
  const [searchTerm, setSearchTerm] = useState("");
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Expense form
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "Advertising",
      amount: "",
      date: currentDate,
      description: "",
      supplier: "",
      paymentSource: "Cash",
      vat: "0.00",
      totalIncTax: "0.00",
      taxDeductible: false,
      isRecurring: false,
      receiptUrl: null,
    },
  });

  // Query for expenses with optional filtering
  const {
    data: expenses = [],
    isLoading: expensesLoading,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      try {
        console.log("Fetching expenses from:", "/api/expenses");
        const response = await fetch("/api/expenses");
        
        if (!response.ok) {
          throw new Error(`Error fetching expenses: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching expenses:", error);
        throw error;
      }
    },
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseSchema>) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: data.category,
          amount: data.amount,
          date: data.date,
          description: data.description,
          supplier: data.supplier,
          paymentSource: data.paymentSource,
          vat: data.vat,
          totalIncTax: data.totalIncTax,
          taxDeductible: data.taxDeductible,
          isRecurring: data.isRecurring
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense added",
        description: "Your expense has been successfully recorded.",
      });
      setOpenExpenseDialog(false);
      setEditingExpenseId(null);
      expenseForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof expenseSchema> & { id: number }) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update expense");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense updated",
        description: "Your expense has been successfully updated.",
      });
      setOpenExpenseDialog(false);
      setEditingExpenseId(null);
      expenseForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Expense deleted",
        description: "The expense has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to handle expense submission
  const onSubmitExpense = (data: z.infer<typeof expenseSchema>) => {
    if (editingExpenseId) {
      updateExpenseMutation.mutate({ ...data, id: editingExpenseId });
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  // Helper function to group expenses by date
  const groupExpensesByDate = (expenses: Expense[] = []) => {
    const grouped: Record<string, Expense[]> = {};
    
    expenses.forEach(expense => {
      const dateKey = format(new Date(expense.date), 'dd MMM yyyy');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    });
    
    return grouped;
  };
  
  // Get expenses for the selected month/year
  const filterExpensesByMonthYear = (expenses: Expense[] = []) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return (
        format(expenseDate, 'MMM') === selectedMonth && 
        format(expenseDate, 'yyyy') === selectedYear
      );
    });
  };

  // Filter by search term
  const filterBySearchTerm = (expenses: Expense[] = []) => {
    if (!searchTerm) return expenses;
    
    return expenses.filter(expense => 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.supplier && expense.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Filter by category
  const filterByCategory = (expenses: Expense[] = []) => {
    if (!categoryFilter || categoryFilter === "all") return expenses;
    
    return expenses.filter(expense => 
      expense.category === categoryFilter
    );
  };
  
  const filteredExpenses = filterByCategory(filterBySearchTerm(expenses));
  const filteredExpensesByDate = filterExpensesByMonthYear(filteredExpenses);
  const groupedExpenses = groupExpensesByDate(filteredExpensesByDate);
  
  // Calculate total for all expenses in the current month/year
  const calculateMonthlyTotal = () => {
    return filteredExpensesByDate
      .reduce((total, expense) => total + parseFloat(expense.amount), 0)
      .toFixed(2);
  };

  return (
    <div className="container mx-auto p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/business-expenses">
            <button className="p-2 rounded-md hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-xl font-medium">Expenses</h1>
        </div>
        <Button onClick={() => setOpenExpenseDialog(true)} className="bg-green-500 hover:bg-green-600">
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Main content with Clean Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl mx-auto">
        {/* Expense Period Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Expense Period:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['2024', '2025', '2026'].map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select 
            value={categoryFilter || "all"} 
            onValueChange={(value) => setCategoryFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Expenses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expenses</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Monthly Header */}
        <div className="mb-4">
          <h2 className="font-medium">{selectedMonth} {selectedYear}</h2>
        </div>

        {/* Expense List */}
        {expensesLoading ? (
          <div className="text-center py-8">Loading expenses...</div>
        ) : Object.keys(groupedExpenses).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No expenses found for {selectedMonth} {selectedYear}</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
              <div key={date} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="font-medium">{date}</span>
                    <span className="ml-2 text-sm text-gray-500">{dateExpenses.length} {dateExpenses.length === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>
                
                {dateExpenses.map((expense) => (
                  <div 
                    key={expense.id} 
                    className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                    onClick={() => {
                      // Open edit modal when row is clicked
                      expenseForm.reset({
                        ...expense,
                        date: new Date(expense.date)
                      });
                      setEditingExpenseId(expense.id);
                      setOpenExpenseDialog(true);
                    }}
                  >
                    {/* Date (already shown in the group header, but we could show time here) */}
                    <div className="w-1/6 flex items-center">
                      <div className="bg-gray-100 text-blue-500 font-medium px-2 py-1 rounded">
                        {expense.id} ({expense.id})
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="w-1/4 truncate">
                      {expense.description || "No description"}
                    </div>
                    
                    {/* Category */}
                    <div className="w-1/5">
                      {expense.category}
                    </div>
                    
                    {/* Amount */}
                    <div className="w-1/6 text-right font-medium">
                      $ {parseFloat(expense.amount).toFixed(2)}
                    </div>
                    
                    {/* Delete button - stop propagation to prevent opening edit modal */}
                    <div className="w-1/12 flex justify-end">
                      <button 
                        className="text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click
                          if (window.confirm("Are you sure you want to delete this expense?")) {
                            deleteExpenseMutation.mutate(expense.id);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            
            {/* Total */}
            <div className="flex justify-end border-t pt-4 mt-4">
              <div className="text-right">
                <span className="font-medium">Totals: $ {calculateMonthlyTotal()}</span>
              </div>
            </div>
          </>
        )}
        
        {/* Branding */}
        <div className="flex justify-center items-center mt-8 text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>BakeDiary</span>
        </div>
      </div>

      {/* Expense Dialog */}
      <Dialog 
        open={openExpenseDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setEditingExpenseId(null);
            expenseForm.reset();
          }
          setOpenExpenseDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-xl">
              {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
            </DialogTitle>
            <button 
              onClick={() => {
                setOpenExpenseDialog(false);
                setEditingExpenseId(null);
                expenseForm.reset();
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>
          <Form {...expenseForm}>
            <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-4">
              <FormField
                control={expenseForm.control}
                name="paymentSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">Payment Source</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "Cash"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentSources.map(source => (
                          <SelectItem key={source} value={source}>{source}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">Expense Date</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type="text"
                          value={field.value ? format(field.value, "EEE, dd MMM yyyy") : ""}
                          onClick={() => document.getElementById("expense-calendar-toggle")?.click()}
                          readOnly
                          className="pr-10"
                        />
                      </FormControl>
                      <button 
                        type="button" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => document.getElementById("expense-calendar-toggle")?.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </button>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="expense-calendar-toggle" type="button" variant="outline" className="hidden">
                          Open
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
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
                control={expenseForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || expenseCategories[0]}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter description"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">Supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter supplier name"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name="vat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">VAT (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={expenseForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-normal text-gray-500">Total Inc. Tax</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel className="text-sm font-normal text-gray-500">Attach Receipt</FormLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Choose file to upload"
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    className="whitespace-nowrap bg-blue-500 text-white hover:bg-blue-600 px-3"
                  >
                    Choose File
                  </Button>
                </div>
                <p className="text-xs text-gray-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Attachments larger than 3mb may take longer to upload when saving an expense.
                </p>
              </div>
              
              <FormField
                control={expenseForm.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm font-normal cursor-pointer">Add as a recurring expense</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between pt-2 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenExpenseDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {createExpenseMutation.isPending ? "Saving..." : "Add Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;