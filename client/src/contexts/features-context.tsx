import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Feature {
  id: string;
  name: string;
  enabled: boolean;
}

interface FeaturesContextType {
  features: Feature[];
  isFeatureEnabled: (featureId: string) => boolean;
  isLoading: boolean;
  error: Error | null;
}

// Create the context with default values
const FeaturesContext = createContext<FeaturesContextType>({
  features: [],
  isFeatureEnabled: () => true, // Default to showing all features
  isLoading: true,
  error: null
});

// Default features to use as fallback if API call fails
const defaultFeatures: Feature[] = [
  { id: 'dashboard', name: 'Dashboard', enabled: true },
  { id: 'orders', name: 'Orders & Quotes', enabled: true },
  { id: 'contacts', name: 'Contacts', enabled: true },
  { id: 'enquiries', name: 'Enquiries', enabled: true },
  { id: 'tasks', name: 'Task List', enabled: true },
  { id: 'calendar', name: 'Calendar', enabled: true },
  { id: 'recipes', name: 'Recipes & Ingredients', enabled: true },
  { id: 'products', name: 'Products', enabled: true },
  { id: 'reports', name: 'Reports & Lists', enabled: true },
  { id: 'expenses', name: 'Expenses & Mileage', enabled: true },
  { id: 'tools', name: 'Tools', enabled: true },
  { id: 'integrations', name: 'Integrations', enabled: true },
  { id: 'settings', name: 'Settings', enabled: true },
];

interface FeaturesProviderProps {
  children: ReactNode;
}

export const FeaturesProvider = ({ children }: FeaturesProviderProps) => {
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to check if a feature is enabled
  const isFeatureEnabled = (featureId: string): boolean => {
    // Always enable these critical features
    if (featureId === 'settings') return true;
    
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.enabled : true;
  };

  // Fetch features on initial load
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings/features');
        
        if (!response.ok) {
          throw new Error('Failed to fetch features');
        }
        
        const data = await response.json();
        setFeatures(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching features:', err);
        setError(err instanceof Error ? err : new Error('An unknown error occurred'));
        // Use default features if API call fails
        setFeatures(defaultFeatures);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  return (
    <FeaturesContext.Provider value={{ features, isFeatureEnabled, isLoading, error }}>
      {children}
    </FeaturesContext.Provider>
  );
};

// Custom hook to use the features context
export const useFeatures = () => useContext(FeaturesContext);