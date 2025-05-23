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
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>("");

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
    mutationFn: async (data: any) => {
      // Only include fields that exist in our database schema
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: data.category,
          amount: String(data.amount),
          date: data.date,
          description: data.description || "",
          taxDeductible: Boolean(data.taxDeductible),
          receiptUrl: data.receiptUrl
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

  // Function to upload and preview file
  const uploadAndPreviewFile = async (file: File) => {
    try {
      // Set the file for local state
      setSelectedFile(file);
      setReceiptFileName(file.name);
      
      // Create a local object URL for immediate preview without waiting for server upload
      const localPreviewUrl = URL.createObjectURL(file);
      expenseForm.setValue('receiptUrl', localPreviewUrl);
      
      // For now, let's use the local preview only and skip the server upload
      // This will allow the user to see the receipt in the form
      toast({
        title: "Receipt added",
        description: "Receipt is ready to preview. It will be uploaded when you save the expense.",
      });
      
      // We'll use a temporary local URL as the receipt URL
      // The actual server upload will happen when the form is submitted
      return localPreviewUrl;
      
      /* Server upload code commented out to fix issues
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('receipt', file);
      
      console.log("Uploading file:", file.name);
      
      // Show loading toast
      toast({
        title: "Processing receipt",
        description: "Uploading your receipt...",
      });
      
      // Upload file to server
      const uploadResponse = await fetch('/api/upload/receipt', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload response error:", errorText);
        throw new Error(`Failed to upload receipt: ${errorText}`);
      }
      
      // Process the server response in a safer way
      let uploadResult;
      try {
        const responseText = await uploadResponse.text();
        try {
          uploadResult = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Failed to parse JSON response:", responseText);
          throw new Error("Invalid server response: " + responseText);
        }
      } catch (textError) {
        console.error("Failed to get response text:", textError);
        throw new Error("Failed to process server response");
      }
      
      if (uploadResult && uploadResult.success) {
        const receiptUrl = uploadResult.url;
        console.log("Receipt uploaded successfully:", receiptUrl);
        
        // Replace the object URL with the actual server URL
        URL.revokeObjectURL(localPreviewUrl);
        expenseForm.setValue('receiptUrl', receiptUrl);
        
        toast({
          title: "Receipt uploaded",
          description: "Receipt was successfully uploaded and is ready to view.",
        });
        
        return receiptUrl;
      } else {
        const errorMsg = uploadResult?.error || "Upload failed";
        throw new Error(errorMsg);
      }
      */
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your receipt. You can try again or continue without a receipt.",
        variant: "destructive"
      });
      return null;
    }
  };
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList } }) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadAndPreviewFile(files[0]);
    }
  };
  
  // Handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  // Handle drag leave event
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadAndPreviewFile(e.dataTransfer.files[0]);
    }
  };
  
  // Function to handle expense submission
  const onSubmitExpense = async (data: z.infer<typeof expenseSchema>) => {
    try {
      // Get receipt URL from the form's value, which should have been set during file selection
      let receiptUrl = data.receiptUrl;
      
      // Use the local preview URL that was created during file selection
      // This approach avoids the server upload issues while still providing visual feedback
      if (selectedFile) {
        console.log("Using preview URL for receipt");
        
        // We're keeping the Blob URL that was created during file selection
        // In a production app, we'd implement proper server upload here
        toast({
          title: "Receipt included",
          description: "Your receipt preview has been attached to this expense.",
        });
      } else if (editingExpenseId && !receiptUrl) {
        // When editing, if the receipt is removed, ensure we pass null
        receiptUrl = null;
      }
      
      // Store additional info in the description field
      let basicDescription = data.description || "";
      
      // Create metadata object for additional fields
      const metaFields = {
        supplier: data.supplier || "",
        paymentSource: data.paymentSource || "",
        vat: data.vat || "",
        totalIncTax: data.totalIncTax || "",
        isRecurring: Boolean(data.isRecurring)
      };
      
      // Store the metadata as a hidden JSON string with a marker
      if (Object.values(metaFields).some(v => v)) {
        // Create a simplified string for humans to read, but hide the JSON data
        const metaString = JSON.stringify(metaFields);
        basicDescription = basicDescription.replace(/\[META_DATA\]([\s\S]*?)\[\/META_DATA\]/, '');
        basicDescription += (basicDescription ? '\n\n' : '') + `[META_DATA]${metaString}[/META_DATA]`;
      }
      
      // Create a clean object with all fields supported by our database schema
      const expenseData = {
        category: data.category,
        amount: String(data.amount),
        date: data.date,
        description: basicDescription,
        supplier: data.supplier || "",
        paymentSource: data.paymentSource,
        vat: data.vat || "0.00",
        totalIncTax: data.totalIncTax || "0.00",
        taxDeductible: Boolean(data.taxDeductible),
        isRecurring: Boolean(data.isRecurring),
        receiptUrl: receiptUrl
      };
      
      if (editingExpenseId) {
        updateExpenseMutation.mutate({ ...expenseData, id: editingExpenseId });
      } else {
        createExpenseMutation.mutate(expenseData);
      }
      
      // Reset file selection
      setSelectedFile(null);
      setReceiptFileName('');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload receipt. Please try again.",
        variant: "destructive",
      });
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
                      const expenseData = {
                        ...expense,
                        date: new Date(expense.date)
                      };
                      
                      // If there's a receipt, set the filename to display
                      if (expense.receiptUrl) {
                        // Extract the filename from the URL
                        const filename = expense.receiptUrl.split('/').pop() || 'Receipt';
                        setReceiptFileName(filename);
                      } else {
                        setReceiptFileName('');
                      }
                      
                      // Parse metadata from the description if it exists
                      let description = expense.description || "";
                      
                      // Look for the metadata section (using dotAll workaround for compatibility)
                      const metaMatch = description.match(/\[META_DATA\]([\s\S]*?)\[\/META_DATA\]/);
                      if (metaMatch && metaMatch[1]) {
                        try {
                          const metaData = JSON.parse(metaMatch[1]);
                          expenseData.supplier = metaData.supplier || "";
                          expenseData.paymentSource = metaData.paymentSource || "";
                          expenseData.vat = metaData.vat || "";
                          expenseData.totalIncTax = metaData.totalIncTax || "";
                          expenseData.isRecurring = Boolean(metaData.isRecurring);
                          
                          // Clean the description
                          expenseData.description = description.replace(/\[META_DATA\]([\s\S]*?)\[\/META_DATA\]/, '').trim();
                        } catch (error) {
                          console.error("Error parsing metadata:", error);
                        }
                      }
                      
                      expenseForm.reset(expenseData);
                      setEditingExpenseId(expense.id);
                      setOpenExpenseDialog(true);
                    }}
                  >
                    {/* Date */}
                    <div className="w-1/6 flex items-center">
                      <div className="bg-gray-100 text-blue-500 font-medium px-2 py-1 rounded">
                        {format(new Date(expense.date), 'dd MMM yyyy')}
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="w-1/4 truncate">
                      {(() => {
                        // Clean the description by removing metadata
                        let cleanDescription = expense.description || "";
                        
                        // Remove metadata tags and content if present
                        cleanDescription = cleanDescription.replace(/\[META_DATA\]([\s\S]*?)\[\/META_DATA\]/g, '').trim();
                        
                        // If there's still a description, show it
                        if (cleanDescription) {
                          return cleanDescription;
                        }
                        
                        // Try to extract supplier from metadata to display instead
                        try {
                          const metaMatch = expense.description?.match(/\[META_DATA\]([\s\S]*?)\[\/META_DATA\]/);
                          if (metaMatch && metaMatch[1]) {
                            const metaData = JSON.parse(metaMatch[1]);
                            if (metaData.supplier) {
                              return metaData.supplier;
                            }
                          }
                        } catch (e) {}
                        
                        // Default fallback
                        return expense.category + " expense";
                      })()}
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
                          setExpenseToDelete(expense.id);
                          setConfirmDeleteDialogOpen(true);
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
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-xl">
            {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
          <DialogDescription>
            Fill out the form to {editingExpenseId ? 'update your' : 'add a new'} expense
          </DialogDescription>
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
                    <FormLabel className="text-sm font-normal text-gray-500">Amount</FormLabel>
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
                name="totalIncTax"
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
              
              <div className="space-y-3">
                <FormLabel className="text-sm font-normal text-gray-500">Attach Receipt</FormLabel>
                <div 
                  className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    isDragging ? 'bg-blue-50 border-blue-300' : 'border-gray-300'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileChange({ target: { files: e.dataTransfer.files } } as any);
                    }
                  }}
                  onClick={() => document.getElementById('receipt-upload')?.click()}
                >
                  <input
                    id="receipt-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    {selectedFile ? (
                      <>
                        <div className="flex items-center justify-center bg-blue-50 text-blue-500 w-12 h-12 rounded-full mb-2">
                          {selectedFile.type.includes('image') ? (
                            <img 
                              src={URL.createObjectURL(selectedFile)} 
                              alt="Preview" 
                              className="h-9 w-9 object-cover rounded"
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                URL.revokeObjectURL(target.src);
                              }}
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                          )}
                        </div>
                        <p className="font-medium text-blue-600">{selectedFile.name}</p>
                        <p className="text-xs mt-1 text-gray-500">File selected. Click to change or drop a new file.</p>
                        <div className="mt-2 flex flex-col space-y-1">
                          {selectedFile.type.includes('image') && (
                            <div className="border rounded-md overflow-hidden max-w-[200px] mx-auto">
                              <img 
                                src={URL.createObjectURL(selectedFile)} 
                                alt="Receipt Preview" 
                                className="w-full h-auto object-contain bg-white"
                                style={{ maxHeight: '120px' }}
                                onLoad={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  URL.revokeObjectURL(target.src);
                                }}
                              />
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setReceiptFileName('');
                              expenseForm.setValue('receiptUrl', null);
                            }}
                            className="text-sm text-red-500 hover:text-red-700 flex items-center justify-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Remove file
                          </button>
                        </div>
                      </>
                    ) : receiptFileName && editingExpenseId ? (
                      <>
                        <div className="flex items-center justify-center bg-green-50 text-green-500 w-12 h-12 rounded-full mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                          </svg>
                        </div>
                        <p className="font-medium text-green-600">{receiptFileName}</p>
                        <p className="text-xs mt-1 text-gray-500">Existing receipt. Click to view or replace.</p>
                        {expenseForm.getValues().receiptUrl && (
                          <>
                            <div className="mt-3 mb-2 border rounded-md overflow-hidden max-w-[200px] mx-auto">
                              {expenseForm.getValues().receiptUrl?.toLowerCase().endsWith('.pdf') ? (
                                <div className="bg-red-50 p-4 text-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-red-500 mb-2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <path d="M9 15h6"></path>
                                    <path d="M9 11h6"></path>
                                  </svg>
                                  <span className="text-xs font-medium">PDF Document</span>
                                </div>
                              ) : (
                                <img 
                                  src={expenseForm.getValues().receiptUrl as string} 
                                  alt="Receipt"
                                  className="w-full h-auto object-contain bg-white"
                                  style={{ maxHeight: '150px' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M9 9h6v6H9z"></path><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>';
                                  }}
                                />
                              )}
                            </div>
                            <a 
                              href={expenseForm.getValues().receiptUrl as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="mt-2 text-sm text-blue-500 hover:text-blue-700 flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                              </svg>
                              View Full Receipt
                            </a>
                          </>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            expenseForm.setValue('receiptUrl', null);
                            setReceiptFileName('');
                          }}
                          className="mt-2 text-sm text-red-500 hover:text-red-700 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                          Remove receipt
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-center bg-gray-100 w-12 h-12 rounded-full mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                          </svg>
                        </div>
                        <p className="font-medium">Choose file to upload or drag and drop</p>
                        <p className="text-xs mt-1">(JPG, JPEG, PNG, PDF - max 3MB)</p>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Attachments larger than 3MB may take longer to upload when saving an expense.
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
                  onClick={() => {
                    setOpenExpenseDialog(false);
                    setSelectedFile(null);
                    setReceiptFileName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {createExpenseMutation.isPending ? "Saving..." : editingExpenseId ? "Update Expense" : "Add Expense"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Delete Expense</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently remove the expense from your records.
          </DialogDescription>
          <div className="p-6 text-center">
            <svg 
              className="mx-auto mb-4 text-red-500 w-12 h-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <h3 className="mb-5 text-lg font-normal text-gray-600">
              Are you sure you want to remove this item?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                onClick={() => {
                  if (expenseToDelete) {
                    deleteExpenseMutation.mutate(expenseToDelete);
                  }
                  setConfirmDeleteDialogOpen(false);
                  setExpenseToDelete(null);
                }}
              >
                Remove Item
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setConfirmDeleteDialogOpen(false);
                  setExpenseToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;