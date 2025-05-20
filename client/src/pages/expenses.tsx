import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Expense, Income } from "@shared/schema";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExpenseSchema, insertIncomeSchema } from "@shared/schema";
import { cn, formatDate } from "@/lib/utils";
import { FormatCurrency } from "@/components/ui/format-currency";
import {
  PlusIcon,
  CalendarIcon,
  DollarSignIcon,
  ReceiptIcon,
  PieChartIcon,
  FileTextIcon,
  TrendingUpIcon,
  ChevronDownIcon,
  UploadIcon,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Extended schema with validation rules for expense
const expenseFormSchema = insertExpenseSchema.extend({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.date(),
  description: z.string().optional(),
});

// Extended schema with validation rules for income
const incomeFormSchema = insertIncomeSchema.extend({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  date: z.date(),
  description: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
type IncomeFormValues = z.infer<typeof incomeFormSchema>;

// Sample expense categories
const expenseCategories = [
  "Ingredients",
  "Packaging",
  "Rent",
  "Utilities",
  "Equipment",
  "Marketing",
  "Transportation",
  "Insurance",
  "Taxes",
  "Other",
];

// Sample income categories
const incomeCategories = [
  "Cake Sales",
  "Cupcake Sales",
  "Cookie Sales",
  "Workshop Fees",
  "Delivery Fees",
  "Consultation",
  "Other",
];

const Expenses = () => {
  const { toast } = useToast();
  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = React.useState(false);
  const [isNewIncomeDialogOpen, setIsNewIncomeDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("expenses");
  const [month, setMonth] = React.useState(new Date().getMonth() + 1);
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", { month, year }],
  });

  // Fetch income
  const { data: incomes = [], isLoading: isLoadingIncomes } = useQuery<Income[]>({
    queryKey: ["/api/income", { month, year }],
  });

  // Expense form
  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      category: "",
      amount: 0,
      date: new Date(),
      description: "",
      taxDeductible: false,
    },
  });

  // Income form
  const incomeForm = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      category: "",
      amount: 0,
      date: new Date(),
      description: "",
    },
  });

  // Handle new expense submission
  const handleNewExpenseSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/expenses", data);
      
      // Invalidate expenses query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      
      // Reset form and close dialog
      expenseForm.reset();
      setIsNewExpenseDialogOpen(false);
      
      toast({
        title: "Expense Added",
        description: `Expense of $${data.amount.toFixed(2)} has been recorded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error adding the expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new income submission
  const handleNewIncomeSubmit = async (data: IncomeFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/income", data);
      
      // Invalidate income query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      
      // Reset form and close dialog
      incomeForm.reset();
      setIsNewIncomeDialogOpen(false);
      
      toast({
        title: "Income Added",
        description: `Income of $${data.amount.toFixed(2)} has been recorded.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error adding the income. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expense columns for data table
  const expenseColumns: ColumnDef<Expense>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        return formatDate(new Date(date));
      },
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return `$${Number(amount).toFixed(2)}`;
      },
    },
    {
      accessorKey: "taxDeductible",
      header: "Tax Deductible",
      cell: ({ row }) => {
        const taxDeductible = row.getValue("taxDeductible") as boolean;
        return taxDeductible ? "Yes" : "No";
      },
    },
  ];

  // Income columns for data table
  const incomeColumns: ColumnDef<Income>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        return formatDate(new Date(date));
      },
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return `$${Number(amount).toFixed(2)}`;
      },
    },
  ];

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const totalIncome = incomes.reduce((sum, income) => sum + Number(income.amount), 0);
  const profit = totalIncome - totalExpenses;

  // Generate month options
  const monthOptions = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Generate year options (5 years back, 5 years ahead)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="p-6">
      <PageHeader
        title="Business & Expenses"
        actions={
          <div className="flex space-x-2">
            {activeTab === "expenses" ? (
              <Button onClick={() => setIsNewExpenseDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" /> New Expense
              </Button>
            ) : (
              <Button onClick={() => setIsNewIncomeDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" /> New Income
              </Button>
            )}
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              For {monthOptions.find(m => m.value === month)?.label} {year}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              For {monthOptions.find(m => m.value === month)?.label} {year}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${profit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              For {monthOptions.find(m => m.value === month)?.label} {year}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-4 mt-6 mb-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Period:</span>
          <Select
            value={month.toString()}
            onValueChange={(value) => setMonth(parseInt(value))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={year.toString()}
            onValueChange={(value) => setYear(parseInt(value))}
            className="ml-2"
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="expenses"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">
            <ReceiptIcon className="h-4 w-4 mr-2" /> Expenses
          </TabsTrigger>
          <TabsTrigger value="income">
            <TrendingUpIcon className="h-4 w-4 mr-2" /> Income
          </TabsTrigger>
        </TabsList>
        
        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>Expenses</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Download Report",
                      description: "Expense report download will be implemented soon.",
                    });
                  }}
                >
                  <FileTextIcon className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={expenseColumns}
                data={expenses}
                isLoading={isLoadingExpenses}
                searchPlaceholder="Search expenses..."
                searchKey="description"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Income Tab */}
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>Income</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Download Report",
                      description: "Income report download will be implemented soon.",
                    });
                  }}
                >
                  <FileTextIcon className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={incomeColumns}
                data={incomes}
                isLoading={isLoadingIncomes}
                searchPlaceholder="Search income..."
                searchKey="description"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Expense Dialog */}
      <Dialog open={isNewExpenseDialogOpen} onOpenChange={setIsNewExpenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <Form {...expenseForm}>
            <form onSubmit={expenseForm.handleSubmit(handleNewExpenseSubmit)} className="space-y-4">
              <FormField
                control={expenseForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                control={expenseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter expense details..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={expenseForm.control}
                name="taxDeductible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Tax Deductible</FormLabel>
                      <p className="text-sm text-gray-500">
                        Mark this expense as tax deductible for your business
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      toast({
                        title: "Receipt Upload",
                        description: "Receipt upload functionality will be implemented soon.",
                      });
                    }}
                  >
                    <UploadIcon className="h-4 w-4 mr-2" /> Upload Receipt
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewExpenseDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Income Dialog */}
      <Dialog open={isNewIncomeDialogOpen} onOpenChange={setIsNewIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <Form {...incomeForm}>
            <form onSubmit={incomeForm.handleSubmit(handleNewIncomeSubmit)} className="space-y-4">
              <FormField
                control={incomeForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
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
                control={incomeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter income details..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewIncomeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Income"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
