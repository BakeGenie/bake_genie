import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "wouter";

// Define the expense and income types
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
};

type Income = {
  id: number;
  userId: number;
  category: string;
  amount: string;
  date: string;
  description: string | null;
  createdAt: string;
};

// Define expense categories
const expenseCategories = [
  "Ingredients",
  "Supplies",
  "Packaging",
  "Equipment",
  "Rent",
  "Utilities",
  "Marketing",
  "Shipping",
  "Insurance",
  "Office",
  "Travel",
  "Professional Services",
  "Salaries",
  "Other",
];

// Define income categories
const incomeCategories = [
  "Sales",
  "Custom Orders",
  "Classes",
  "Consulting",
  "Affiliate",
  "Events",
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

// Define income schema
const incomeSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  description: z.string().optional().nullable(),
});

const ExpensesPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("expenses");
  // Current date for default value
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(format(currentDate, 'MMM'));
  const [selectedYear, setSelectedYear] = useState(format(currentDate, 'yyyy'));
  const [searchTerm, setSearchTerm] = useState("");
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [openIncomeDialog, setOpenIncomeDialog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Query for expenses with optional filtering
  const {
    data: expenses,
    isLoading: expensesLoading,
    error: expensesError,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["/api/expenses"],
    queryFn: async () => {
      try {
        let url = "/api/expenses";
        const params = new URLSearchParams();
        
        if (dateRange.from) {
          params.append("startDate", dateRange.from.toISOString().split("T")[0]);
        }
        
        if (dateRange.to) {
          params.append("endDate", dateRange.to.toISOString().split("T")[0]);
        }
        
        if (categoryFilter) {
          params.append("category", categoryFilter);
        }
        
        if (params.toString()) {
          url += "?" + params.toString();
        }
        
        console.log("Fetching expenses from:", url);
        const response = await fetch(url);
        
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

  // Query for income with optional filtering
  const {
    data: income,
    isLoading: incomeLoading,
    error: incomeError,
    refetch: refetchIncome,
  } = useQuery({
    queryKey: ["/api/income"],
    queryFn: async () => {
      try {
        let url = "/api/income";
        const params = new URLSearchParams();
        
        if (dateRange.from) {
          params.append("startDate", dateRange.from.toISOString().split("T")[0]);
        }
        
        if (dateRange.to) {
          params.append("endDate", dateRange.to.toISOString().split("T")[0]);
        }
        
        if (categoryFilter) {
          params.append("category", categoryFilter);
        }
        
        if (params.toString()) {
          url += "?" + params.toString();
        }
        
        console.log("Fetching income from:", url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Error fetching income: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching income:", error);
        throw error;
      }
    },
  });

  // Expense form
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
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

  // Income form
  const incomeForm = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      category: "",
      amount: "",
      date: currentDate,
      description: "",
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
          taxDeductible: data.taxDeductible
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

  // Create income mutation
  const createIncomeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof incomeSchema>) => {
      const response = await fetch("/api/income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: data.category,
          amount: data.amount,
          date: data.date,
          description: data.description
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add income");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Income added",
        description: "Your income has been successfully recorded.",
      });
      setOpenIncomeDialog(false);
      incomeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add income. Please try again.",
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

  // Delete income mutation
  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/income/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete income");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Income deleted",
        description: "The income entry has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete income. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate totals
  const calculateTotals = () => {
    if (activeTab === "expenses" && expenses) {
      return expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0).toFixed(2);
    }
    if (activeTab === "income" && income) {
      return income.reduce((total, incomeItem) => total + parseFloat(incomeItem.amount), 0).toFixed(2);
    }
    return "0.00";
  };

  // Function to handle expense submission
  const onSubmitExpense = (data: z.infer<typeof expenseSchema>) => {
    createExpenseMutation.mutate(data);
  };

  // Function to handle income submission
  const onSubmitIncome = (data: z.infer<typeof incomeSchema>) => {
    createIncomeMutation.mutate(data);
  };

  // Filter data based on search term
  const filteredExpenses = expenses?.filter(expense => 
    expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredIncome = income?.filter(incomeItem => 
    incomeItem.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incomeItem.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ from: undefined, to: undefined });
    setSearchTerm("");
    setCategoryFilter(null);
    refetchExpenses();
    refetchIncome();
  };

  return (
    <div className="container mx-auto p-4 mb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports & Expenses</h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpenExpenseDialog(true)} className="bg-primary">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          <Button onClick={() => setOpenIncomeDialog(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Add Income
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter your financial records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Date Range</h3>
              <div className="flex gap-2">
                <Calendar
                  mode="range"
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange(range || { from: undefined, to: undefined });
                    refetchExpenses();
                    refetchIncome();
                  }}
                  className="border rounded-md p-2"
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Search</h3>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by description or category"
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Category</h3>
              <Select
                value={categoryFilter || ""}
                onValueChange={(value) => {
                  setCategoryFilter(value === "" ? null : value);
                  refetchExpenses();
                  refetchIncome();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">All Categories</SelectItem>
                  {activeTab === "expenses"
                    ? expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    : incomeCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Badge variant="outline" className="text-lg">
              Total: ${calculateTotals()}
            </Badge>
          </div>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </CardFooter>
      </Card>

      {/* Tabs for Expenses and Income */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Manage your business expenses</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="flex justify-center p-6">Loading expenses...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">No expenses found</p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => setOpenExpenseDialog(true)}
                  >
                    Add your first expense
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Tax Deductible</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {format(new Date(expense.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{expense.category}</Badge>
                          </TableCell>
                          <TableCell>{expense.description || "-"}</TableCell>
                          <TableCell>${parseFloat(expense.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            {expense.taxDeductible ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this expense?"
                                  )
                                ) {
                                  deleteExpenseMutation.mutate(expense.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Income</CardTitle>
              <CardDescription>Manage your business income</CardDescription>
            </CardHeader>
            <CardContent>
              {incomeLoading ? (
                <div className="flex justify-center p-6">Loading income...</div>
              ) : filteredIncome.length === 0 ? (
                <div className="text-center p-6">
                  <p className="text-muted-foreground">No income entries found</p>
                  <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => setOpenIncomeDialog(true)}
                  >
                    Add your first income
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncome.map((incomeItem) => (
                        <TableRow key={incomeItem.id}>
                          <TableCell>
                            {format(new Date(incomeItem.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{incomeItem.category}</Badge>
                          </TableCell>
                          <TableCell>{incomeItem.description || "-"}</TableCell>
                          <TableCell>${parseFloat(incomeItem.amount).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this income entry?"
                                  )
                                ) {
                                  deleteIncomeMutation.mutate(incomeItem.id);
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reports Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/reports/income-statement">
            <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle>Income Statement</CardTitle>
                <CardDescription>View your profit and loss statement</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A summary of your revenue, expenses, and profit over a specified period.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/reports/detailed-expense">
            <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle>Detailed Expense Report</CardTitle>
                <CardDescription>Breakdown of all business expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  A detailed analysis of your expenses by category and date.
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/reports/business-performance">
            <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle>Business Performance</CardTitle>
                <CardDescription>Track your overall business growth</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualize your business performance with charts and trends.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Expense Dialog */}
      <Dialog open={openExpenseDialog} onOpenChange={setOpenExpenseDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-xl">Add Expense</DialogTitle>
            <button 
              onClick={() => setOpenExpenseDialog(false)}
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
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="PayPal">PayPal</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
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

      {/* Income Dialog */}
      <Dialog open={openIncomeDialog} onOpenChange={setOpenIncomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Income</DialogTitle>
            <DialogDescription>
              Record a new income entry. Fill out the details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...incomeForm}>
            <form onSubmit={incomeForm.handleSubmit(onSubmitIncome)} className="space-y-4">
              <FormField
                control={incomeForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || incomeCategories[0]}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incomeCategories.map((category) => (
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
                control={incomeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                control={incomeForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      className="rounded-md border"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={incomeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter a description" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenIncomeDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createIncomeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createIncomeMutation.isPending ? "Saving..." : "Save Income"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;