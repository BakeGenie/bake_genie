import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Will uncomment when settings context is fully integrated
// import { SettingsProvider } from "./contexts/settings-context";
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
import Recipes from "./pages/recipes-new";
import RecipesList from "./pages/recipes-list";
import IngredientsList from "./pages/ingredients-list";
import SuppliesList from "./pages/supplies-list";
import MasterIngredients from "./pages/master-ingredients";
import Bundles from "./pages/bundles";
import Products from "./pages/products";
import Reports from "./pages/reports";
import Expenses from "./pages/expenses";
import Printables from "./pages/printables";
import Tools from "./pages/tools";
import Account from "./pages/account";
import DataImportExport from "./pages/data-import-export";
import Integrations from "./pages/integrations";
import Settings from "./pages/settings";
import NewOrder from "./pages/new-order";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders/new" component={NewOrder} />
        <Route path="/orders/:id" component={OrderDetails} />
        <Route path="/orders" component={Orders} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/enquiries" component={Enquiries} />
        <Route path="/tasks" component={TaskList} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/recipes/recipes-list" component={RecipesList} />
        <Route path="/recipes/ingredients-list" component={IngredientsList} />
        <Route path="/recipes/supplies-list" component={SuppliesList} />
        <Route path="/recipes/master-ingredients" component={MasterIngredients} />
        <Route path="/recipes/bundles" component={Bundles} />
        <Route path="/products" component={Products} />
        <Route path="/reports" component={Reports} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/printables" component={Printables} />
        <Route path="/tools" component={Tools} />
        <Route path="/settings" component={Settings} />
        <Route path="/account" component={Account} />
        <Route path="/data" component={DataImportExport} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/enquiry-form" component={EnquiryForm} />
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
