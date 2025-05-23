import React from 'react';
import { Route, Switch } from 'wouter';
import Dashboard from '@/pages/dashboard';
import Calendar from '@/pages/calendar-combined';
import Orders from '@/pages/orders';
import Contacts from '@/pages/contacts';
import Products from '@/pages/products';
import Expenses from '@/pages/expenses';
import DataImportExport from '@/pages/data-import-export';
import TaskList from '@/pages/task-list';
import Recipes from '@/pages/recipes';
import Reports from '@/pages/reports';
import Enquiries from '@/pages/enquiries';
import Printables from '@/pages/printables';
import TaxRates from '@/pages/tax-rates';

// Import the navbar component directly
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <div className="app">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/orders" component={Orders} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/products" component={Products} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/data-import-export" component={DataImportExport} />
            <Route path="/tasks" component={TaskList} />
            <Route path="/recipes" component={Recipes} />
            <Route path="/reports" component={Reports} />
            <Route path="/enquiries" component={Enquiries} />
            <Route path="/printables" component={Printables} />
            <Route path="/tax-rates" component={TaxRates} />
            {/* Fallback route for 404 */}
            <Route>
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-primary mb-4">404 - Page Not Found</h1>
                  <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
                </div>
              </div>
            </Route>
          </Switch>
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;