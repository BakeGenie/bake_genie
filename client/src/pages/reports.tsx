import React from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate } from "@/lib/utils";
import {
  CalendarIcon,
  FileTextIcon,
  DownloadIcon,
  ListIcon,
  BarChart2Icon,
  ShoppingCartIcon,
  ReceiptIcon,
  ClipboardListIcon,
  UsersIcon,
  TruckIcon,
  FileIcon
} from "lucide-react";
import { OrderWithItems } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useToast } from "@/hooks/use-toast";

// Date range form schema
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date().optional(),
});

type DateRangeValues = z.infer<typeof dateRangeSchema>;

// Report types
const reportTypes = [
  {
    id: "baking-list",
    name: "Baking List",
    icon: <ClipboardListIcon className="h-5 w-5" />,
    description: "List of all items to be baked in a given time period",
  },
  {
    id: "performance",
    name: "Business Performance",
    icon: <BarChart2Icon className="h-5 w-5" />,
    description: "Financial performance reports and statistics",
  },
  {
    id: "customer-analytics",
    name: "Customer Analytics",
    icon: <UsersIcon className="h-5 w-5" />,
    description: "Analytics based on customer data and orders",
  },
  {
    id: "delivery-list",
    name: "Delivery List",
    icon: <TruckIcon className="h-5 w-5" />,
    description: "List of deliveries for a specific time period",
  },
  {
    id: "expense-reports",
    name: "Expense Reports",
    icon: <ReceiptIcon className="h-5 w-5" />,
    description: "Breakdown of business expenses",
  },
  {
    id: "order-list",
    name: "Order List",
    icon: <FileTextIcon className="h-5 w-5" />,
    description: "List of all orders within a specific date range",
  },
  {
    id: "quote-list",
    name: "Quote List",
    icon: <FileIcon className="h-5 w-5" />,
    description: "List of all quotes within a specific date range",
  },
  {
    id: "shopping-list",
    name: "Shopping List",
    icon: <ShoppingCartIcon className="h-5 w-5" />,
    description: "List of ingredients needed for upcoming orders",
  },
  {
    id: "income-statement",
    name: "Income Statement",
    icon: <BarChart2Icon className="h-5 w-5" />,
    description: "Financial statement showing profit or loss",
  },
];

const Reports = () => {
  const { toast } = useToast();
  const [activeReport, setActiveReport] = React.useState("order-list");
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Date range form
  const form = useForm<DateRangeValues>({
    resolver: zodResolver(dateRangeSchema),
    defaultValues: {
      startDate: new Date(new Date().setDate(1)), // First day of current month
      endDate: new Date(),
    },
  });

  // Order list columns
  const orderColumns: ColumnDef<OrderWithItems>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order #",
    },
    {
      accessorKey: "eventDate",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("eventDate") as string;
        return date ? formatDate(new Date(date)) : "";
      },
    },
    {
      accessorKey: "contact",
      header: "Customer",
      cell: ({ row }) => {
        const contact = row.original.contact;
        return contact ? `${contact.firstName} ${contact.lastName}` : "";
      },
    },
    {
      accessorKey: "eventType",
      header: "Event Type",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const total = row.getValue("total") as number;
        return `$${Number(total).toFixed(2)}`;
      },
    },
  ];

  // Fetch orders for the selected date range
  const { data: orders = [], isLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders", {
      startDate: form.getValues("startDate")?.toISOString(),
      endDate: form.getValues("endDate")?.toISOString() || new Date().toISOString(),
    }],
    enabled: activeReport === "order-list",
  });

  // Handle report generation
  const handleGenerateReport = () => {
    const { startDate, endDate } = form.getValues();
    
    setIsGenerating(true);
    
    setTimeout(() => {
      setIsGenerating(false);
      
      toast({
        title: "Report Generated",
        description: `${getReportById(activeReport)?.name} for ${formatDate(startDate)} to ${endDate ? formatDate(endDate) : 'present'} is ready.`,
      });
    }, 1000);
  };

  // Handle download
  const handleDownload = (format: "pdf" | "csv") => {
    toast({
      title: `Download ${format.toUpperCase()}`,
      description: `Your ${getReportById(activeReport)?.name} is being downloaded in ${format.toUpperCase()} format.`,
    });
  };

  // Get report details by ID
  const getReportById = (id: string) => {
    return reportTypes.find(report => report.id === id);
  };

  return (
    <div className="p-6">
      <PageHeader title="Reports & Lists" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Report types */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Types</CardTitle>
              <CardDescription>Select a report to generate</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {reportTypes.map((report) => (
                  <Button
                    key={report.id}
                    variant={activeReport === report.id ? "default" : "ghost"}
                    className={`w-full justify-start ${activeReport === report.id ? "" : "hover:bg-gray-100"}`}
                    onClick={() => setActiveReport(report.id)}
                  >
                    <div className="mr-2">{report.icon}</div>
                    <div className="flex flex-col items-start">
                      <span>{report.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report configuration and output */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{getReportById(activeReport)?.name}</CardTitle>
                  <CardDescription>{getReportById(activeReport)?.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload("csv")}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload("pdf")}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" /> PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Date range selector */}
              <Form {...form}>
                <form className="space-y-4 mb-6">
                  <div className="flex flex-wrap gap-4">
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
                                    "w-[200px] pl-3 text-left font-normal",
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
                                    "w-[200px] pl-3 text-left font-normal",
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
                    
                    <div className="flex items-end">
                      <Button 
                        type="button" 
                        onClick={handleGenerateReport}
                        disabled={isGenerating}
                      >
                        {isGenerating ? "Generating..." : "Generate Report"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>

              {/* Report content */}
              <div className="mt-4">
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="table">
                      <ListIcon className="h-4 w-4 mr-2" /> Table View
                    </TabsTrigger>
                    <TabsTrigger value="chart">
                      <BarChart2Icon className="h-4 w-4 mr-2" /> Chart View
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="table">
                    {activeReport === "order-list" && (
                      <div className="border rounded-md">
                        <DataTable
                          columns={orderColumns}
                          data={orders}
                          isLoading={isLoading}
                          searchPlaceholder="Search orders..."
                          searchKey="orderNumber"
                        />
                      </div>
                    )}
                    
                    {activeReport !== "order-list" && (
                      <div className="border rounded-md p-8 text-center">
                        <div className="mb-4">
                          {getReportById(activeReport)?.icon && (
                            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
                              {getReportById(activeReport)?.icon}
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-medium mb-2">Generate your report</h3>
                        <p className="text-gray-500 mb-4">
                          Set your date range and click "Generate Report" to see your data here.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="chart">
                    <div className="border rounded-md p-8 text-center">
                      <div className="mb-4">
                        <BarChart2Icon className="h-12 w-12 mx-auto text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Chart view coming soon</h3>
                      <p className="text-gray-500 mb-4">
                        Visualize your data with charts and graphs. This feature is coming soon.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
