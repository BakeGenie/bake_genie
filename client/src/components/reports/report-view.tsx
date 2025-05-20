import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { OrderWithItems } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { FormatCurrency } from "@/components/ui/format-currency";

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

interface ReportViewProps {
  reportId: string;
  dateRange: DateRange;
  onBack: () => void;
}

// Define interfaces for different report data types
interface OrderListItem {
  id: number;
  orderNumber: string;
  eventDate: string;
  customerName: string;
  eventType: string;
  status: string;
  total: number;
}

interface QuoteListItem {
  id: number;
  quoteNumber: string;
  createdAt: string;
  customerName: string;
  eventType: string;
  status: string;
  total: number;
}

interface BakingListItem {
  id: number;
  orderNumber: string;
  eventDate: string;
  customerName: string;
  itemName: string;
  quantity: number;
  recipeId?: number;
  notes?: string;
}

interface TaskListItem {
  id: number;
  title: string;
  dueDate: string | null;
  priority: string;
  status: string;
  relatedOrderId?: number;
  relatedOrderNumber?: string;
}

interface DeliveryListItem {
  id: number;
  orderNumber: string;
  eventDate: string;
  customerName: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
}

interface ShoppingListItem {
  id: number;
  ingredient: string;
  quantity: number;
  unit: string;
  usedInRecipes: string[];
  supplier?: string;
}

interface ExpenseReportItem {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
}

interface IncomeReportItem {
  id: number;
  date: string;
  source: string;
  description: string;
  amount: number;
}

interface CustomerAnalyticsItem {
  id: number;
  customerName: string;
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
}

interface MileageReportItem {
  id: number;
  date: string;
  purpose: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  relatedOrderId?: number;
}

const ReportView: React.FC<ReportViewProps> = ({ reportId, dateRange, onBack }) => {
  // Get report title and description based on ID
  const getReportInfo = () => {
    // This should match the reportTypes in the reports.tsx page
    const reports: Record<string, { title: string; description: string }> = {
      "order-list": {
        title: "Order List",
        description: "All orders within the selected date range"
      },
      "quote-list": {
        title: "Quote List",
        description: "All quotes within the selected date range"
      },
      "baking-list": {
        title: "Baking List",
        description: "Items that need to be baked within the selected date range"
      },
      "baking-list-by-type": {
        title: "Baking List by Type",
        description: "Baking items organized by type within the selected date range"
      },
      "baking-list-by-customer": {
        title: "Baking List by Type Excl Customer",
        description: "Baking items by type without customer details"
      },
      "shopping-list": {
        title: "Shopping List",
        description: "Required ingredients for all orders in the selected period"
      },
      "shopping-list-by-recipe": {
        title: "Shopping List by Recipe",
        description: "Required ingredients organized by recipe"
      },
      "task-list": {
        title: "Task List",
        description: "Current open tasks"
      },
      "deliveries-list": {
        title: "Deliveries List",
        description: "Upcoming deliveries within the selected date range"
      },
      "income-statement": {
        title: "Income Statement",
        description: "Financial statement for the selected period"
      },
      "order-item-breakdown": {
        title: "Detailed Order Item Breakdown",
        description: "Cost breakdown for each item in your orders"
      },
      "breakdown-order-type": {
        title: "Breakdown by Order Type",
        description: "Order analysis by order type"
      },
      "breakdown-event-type": {
        title: "Breakdown by Event Type",
        description: "Order analysis by event type"
      },
      "payments-by-period": {
        title: "Payments by Period",
        description: "All payments received during the selected period"
      },
      "expense-summary": {
        title: "Summary Expense Report",
        description: "Summarized expenses by category"
      },
      "expense-detailed": {
        title: "Detailed Expense Report",
        description: "Detailed breakdown of all expenses"
      },
      "expense-by-category": {
        title: "Expenses By Category Report",
        description: "Expenses organized by category"
      },
      "income-detailed": {
        title: "Detailed Additional Income Report",
        description: "Detailed breakdown of additional income"
      },
      "income-by-category": {
        title: "Additional Income By Category Report",
        description: "Additional income organized by category"
      },
      "mileage-report": {
        title: "Mileage Report",
        description: "Distance traveled for business purposes"
      },
      "business-performance": {
        title: "Business Performance",
        description: "Overall business performance metrics"
      },
      "customer-analytics": {
        title: "Customer Analytics",
        description: "Customer spending patterns and statistics"
      }
    };

    return reports[reportId] || { title: "Report", description: "Report details" };
  };

  // Define columns for each report type
  const getColumns = ():
    | ColumnDef<OrderListItem>[]
    | ColumnDef<QuoteListItem>[]
    | ColumnDef<BakingListItem>[]
    | ColumnDef<TaskListItem>[]
    | ColumnDef<DeliveryListItem>[]
    | ColumnDef<ShoppingListItem>[]
    | ColumnDef<ExpenseReportItem>[]
    | ColumnDef<IncomeReportItem>[]
    | ColumnDef<CustomerAnalyticsItem>[]
    | ColumnDef<MileageReportItem>[] => {
    switch (reportId) {
      case "order-list":
        return [
          {
            accessorKey: "orderNumber",
            header: "Order #",
          },
          {
            accessorKey: "eventDate",
            header: "Event Date",
            cell: ({ row }) => formatDate(row.getValue("eventDate")),
          },
          {
            accessorKey: "customerName",
            header: "Customer",
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
            cell: ({ row }) => formatCurrency(row.getValue("total")),
          },
        ];

      case "quote-list":
        return [
          {
            accessorKey: "quoteNumber",
            header: "Quote #",
          },
          {
            accessorKey: "createdAt",
            header: "Created Date",
            cell: ({ row }) => formatDate(row.getValue("createdAt")),
          },
          {
            accessorKey: "customerName",
            header: "Customer",
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
            cell: ({ row }) => formatCurrency(row.getValue("total")),
          },
        ];

      case "baking-list":
      case "baking-list-by-type":
      case "baking-list-by-customer":
        return [
          {
            accessorKey: "orderNumber",
            header: "Order #",
          },
          {
            accessorKey: "eventDate",
            header: "Event Date",
            cell: ({ row }) => formatDate(row.getValue("eventDate")),
          },
          {
            accessorKey: "customerName",
            header: "Customer",
          },
          {
            accessorKey: "itemName",
            header: "Item",
          },
          {
            accessorKey: "quantity",
            header: "Quantity",
          },
          {
            accessorKey: "notes",
            header: "Notes",
          },
        ];

      case "task-list":
        return [
          {
            accessorKey: "title",
            header: "Task",
          },
          {
            accessorKey: "dueDate",
            header: "Due Date",
            cell: ({ row }) => {
              const date = row.getValue("dueDate") as string | null;
              return date ? formatDate(date) : "-";
            },
          },
          {
            accessorKey: "priority",
            header: "Priority",
          },
          {
            accessorKey: "status",
            header: "Status",
          },
          {
            accessorKey: "relatedOrderNumber",
            header: "Related Order",
            cell: ({ row }) => row.getValue("relatedOrderNumber") || "-",
          },
        ];

      case "deliveries-list":
        return [
          {
            accessorKey: "orderNumber",
            header: "Order #",
          },
          {
            accessorKey: "eventDate",
            header: "Event Date",
            cell: ({ row }) => formatDate(row.getValue("eventDate")),
          },
          {
            accessorKey: "customerName",
            header: "Customer",
          },
          {
            accessorKey: "address",
            header: "Delivery Address",
          },
          {
            accessorKey: "deliveryDate",
            header: "Delivery Date",
            cell: ({ row }) => formatDate(row.getValue("deliveryDate")),
          },
          {
            accessorKey: "deliveryTime",
            header: "Time",
          },
          {
            accessorKey: "status",
            header: "Status",
          },
        ];

      case "shopping-list":
      case "shopping-list-by-recipe":
        return [
          {
            accessorKey: "ingredient",
            header: "Ingredient",
          },
          {
            accessorKey: "quantity",
            header: "Quantity",
          },
          {
            accessorKey: "unit",
            header: "Unit",
          },
          {
            accessorKey: "usedInRecipes",
            header: "Used In",
            cell: ({ row }) => {
              const recipes = row.getValue("usedInRecipes") as string[];
              return recipes ? recipes.join(", ") : "-";
            },
          },
          {
            accessorKey: "supplier",
            header: "Supplier",
            cell: ({ row }) => row.getValue("supplier") || "-",
          },
        ];

      case "expense-summary":
      case "expense-detailed":
      case "expense-by-category":
        return [
          {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => formatDate(row.getValue("date")),
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
            cell: ({ row }) => <FormatCurrency amount={row.getValue("amount")} />,
          },
        ];

      case "income-detailed":
      case "income-by-category":
        return [
          {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => formatDate(row.getValue("date")),
          },
          {
            accessorKey: "source",
            header: "Source",
          },
          {
            accessorKey: "description",
            header: "Description",
          },
          {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => <FormatCurrency amount={row.getValue("amount")} />,
          },
        ];

      case "customer-analytics":
        return [
          {
            accessorKey: "customerName",
            header: "Customer",
          },
          {
            accessorKey: "orderCount",
            header: "# of Orders",
          },
          {
            accessorKey: "totalSpent",
            header: "Total Spent",
            cell: ({ row }) => formatCurrency(row.getValue("totalSpent")),
          },
          {
            accessorKey: "averageOrderValue",
            header: "Average Order",
            cell: ({ row }) => formatCurrency(row.getValue("averageOrderValue")),
          },
          {
            accessorKey: "firstOrderDate",
            header: "First Order",
            cell: ({ row }) => formatDate(row.getValue("firstOrderDate")),
          },
          {
            accessorKey: "lastOrderDate",
            header: "Last Order",
            cell: ({ row }) => formatDate(row.getValue("lastOrderDate")),
          },
        ];

      case "mileage-report":
        return [
          {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => formatDate(row.getValue("date")),
          },
          {
            accessorKey: "purpose",
            header: "Purpose",
          },
          {
            accessorKey: "startOdometer",
            header: "Start Odometer",
          },
          {
            accessorKey: "endOdometer",
            header: "End Odometer",
          },
          {
            accessorKey: "distance",
            header: "Distance",
            cell: ({ row }) => `${row.getValue("distance")} miles`,
          },
        ];

      default:
        return [];
    }
  };

  // Get API endpoint for each report type
  const getApiEndpoint = () => {
    switch (reportId) {
      case "order-list":
        return "/api/orders";
      case "quote-list":
        return "/api/quotes";
      case "baking-list":
        return "/api/reports/baking";
      case "baking-list-by-type":
        return "/api/reports/baking/by-type";
      case "baking-list-by-customer":
        return "/api/reports/baking/by-customer";
      case "shopping-list":
        return "/api/reports/shopping";
      case "shopping-list-by-recipe":
        return "/api/reports/shopping/by-recipe";
      case "task-list":
        return "/api/tasks";
      case "deliveries-list":
        return "/api/reports/deliveries";
      case "income-statement":
        return "/api/reports/income-statement";
      case "order-item-breakdown":
        return "/api/reports/order-items";
      case "breakdown-order-type":
        return "/api/reports/breakdown/order-type";
      case "breakdown-event-type":
        return "/api/reports/breakdown/event-type";
      case "payments-by-period":
        return "/api/reports/payments";
      case "expense-summary":
        return "/api/expenses";
      case "expense-detailed":
        return "/api/expenses/detailed";
      case "expense-by-category":
        return "/api/expenses/by-category";
      case "income-detailed":
        return "/api/income";
      case "income-by-category":
        return "/api/income/by-category";
      case "mileage-report":
        return "/api/reports/mileage";
      case "business-performance":
        return "/api/reports/business-performance";
      case "customer-analytics":
        return "/api/reports/customer-analytics";
      default:
        return "/api/reports";
    }
  };

  // Map API data to report format
  const formatReportData = (data: any) => {
    if (!data) return [];
    
    switch (reportId) {
      case "order-list":
        return data.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber || `#${order.id}`,
          eventDate: order.eventDate,
          customerName: order.contact ? `${order.contact.firstName} ${order.contact.lastName}` : "Unknown",
          eventType: order.eventType,
          status: order.status,
          total: order.total || 0
        }));
      
      case "quote-list":
        return data.map((quote: any) => ({
          id: quote.id,
          quoteNumber: quote.quoteNumber || `#${quote.id}`,
          createdAt: quote.createdAt,
          customerName: quote.contact ? `${quote.contact.firstName} ${quote.contact.lastName}` : "Unknown",
          eventType: quote.eventType,
          status: quote.status,
          total: quote.total || 0
        }));
      
      case "task-list":
        return data.map((task: any) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status,
          relatedOrderId: task.orderId,
          relatedOrderNumber: task.orderId ? `#${task.orderId}` : null
        }));
      
      case "expense-summary":
      case "expense-detailed":
      case "expense-by-category":
        return data.map((expense: any) => ({
          id: expense.id,
          date: expense.date,
          category: expense.category,
          description: expense.description,
          amount: expense.amount
        }));
      
      case "income-detailed":
      case "income-by-category":
        return data.map((income: any) => ({
          id: income.id,
          date: income.date,
          source: income.source,
          description: income.description,
          amount: income.amount
        }));

      default:
        return data;
    }
  };

  // Fetch report data
  const { data, isLoading, isError } = useQuery({
    queryKey: [getApiEndpoint(), { 
      startDate: dateRange.startDate?.toISOString(),
      endDate: dateRange.endDate?.toISOString() || new Date().toISOString() 
    }],
    queryFn: async () => {
      const response = await fetch(`${getApiEndpoint()}?startDate=${dateRange.startDate?.toISOString()}&endDate=${dateRange.endDate?.toISOString() || new Date().toISOString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      const data = await response.json();
      return formatReportData(data);
    },
    enabled: !!reportId && !!dateRange.startDate,
  });

  const reportInfo = getReportInfo();
  const columns = getColumns();

  // Handle download report
  const handleDownload = (format: 'pdf' | 'csv') => {
    window.open(`${getApiEndpoint()}/download?format=${format}&startDate=${dateRange.startDate?.toISOString()}&endDate=${dateRange.endDate?.toISOString() || new Date().toISOString()}`, '_blank');
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b p-4">
        <div>
          <CardTitle className="text-xl">{reportInfo.title}</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">{reportInfo.description}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {dateRange.startDate ? formatDate(dateRange.startDate) : ''} 
            {dateRange.endDate ? ` - ${formatDate(dateRange.endDate)}` : ''}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload('csv')}>
            <DownloadIcon className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
            <DownloadIcon className="h-4 w-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-red-500">Failed to load report data. Please try again.</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data || []} 
            isLoading={isLoading} 
            searchPlaceholder={`Search ${reportInfo.title}...`}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ReportView;