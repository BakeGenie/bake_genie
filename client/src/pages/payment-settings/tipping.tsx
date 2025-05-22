import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckIcon, InfoIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

export default function TippingSettings() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Local state
  const [enableTipping, setEnableTipping] = useState(false);
  const [defaultTipPercentages, setDefaultTipPercentages] = useState(["10", "15", "20"]);
  const [customTipAllowed, setCustomTipAllowed] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch tipping settings
  const { data: tippingSettings, isLoading } = useQuery({
    queryKey: ['/api/payment-settings/tipping'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/payment-settings/tipping');
      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setEnableTipping(data.enabled || false);
        setDefaultTipPercentages(data.defaultPercentages || ["10", "15", "20"]);
        setCustomTipAllowed(data.allowCustomTip !== false);
      }
    },
  });
  
  // Update tipping settings
  const { mutate: updateSettings, isPending: isSaving } = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest('POST', '/api/payment-settings/tipping', settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your tipping settings have been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was a problem updating your tipping settings.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSaveSettings = () => {
    // Validate percentages are numbers between 0-100
    const validPercentages = defaultTipPercentages
      .map(p => parseInt(p))
      .filter(p => !isNaN(p) && p >= 0 && p <= 100)
      .map(p => p.toString());
    
    if (validPercentages.length !== defaultTipPercentages.length) {
      toast({
        title: "Invalid Percentages",
        description: "Tip percentages must be numbers between 0 and 100.",
        variant: "destructive",
      });
      return;
    }
    
    // Save settings
    updateSettings({
      enabled: enableTipping,
      defaultPercentages: validPercentages,
      allowCustomTip: customTipAllowed,
    });
  };
  
  // Handle tip percentage changes
  const handleTipPercentageChange = (index: number, value: string) => {
    const newPercentages = [...defaultTipPercentages];
    newPercentages[index] = value;
    setDefaultTipPercentages(newPercentages);
    setIsEditing(true);
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center border-b bg-white p-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setLocation("/payment-settings")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tipping Settings</span>
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Tipping Options</h1>
          <p className="text-gray-600">
            Configure how customers can add tips during checkout.
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Enable Tipping</CardTitle>
                <CardDescription>
                  Allow customers to add a tip during checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-tipping" className="flex items-center gap-2">
                    Enable tipping at checkout
                  </Label>
                  <Switch 
                    id="enable-tipping" 
                    checked={enableTipping}
                    onCheckedChange={(checked) => {
                      setEnableTipping(checked);
                      setIsEditing(true);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {enableTipping && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Default Tip Percentages</CardTitle>
                    <CardDescription>
                      Set the tip percentage options customers will see
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {defaultTipPercentages.map((percentage, index) => (
                          <div key={index} className="space-y-2">
                            <Label htmlFor={`tip-percentage-${index}`}>
                              Option {index + 1}
                            </Label>
                            <div className="relative">
                              <Input
                                id={`tip-percentage-${index}`}
                                value={percentage}
                                onChange={(e) => handleTipPercentageChange(index, e.target.value)}
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-2 text-gray-500">%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <InfoIcon className="h-4 w-4 mr-2" />
                        <span>These options will appear as buttons during checkout</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Custom Tip Amount</CardTitle>
                    <CardDescription>
                      Allow customers to enter their own tip amount
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-tip" className="flex items-center gap-2">
                        Allow custom tip amount
                      </Label>
                      <Switch 
                        id="custom-tip" 
                        checked={customTipAllowed}
                        onCheckedChange={(checked) => {
                          setCustomTipAllowed(checked);
                          setIsEditing(true);
                        }}
                      />
                    </div>
                    {customTipAllowed && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                        <p className="text-sm text-amber-800">
                          Custom tip amounts will be validated to ensure they are reasonable 
                          (less than 100% of the order value).
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/payment-settings")}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSettings}
                disabled={!isEditing || isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="mr-2">Saving...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}