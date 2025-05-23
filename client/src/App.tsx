import React from 'react';
import { Route, Switch } from 'wouter';
import Dashboard from '@/pages/dashboard';
import Calendar from '@/pages/calendar';
import Orders from '@/pages/orders';
import Contacts from '@/pages/contacts';
import Products from '@/pages/products';
import Expenses from '@/pages/expenses';
import DataImportExport from '@/pages/data-import-export';
import Layout from '@/components/enhanced-layout/Layout';
import { useTheme } from '@/contexts/ThemeContext';

function App() {
  const { theme } = useTheme();
  
  return (
    <div className={`app theme-${theme}`}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/orders" component={Orders} />
          <Route path="/contacts" component={Contacts} />
          <Route path="/products" component={Products} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/data-import-export" component={DataImportExport} />
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
      </Layout>
    </div>
  );
}

export default App;