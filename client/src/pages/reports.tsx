import React, { useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "@/types";
import ReportView from "@/components/reports/report-view";
import {
  CalendarIcon,
  FileTextIcon,
  ClipboardListIcon,
  BarChart2Icon,
  ShoppingCartIcon,
  ReceiptIcon,
  TruckIcon,
  UsersIcon,
  FileIcon,
  DollarSignIcon,
  PieChartIcon,
  CreditCardIcon,
  CarIcon,
  CheckSquareIcon
} from "lucide-react";

// Date range form schema
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
});

// Define List types
const listTypes = [
  {
    id: "order-list",
    name: "Order List",
    icon: <FileTextIcon className="h-5 w-5" />,
    description: "Use this report to view all your orders between a specified period",
    category: "lists"
  },
  {
    id: "quote-list",
    name: "Quote List",
    icon: <FileIcon className="h-5 w-5" />,
    description: "Use this report to view all your quotes between a specified period",
    category: "lists"
  },
  {
    id: "baking-list",
    name: "Baking List",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    description: "Use this report to view what you need to bake between a specified period",
    category: "lists"
  },
  {
    id: "baking-list-by-type",
    name: "Baking List by Type",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    description: "Use this report to view what you need to bake between a specified period",
    category: "lists"
  },
  {
    id: "baking-list-by-customer",
    name: "Baking List by Type Excl Customer",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    description: "Use this report to view what you need to bake between a specified period",
    category: "lists"
  },
  {
    id: "shopping-list",
    name: "Shopping List",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    description: "View a list of your required ingredients for all orders in a specified period",
    category: "lists"
  },
  {
    id: "shopping-list-by-recipe",
    name: "Shopping List by Recipe",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    description: "View a list of your required ingredients by recipe for all orders in a specified period",
    category: "lists"
  },
  {
    id: "task-list",
    name: "Task List",
    icon: <CheckSquareIcon className="h-5 w-5" />,
    description: "View a list of your tasks that you currently have open",
    category: "lists"
  },
  {
    id: "deliveries-list",
    name: "Deliveries List",
    icon: <TruckIcon className="h-5 w-5" />,
    description: "View a list of your orders and their delivery details",
    category: "lists"
  }
];

// Define Report types
const reportTypes = [
  {
    id: "income-statement",
    name: "Income Statement",
    icon: <DollarSignIcon className="h-5 w-5" />,
    description: "Use this report to view your income statement report for a period",
    category: "reports"
  },
  {
    id: "order-item-breakdown",
    name: "Detailed Order Item Breakdown",
    icon: <FileTextIcon className="h-5 w-5" />,
    description: "Use this report to view the cost breakdown of each item in your orders",
    category: "reports"
  },
  {
    id: "breakdown-order-type",
    name: "Breakdown by Order Type",
    icon: <PieChartIcon className="h-5 w-5" />,
    description: "Use this report to view a breakdown of your orders by order type",
    category: "reports"
  },
  {
    id: "breakdown-event-type",
    name: "Breakdown by Event Type",
    icon: <PieChartIcon className="h-5 w-5" />,
    description: "Use this report to view a breakdown of your orders by event type",
    category: "reports"
  },
  {
    id: "payments-by-period",
    name: "Payments by Period",
    icon: <CreditCardIcon className="h-5 w-5" />,
    description: "Use this report to view all payments made for a period",
    category: "reports"
  },
  {
    id: "expense-summary",
    name: "Summary Expense Report",
    icon: <ReceiptIcon className="h-5 w-5" />,
    description: "Use this report for a summarized view of your expenses",
    category: "reports"
  },
  {
    id: "expense-detailed",
    name: "Detailed Expense Report",
    icon: <ReceiptIcon className="h-5 w-5" />,
    description: "Use this report for a detailed view of your expenses",
    category: "reports"
  },
  {
    id: "expense-by-category",
    name: "Expenses By Category Report",
    icon: <ReceiptIcon className="h-5 w-5" />,
    description: "Use this report for a detailed view of your expenses by category",
    category: "reports"
  },
  {
    id: "income-detailed",
    name: "Detailed Additional Income Report",
    icon: <DollarSignIcon className="h-5 w-5" />,
    description: "Use this report for a detailed view of your additional income",
    category: "reports"
  },
  {
    id: "income-by-category",
    name: "Additional Income By Category Report",
    icon: <DollarSignIcon className="h-5 w-5" />,
    description: "Use this report for a detailed view of your additional income by category",
    category: "reports"
  },
  {
    id: "mileage-report",
    name: "Mileage Report",
    icon: <CarIcon className="h-5 w-5" />,
    description: "Use this report to view a breakdown of your mileage for a period",
    category: "reports"
  }
];

// Define Analytics types
const analyticsTypes = [
  {
    id: "business-performance",
    name: "Business Performance",
    icon: <BarChart2Icon className="h-5 w-5" />,
    description: "Use this to view a breakdown of how your business is performing",
    category: "analytics"
  },
  {
    id: "customer-analytics",
    name: "Customer Analytics",
    icon: <UsersIcon className="h-5 w-5" />,
    description: "Use this to view analytical information about your customers spend",
    category: "analytics"
  }
];

// Combine all report and list types for display
const allReportTypes = [...listTypes, ...reportTypes, ...analyticsTypes];

const Reports = () => {
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>("lists"); // 'lists', 'reports', or 'analytics'
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Date range form
  const form = useForm<DateRange>({
    resolver: zodResolver(dateRangeSchema),
    defaultValues: {
      startDate: new Date(new Date().setDate(1)), // First day of current month
      endDate: new Date(),
    },
  });

  // Handle report item click
  const handleReportClick = (reportId: string) => {
    setActiveReport(reportId);
    
    toast({
      title: "Report Selected",
      description: `${getReportById(reportId)?.name} report is ready to view.`,
    });
  };

  // Handle generate report
  const handleGenerateReport = () => {
    if (!activeReport) return;
    
    setIsGeneratingReport(true);
    
    // In a real implementation this would fetch the report data
    // For now, we'll just show a success message after a delay
    setTimeout(() => {
      setIsGeneratingReport(false);
      
      toast({
        title: "Report Generated",
        description: `${getReportById(activeReport)?.name} report for the selected date range is ready.`,
      });
    }, 1500);
  };

  // Get report details by ID
  const getReportById = (id: string) => {
    return allReportTypes.find(report => report.id === id);
  };

  // Get filtered report types based on active view
  const getFilteredReportTypes = () => {
    if (activeView === 'lists') {
      return listTypes;
    } else if (activeView === 'reports') {
      return reportTypes;
    } else if (activeView === 'analytics') {
      return analyticsTypes;
    }
    return [];
  };

  // Render report item card
  const renderReportItem = (item: typeof allReportTypes[0]) => (
    <div
      key={item.id}
      className="cursor-pointer bg-white hover:bg-gray-50 transition-colors rounded-md border shadow"
      onClick={() => handleReportClick(item.id)}
    >
      <div className="p-4 flex items-center space-x-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
        </div>
        <div className="flex-shrink-0">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );

  // If a report is selected, show the date range form and report view
  const showReportView = activeReport ? (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="p-4 mt-6">
        <Form {...form}>
          <div className="flex flex-wrap gap-4 items-end mb-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[160px] pl-3 text-left font-normal",
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
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[160px] pl-3 text-left font-normal",
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
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            
            <Button 
              type="button" 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="px-6"
            >
              {isGeneratingReport ? "Generating..." : "Generate Report"}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setActiveReport(null)}
              className="ml-auto"
            >
              Back to All Reports
            </Button>
          </div>
        </Form>
      </Card>
      
      {/* Report View Component */}
      <ReportView 
        reportId={activeReport}
        dateRange={form.getValues()}
        onBack={() => setActiveReport(null)}
      />
    </div>
  ) : (
    <>
      {/* Section Tabs */}
      <div className="flex items-center mb-6 border-b">
        <button
          onClick={() => setActiveView("lists")}
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeView === "lists" 
              ? "border-blue-500 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Lists
        </button>
        <button
          onClick={() => setActiveView("reports")}
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeView === "reports" 
              ? "border-blue-500 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setActiveView("analytics")}
          className={`px-6 py-3 text-sm font-medium border-b-2 ${
            activeView === "analytics" 
              ? "border-blue-500 text-blue-600" 
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Analytics
        </button>
      </div>
      
      {/* Section Description */}
      <div className="mb-6">
        {activeView === "lists" && (
          <div className="text-gray-600 mb-4">
            Use these lists to help yourself keep organized and on top of your orders.
          </div>
        )}
        {activeView === "reports" && (
          <div className="text-gray-600 mb-4">
            Use these reports to help give you better insight into how your business is performing.
          </div>
        )}
        {activeView === "analytics" && (
          <div className="text-gray-600 mb-4">
            Gain important insight into your business and track how you're doing each month.
          </div>
        )}
      </div>
      
      {/* Report Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {getFilteredReportTypes().map(item => renderReportItem(item))}
      </div>
    </>
  );

  return (
    <div className="container py-6">
      <PageHeader title="Reports & Lists" />
      {showReportView}
    </div>
  );
};

export default Reports;
