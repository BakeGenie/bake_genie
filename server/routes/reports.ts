import { Router } from "express";
import * as reportController from "../controllers/reports";

export const router = Router();

// List Reports
router.get("/orders", reportController.getOrderListReport);
router.get("/quotes", reportController.getQuoteListReport);
router.get("/baking", reportController.getBakingListReport);
router.get("/baking/by-type", reportController.getBakingListByTypeReport);
router.get("/baking/by-customer", reportController.getBakingListByTypeReport);
router.get("/shopping", reportController.getShoppingListReport);
router.get("/tasks", reportController.getTaskListReport);
router.get("/deliveries", reportController.getDeliveriesListReport);

// Financial Reports
router.get("/income-statement", reportController.getIncomeStatementReport);
router.get("/order-items", reportController.getOrderItemBreakdownReport);
router.get("/breakdown/order-type", reportController.getBreakdownByOrderTypeReport);
router.get("/breakdown/event-type", reportController.getBreakdownByEventTypeReport);
router.get("/payments", reportController.getPaymentsByPeriodReport);
router.get("/expenses/summary", reportController.getExpenseSummaryReport);
router.get("/expenses/detailed", reportController.getExpenseDetailedReport);
router.get("/expenses/by-category", reportController.getExpensesByCategoryReport);
router.get("/income/detailed", reportController.getIncomeDetailedReport);
router.get("/income/by-category", reportController.getIncomeByCategoryReport);

// Analytics Reports
router.get("/business-performance", reportController.getBusinessPerformanceReport);
router.get("/customer-analytics", reportController.getCustomerAnalyticsReport);

// Download Reports
router.get("/:reportId/download/:format", reportController.downloadReport);

export default router;