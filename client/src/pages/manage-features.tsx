import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useFeatures, type Feature } from "@/contexts/features-context";
import { apiRequest } from "@/lib/queryClient";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const ManageFeatures = () => {
  const { toast } = useToast();
  const { features, isLoading: featuresLoading } = useFeatures();
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  // Helper to get feature icon
  const getFeatureIcon = (featureId: string) => {
    // You can customize this with more feature-specific icons if needed
    return <Info className="h-4 w-4 text-muted-foreground" />;
  };

  // Function to reset all features to defaults
  const resetFeatures = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/features/reset", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Feature reset failed: ${response.statusText}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/settings/features"] });
      toast({
        title: "Features Reset",
        description: "All features have been reset to their default settings",
      });
    } catch (error) {
      console.error("Error resetting features:", error);
      toast({
        title: "Error",
        description: "Failed to reset features",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Mutation to update a feature
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const response = await fetch(`/api/settings/features/${id}`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) {
        throw new Error(`Feature update failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/features"] });
      toast({
        title: "Feature Updated",
        description: "Feature visibility has been updated",
      });
    },
    onError: (error) => {
      console.error("Error updating feature:", error);
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    },
  });

  // Handle toggle change
  const handleToggleChange = (featureId: string, enabled: boolean) => {
    updateFeatureMutation.mutate({ id: featureId, enabled });
  };

  if (featuresLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Manage Features</h1>
        </div>
        <p>Loading features...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Features</h1>
        <Button 
          variant="outline" 
          onClick={resetFeatures}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
      </div>

      <p className="text-muted-foreground mb-6">
        Toggle features on and off to customize your navigation menu.
        Disabled features will be hidden from the sidebar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Card key={feature.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getFeatureIcon(feature.id)}
                  {feature.name}
                </CardTitle>
                <Switch
                  checked={feature.enabled}
                  onCheckedChange={(checked) => handleToggleChange(feature.id, checked)}
                  disabled={updateFeatureMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent className="pb-3 pt-0">
              <CardDescription>
                {feature.enabled ? "Visible in sidebar" : "Hidden from sidebar"}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ManageFeatures;