import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  FormDescription,
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
  Filter,
  Plus,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";

// Define the income types
type Income = {
  id: number;
  userId: number;
  category: string;
  amount: string;
  date: string;
  description: string | null;
  createdAt: string;
};

// Define income categories
const incomeCategories = [
  "Cake Stand Hire",
  "Classes",
  "Contracting Fee",
  "Craft Market",
  "Edible Prints",
  "Sample Box",
  "Tips",
  "Other"
];

// Form schema for income
const incomeFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  description: z.string().nullable().optional(),
});

const Income = () => {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "MMMM"));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), "yyyy"));
  const [openIncomeDialog, setOpenIncomeDialog] = useState(false);

  // Form for adding new income
  const incomeForm = useForm({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      category: incomeCategories[0],
      amount: "",
      date: new Date(),
      description: "",
    },
  });

  // Query for fetching income data
  const { data: incomeData, isLoading } = useQuery({
    queryKey: ["/api/income"],
  });

  // Mutation for creating new income
  const createIncomeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/income", { method: "POST", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      setOpenIncomeDialog(false);
      incomeForm.reset();
      toast({
        title: "Income Added",
        description: "The income has been successfully added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "There was an error adding the income.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission for new income
  const onSubmitIncome = (data: any) => {
    const formattedData = {
      ...data,
      date: format(data.date, "yyyy-MM-dd"),
      userId: 1, // Replace with actual user ID
    };
    createIncomeMutation.mutate(formattedData);
  };

  // Get month and year options
  const getMonthOptions = () => {
    return [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return [
      String(currentYear - 2),
      String(currentYear - 1),
      String(currentYear),
      String(currentYear + 1),
    ];
  };

  // Filter income data by selected month and year
  const filteredIncomeData = incomeData
    ? incomeData.filter((income: Income) => {
        const incomeDate = new Date(income.date);
        return (
          format(incomeDate, "MMMM") === selectedMonth &&
          format(incomeDate, "yyyy") === selectedYear
        );
      })
    : [];

  return (
    <div className="container mx-auto p-4 mb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/business-expenses">
            <Button variant="ghost" className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold ml-2">Additional Income</h1>
        </div>
        <Button
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={() => setOpenIncomeDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Income
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <div className="flex items-center mb-4 sm:mb-0">
            <span className="mr-2">Income Period:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 mr-2">
                <SelectValue>{selectedMonth}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-24">
                <SelectValue>{selectedYear}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getYearOptions().map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" /> All Incomes
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="p-2">
                  {incomeCategories.map((category) => (
                    <div key={category} className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                      {category}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredIncomeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-gray-500">
            <div className="rounded-full bg-gray-100 p-3 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-center">You have no incomes captured for this period</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-medium mb-2">
              {selectedMonth} {selectedYear}
            </h2>
            {filteredIncomeData.map((income: Income) => (
              <div key={income.id} className="border-b py-3 flex justify-between items-center">
                <div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">
                      {format(new Date(income.date), "dd MMM yyyy")}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {income.category}
                    </span>
                  </div>
                  {income.description && (
                    <p className="text-sm text-gray-500 mt-1">{income.description}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-4">$ {income.amount}</span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-4 pt-2 border-t">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total:</div>
                <div className="text-xl font-bold">
                  ${" "}
                  {filteredIncomeData
                    .reduce((total: number, income: Income) => total + parseFloat(income.amount), 0)
                    .toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Income Dialog */}
      <Dialog open={openIncomeDialog} onOpenChange={setOpenIncomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
            <DialogDescription>
              Record additional income for your business. Fill out the details below.
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        value={field.value ? format(field.value, "EEE, dd MMM yyyy") : ""}
                        onClick={() => document.getElementById("income-calendar-toggle")?.click()}
                        readOnly
                      />
                    </FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button id="income-calendar-toggle" type="button" variant="outline" className="hidden">
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
                <Button type="button" variant="outline" onClick={() => setOpenIncomeDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createIncomeMutation.isPending} className="bg-blue-500">
                  {createIncomeMutation.isPending ? "Saving..." : "Add Income"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Income;