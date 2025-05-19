import { Router } from "express";
import {
  getOrderListReport,
  getQuoteListReport,
  getBakingListReport,
  getBakingListByTypeReport,
  getShoppingListReport,
  getTaskListReport,
  getDeliveriesListReport,
  getIncomeStatementReport,
  getOrderItemBreakdownReport,
  getBreakdownByOrderTypeReport,
  getBreakdownByEventTypeReport,
  getPaymentsByPeriodReport,
  getExpenseSummaryReport,
  getExpenseDetailedReport,
  getExpensesByCategoryReport,
  getIncomeDetailedReport,
  getIncomeByCategoryReport,
  getBusinessPerformanceReport,
  getCustomerAnalyticsReport,
  downloadReport
} from "../controllers/reports";

export const router = Router();

// List reports
router.get("/orders", getOrderListReport);
router.get("/quotes", getQuoteListReport);
router.get("/baking", getBakingListReport);
router.get("/baking-by-type", getBakingListByTypeReport);
router.get("/shopping", getShoppingListReport);
router.get("/tasks", getTaskListReport);
router.get("/deliveries", getDeliveriesListReport);

// Financial reports
router.get("/income-statement", getIncomeStatementReport);
router.get("/expenses-summary", getExpenseSummaryReport);
router.get("/expenses-detailed", getExpenseDetailedReport);
router.get("/expenses-by-category", getExpensesByCategoryReport);
router.get("/income-detailed", getIncomeDetailedReport);
router.get("/income-by-category", getIncomeByCategoryReport);
router.get("/payments-by-period", getPaymentsByPeriodReport);

// Analytics reports
router.get("/orders-breakdown", getOrderItemBreakdownReport);
router.get("/breakdown-by-order-type", getBreakdownByOrderTypeReport);
router.get("/breakdown-by-event-type", getBreakdownByEventTypeReport);
router.get("/business-performance", getBusinessPerformanceReport);
router.get("/customer-analytics", getCustomerAnalyticsReport);

// Download report in CSV/PDF format
router.get("/download/:reportType", downloadReport);