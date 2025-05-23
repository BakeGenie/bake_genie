import React from 'react';
import { Route, Switch } from 'wouter';
import Dashboard from '@/pages/dashboard'; 
import Layout from '@/components/enhanced-layout/Layout';
import { useTheme } from '@/contexts/ThemeContext';

function App() {
  const { theme } = useTheme();
  
  return (
    <div className={`app theme-${theme}`}>
      <Layout>
        <Switch>
          <Route path="/" component={Dashboard} />
          {/* Add other routes here as needed */}
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