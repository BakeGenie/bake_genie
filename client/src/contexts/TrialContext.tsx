import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface TrialContextType {
  isLoading: boolean;
  isInTrial: boolean;
  trialEnded: boolean;
  hasActiveSubscription: boolean;
  daysLeft: number;
  trialData: any;
}

const TrialContext = createContext<TrialContextType>({
  isLoading: true,
  isInTrial: false,
  trialEnded: false,
  hasActiveSubscription: false,
  daysLeft: 0,
  trialData: null,
});

// Paths that should be accessible even after trial ended
const ALLOWED_PATHS = [
  '/plans',
  '/subscribe',
  '/start-trial',
  '/account',
  '/account/subscription',
  '/manage-subscription',
  '/login',
  '/register',
  '/',
];

export const TrialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useLocation();
  
  // Query to fetch trial status
  const { data: trialData, isLoading } = useQuery({
    queryKey: ['/api/subscription/trial/status'],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });
  
  // Effect to handle redirects based on trial status
  React.useEffect(() => {
    if (trialData?.trialEnded && !trialData?.hasActiveSubscription) {
      const isAllowedPath = ALLOWED_PATHS.some(path => 
        location === path || 
        location.startsWith(path + '/') || 
        location === path + '?'
      );
      
      if (!isAllowedPath) {
        setLocation('/manage-subscription');
      }
    }
  }, [trialData, location, setLocation]);

  const value = {
    isLoading,
    isInTrial: trialData?.isInTrial || false,
    trialEnded: trialData?.trialEnded || false,
    hasActiveSubscription: trialData?.hasActiveSubscription || false,
    daysLeft: trialData?.daysLeft || 0,
    trialData
  };

  return (
    <TrialContext.Provider value={value}>
      {children}
    </TrialContext.Provider>
  );
};

export const useTrial = () => useContext(TrialContext);

export default TrialContext;