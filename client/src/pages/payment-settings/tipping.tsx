import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";

export default function TippingSettings() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [enableTipping, setEnableTipping] = useState(false);
  const [defaultTipPercentage, setDefaultTipPercentage] = useState(15);
  const [tipOptions, setTipOptions] = useState("10,15,20");

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your tipping settings have been updated successfully."
    });
  };

  return (
    <div className="container py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => setLocation("/payment-settings")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payment Settings
        </Button>
        <h1 className="text-2xl font-bold">Setup Tipping</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipping Settings</CardTitle>
            <CardDescription>
              Configure how customers can leave tips when paying their invoices online
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base" htmlFor="enable-tipping">Enable Tipping</Label>
                <p className="text-sm text-muted-foreground">Allow customers to add a tip when paying online</p>
              </div>
              <Switch 
                id="enable-tipping" 
                checked={enableTipping} 
                onCheckedChange={setEnableTipping} 
              />
            </div>

            {enableTipping && (
              <>
                <div className="border-t pt-4">
                  <Label className="mb-2 block">Default Tip Percentage</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[defaultTipPercentage]}
                      onValueChange={(values) => setDefaultTipPercentage(values[0])}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <div className="w-16 text-center font-medium">{defaultTipPercentage}%</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label htmlFor="tip-options" className="mb-2 block">Tip Percentage Options</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Enter percentage values separated by commas (e.g., 10,15,20)
                  </p>
                  <Input 
                    id="tip-options" 
                    value={tipOptions} 
                    onChange={(e) => setTipOptions(e.target.value)} 
                    placeholder="10,15,20" 
                  />
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSave}>Save Tipping Settings</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipping Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Offer reasonable tip percentages that make sense for your business and product prices</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Make sure your default tip amount is in the middle of your options to give customers a fair choice</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>Consider your products and services when setting tip values - delivery services may warrant higher tips than simple pickups</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}