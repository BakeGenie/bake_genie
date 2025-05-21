import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "./contexts/settings-context";
import { FeaturesProvider } from "./contexts/features-context";
import NotFound from "@/pages/not-found";
import AppLayout from "./layouts/app-layout";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import OrderDetails from "./pages/order-details";
import OrdersSimple from "./pages/OrdersSimple";
import Contacts from "./pages/contacts";
import Enquiries from "./pages/enquiries";
import EnquiryForm from "./pages/enquiry-form";
import TaskList from "./pages/task-list";
import Calendar from "./pages/calendar";
import Recipes from "./pages/recipes-new";
import RecipesList from "./pages/recipes-list";
import AddRecipe from "./pages/add-recipe";
import IngredientsList from "./pages/ingredients-list";
import CreateTestOrder from "./pages/create-test-order";
import SimpleOrder from "./pages/simple-order";
import DirectOrder from "./pages/direct-order";
import SuppliesList from "./pages/supplies-list";
import MasterIngredients from "./pages/master-ingredients";
import Bundles from "./pages/bundles";
import Products from "./pages/products";
import Reports from "./pages/reports";
import Expenses from "./pages/expenses";
import Printables from "./pages/printables";
import Tools from "./pages/tools";
import Account from "./pages/account";
import ManageSubscription from "./pages/manage-subscription";
import CancelSubscription from "./pages/cancel-subscription";
import DataImportExport from "./pages/data-import-export";
import Import from "./pages/import";
import Integrations from "./pages/integrations";
import Settings from "./pages/settings";
import EmailTemplates from "./pages/email-templates";
import TaxRates from "./pages/tax-rates";
import NewOrder from "./pages/new-order";
import ManageFeatures from "./pages/manage-features";
import InvoicePreview from "./pages/invoice-preview";
import StripePaymentProvider from "./pages/payment-settings/stripe";
import SquarePaymentProvider from "./pages/payment-settings/square";
import TippingSettings from "./pages/payment-settings/tipping";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/orders/new" component={NewOrder} />
        <Route path="/orders/test" component={CreateTestOrder} />
        <Route path="/orders/simple" component={SimpleOrder} />
        <Route path="/orders/direct" component={DirectOrder} />
        <Route path="/orders/:id" component={OrderDetails} />
        <Route path="/orders-simple" component={OrdersSimple} />
        <Route path="/orders" component={Orders} />
        <Route path="/contacts" component={Contacts} />
        <Route path="/enquiries" component={Enquiries} />
        <Route path="/tasks" component={TaskList} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/recipes/recipes-list" component={RecipesList} />
        <Route path="/recipes/add-recipe" component={AddRecipe} />
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
        <Route path="/settings/email-templates" component={EmailTemplates} />
        <Route path="/tax-rates" component={TaxRates} />
        <Route path="/account" component={Account} />
        <Route path="/manage-subscription" component={ManageSubscription} />
        <Route path="/cancel-subscription" component={CancelSubscription} />
        <Route path="/data" component={DataImportExport} />
        <Route path="/import" component={Import} />
        <Route path="/integrations" component={Integrations} />
        <Route path="/payment-settings/stripe" component={StripePaymentProvider} />
        <Route path="/payment-settings/square" component={SquarePaymentProvider} />
        <Route path="/payment-settings/tipping" component={TippingSettings} />
        <Route path="/enquiry-form" component={EnquiryForm} />
        <Route path="/manage-features" component={ManageFeatures} />
        <Route path="/invoice-preview" component={InvoicePreview} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <FeaturesProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </FeaturesProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
