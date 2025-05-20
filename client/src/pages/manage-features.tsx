import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import PageHeader from '@/components/ui/page-header';
import { Loader } from 'lucide-react';

// Define the feature item type
interface Feature {
  id: string;
  name: string;
  enabled: boolean;
}

export default function ManageFeaturesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default features list in case the API fails
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
  
  // State to handle fallback if API fails
  const [fallbackFeatures, setFallbackFeatures] = useState<Feature[]>(defaultFeatures);
  
  // Fetch features from the API
  const { data: featuresData, isLoading } = useQuery<Feature[]>({
    queryKey: ['/api/settings/features'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/settings/features');
        if (!response.ok) {
          throw new Error('Failed to fetch features');
        }
        return await response.json();
      } catch (error) {
        // If the API fails, use the fallback features
        setFallbackFeatures(defaultFeatures);
        throw error;
      }
    },
    // If there's an error, it will be caught by the error boundary
  });
  
  // Use either the API data or fallback features
  const features = featuresData || fallbackFeatures;

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await fetch(`/api/settings/features/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update feature');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/features'] });
      toast({
        title: 'Features updated',
        description: 'Your feature settings have been saved.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update feature. ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Toggle feature handler
  const handleToggleFeature = (id: string, enabled: boolean) => {
    // Also update the fallback features immediately for better UX if the API fails
    setFallbackFeatures(prev => 
      prev.map(feature => 
        feature.id === id ? { ...feature, enabled } : feature
      )
    );
    
    updateFeatureMutation.mutate({ id, enabled });
  };

  // Function to reset features to defaults
  const handleResetToDefaults = async () => {
    try {
      const response = await fetch('/api/settings/features/reset', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset features');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/settings/features'] });
      
      toast({
        title: 'Features reset',
        description: 'Your features have been reset to defaults.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset features.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader title="Choose your Features" />
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Features</CardTitle>
          <CardDescription>
            Customize your BakeGenie experience by enabling/disabling current features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {features?.map((feature: Feature) => (
                <div key={feature.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="font-medium">{feature.name}</div>
                    <div className="flex items-center">
                      <Switch
                        checked={feature.enabled}
                        onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                      />
                      <span className="ml-2 text-sm text-muted-foreground">
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}