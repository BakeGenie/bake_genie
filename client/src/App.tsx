import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "./contexts/settings-context";
import { FeaturesProvider } from "./contexts/features-context";
import { AuthProvider } from "./contexts/AuthContext";
import { TrialProvider } from "./contexts/TrialContext";
import NotFound from "@/pages/not-found";
import AppLayout from "./layouts/app-layout";
import Login from "./pages/login";
import Register from "./pages/register";
import LandingPage from "./pages/landing";
import Dashboard from "./pages/dashboard";
import Orders from "./pages/orders";
import OrderDetails from "./pages/order-details";
import OrdersSimple from "./pages/OrdersSimple";
import Contacts from "./pages/contacts";
import Enquiries from "./pages/enquiries";
import EnquiryForm from "./pages/enquiry-form";
import TaskList from "./pages/task-list-new";
import StartTrial from "./pages/start-trial";
import Calendar from "./pages/calendar-standalone";
import Recipes from "./pages/recipes-new";
import RecipesList from "./pages/recipes-list";
import AddRecipe from "./pages/add-recipe";
import ViewRecipe from "./pages/view-recipe";
import EditRecipe from "./pages/edit-recipe";
import IngredientsList from "./pages/ingredients-list";
import CreateTestOrder from "./pages/create-test-order";
import SimpleOrder from "./pages/simple-order";
import DirectOrder from "./pages/direct-order";
import SuppliesList from "./pages/supplies-list";
import MasterIngredients from "./pages/master-ingredients";
import Bundles from "./pages/bundles";
import Products from "./pages/products";
import Reports from "./pages/reports";
import BusinessExpenses from "./pages/business-expenses";
import Expenses from "./pages/expenses";
import Income from "./pages/income";
import Mileage from "./pages/mileage";
import Printables from "./pages/printables";
import Tools from "./pages/tools";
import Account from "./pages/account";
import ManageSubscription from "./pages/manage-subscription";
import CancelSubscription from "./pages/cancel-subscription";
import DataImportExport from "./pages/data-import-export";
import Import from "./pages/import";
import ContactsImport from "./pages/contacts-import";
import BakeDiaryImport from "./pages/bake-diary-import";
import SuppliesImport from "./pages/supplies-import";
import RecipesImport from "./pages/recipes-import";
import Integrations from "./pages/integrations";
import Settings from "./pages/settings";
import EmailTemplates from "./pages/email-templates";
import TaxRates from "./pages/tax-rates";
import NewOrder from "./pages/new-order";
import ManageFeatures from "./pages/manage-features";
import InvoicePreview from "./pages/invoice-preview";
import PaymentSettings from "./pages/payment-settings";
import StripePaymentProvider from "./pages/payment-settings/stripe";
import SquarePaymentProvider from "./pages/payment-settings/square";
import TippingSettings from "./pages/payment-settings/tipping";
import PaymentSuccess from "./pages/payment-success";
import TryTrial from "./pages/try-trial";

// Import ProtectedRoute component
import ProtectedRoute from "./components/auth/ProtectedRoute";

function Router() {
  return (
    <AppLayout>
      <Switch>
        {/* Public routes - no authentication required */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/" component={LandingPage} />
        <Route path="/enquiry-form" component={EnquiryForm} />
        <Route path="/start-trial" component={StartTrial} />
        <Route path="/try-trial" component={TryTrial} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/orders/new">
          <ProtectedRoute>
            <NewOrder />
          </ProtectedRoute>
        </Route>
        <Route path="/orders/test">
          <ProtectedRoute>
            <CreateTestOrder />
          </ProtectedRoute>
        </Route>
        <Route path="/orders/simple">
          <ProtectedRoute>
            <SimpleOrder />
          </ProtectedRoute>
        </Route>
        <Route path="/orders/direct">
          <ProtectedRoute>
            <DirectOrder />
          </ProtectedRoute>
        </Route>
        <Route path="/orders/:id">
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        </Route>
        <Route path="/orders-simple">
          <ProtectedRoute>
            <OrdersSimple />
          </ProtectedRoute>
        </Route>
        <Route path="/orders">
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        </Route>
        <Route path="/contacts">
          <ProtectedRoute>
            <Contacts />
          </ProtectedRoute>
        </Route>
        <Route path="/enquiries">
          <ProtectedRoute>
            <Enquiries />
          </ProtectedRoute>
        </Route>
        <Route path="/tasks">
          <ProtectedRoute>
            <TaskList />
          </ProtectedRoute>
        </Route>
        <Route path="/calendar">
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes">
          <ProtectedRoute>
            <Recipes />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/recipes-list">
          <ProtectedRoute>
            <RecipesList />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/add-recipe">
          <ProtectedRoute>
            <AddRecipe />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/view/:id">
          <ProtectedRoute>
            <ViewRecipe />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/edit/:id">
          <ProtectedRoute>
            <EditRecipe />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/ingredients-list">
          <ProtectedRoute>
            <IngredientsList />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/supplies-list">
          <ProtectedRoute>
            <SuppliesList />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/master-ingredients">
          <ProtectedRoute>
            <MasterIngredients />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes/bundles">
          <ProtectedRoute>
            <Bundles />
          </ProtectedRoute>
        </Route>
        <Route path="/products">
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        </Route>
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        <Route path="/business-expenses">
          <ProtectedRoute>
            <BusinessExpenses />
          </ProtectedRoute>
        </Route>
        <Route path="/expenses">
          <ProtectedRoute>
            <Expenses />
          </ProtectedRoute>
        </Route>
        <Route path="/income">
          <ProtectedRoute>
            <Income />
          </ProtectedRoute>
        </Route>
        <Route path="/mileage">
          <ProtectedRoute>
            <Mileage />
          </ProtectedRoute>
        </Route>
        <Route path="/printables">
          <ProtectedRoute>
            <Printables />
          </ProtectedRoute>
        </Route>
        <Route path="/tools">
          <ProtectedRoute>
            <Tools />
          </ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        <Route path="/settings/email-templates">
          <ProtectedRoute>
            <EmailTemplates />
          </ProtectedRoute>
        </Route>
        <Route path="/tax-rates">
          <ProtectedRoute>
            <TaxRates />
          </ProtectedRoute>
        </Route>
        <Route path="/account">
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        </Route>
        <Route path="/manage-subscription">
          <ProtectedRoute>
            <ManageSubscription />
          </ProtectedRoute>
        </Route>
        <Route path="/account/subscription">
          <ProtectedRoute>
            <ManageSubscription />
          </ProtectedRoute>
        </Route>
        <Route path="/cancel-subscription">
          <ProtectedRoute>
            <CancelSubscription />
          </ProtectedRoute>
        </Route>
        <Route path="/data">
          <ProtectedRoute>
            <DataImportExport />
          </ProtectedRoute>
        </Route>
        <Route path="/import">
          <ProtectedRoute>
            <Import />
          </ProtectedRoute>
        </Route>
        <Route path="/contacts-import">
          <ProtectedRoute>
            <ContactsImport />
          </ProtectedRoute>
        </Route>
        <Route path="/bake-diary-import">
          <ProtectedRoute>
            <BakeDiaryImport />
          </ProtectedRoute>
        </Route>
        <Route path="/supplies-import">
          <ProtectedRoute>
            <SuppliesImport />
          </ProtectedRoute>
        </Route>
        <Route path="/recipes-import">
          <ProtectedRoute>
            <RecipesImport />
          </ProtectedRoute>
        </Route>
        <Route path="/integrations">
          <ProtectedRoute>
            <Integrations />
          </ProtectedRoute>
        </Route>
        <Route path="/payment-settings">
          <ProtectedRoute>
            <PaymentSettings />
          </ProtectedRoute>
        </Route>
        <Route path="/payment-settings/stripe">
          <ProtectedRoute>
            <StripePaymentProvider />
          </ProtectedRoute>
        </Route>
        <Route path="/payment-settings/square">
          <ProtectedRoute>
            <SquarePaymentProvider />
          </ProtectedRoute>
        </Route>
        <Route path="/payment-settings/tipping">
          <ProtectedRoute>
            <TippingSettings />
          </ProtectedRoute>
        </Route>
        <Route path="/manage-features">
          <ProtectedRoute>
            <ManageFeatures />
          </ProtectedRoute>
        </Route>
        <Route path="/invoice-preview">
          <ProtectedRoute>
            <InvoicePreview />
          </ProtectedRoute>
        </Route>
        <Route path="/payment-success">
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        </Route>
        <Route>
          <ProtectedRoute>
            <NotFound />
          </ProtectedRoute>
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <FeaturesProvider>
            <TrialProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </TrialProvider>
          </FeaturesProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;