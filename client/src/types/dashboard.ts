export interface DashboardStats {
  totalOrders: number;
  totalQuotes: number;
  activeQuotes: number;
  totalRevenue: number;
  upcomingOrders: number;
  pendingTasks: number;
  monthlyRevenue: MonthlyRevenue[];
  ordersByType: TypeCount[];
  quotesByType: TypeCount[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface TypeCount {
  type: string;
  count: number;
}