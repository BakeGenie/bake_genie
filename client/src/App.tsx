import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppLayout from "./layouts/app-layout";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import OrderDetails from "./pages/order-details";
import Contacts from "./pages/contacts";
import Enquiries from "./pages/enquiries";
import EnquiryForm from "./pages/enquiry-form";
import TaskList from "./pages/task-list";
import Calendar from "./pages/calendar";
import Recipes from "./pages/recipes";
import Products from "./pages/products";
import Reports from "./pages/reports";
import Expenses from "./pages/expenses";
import Printables from "./pages/printables";
import Tools from "./pages/tools";
import Account from "./pages/account";
import DataImportExport from "./pages/data-import-export";
import Integrations from "./pages/integrations";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderDetails} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/enquiries" component={Enquiries} />
        <Route path="/tasks" component={TaskList} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/products" component={Products} />
        <Route path="/reports" component={Reports} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/printables" component={Printables} />
        <Route path="/tools" component={Tools} />
        <Route path="/account" component={Account} />
        <Route path="/data" component={DataImportExport} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/enquiry-form" component={EnquiryForm} />
        <Route path="/invoice-preview" component={React.lazy(() => import('./pages/invoice-preview'))} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
