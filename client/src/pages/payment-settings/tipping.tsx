import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center border-b bg-white p-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => setLocation("/integrations")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Setup Tipping</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row">
        {/* Left Column */}
        <div className="md:w-1/3 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold mb-2">Configure Customer Tipping</h2>
          <p className="text-gray-600 text-sm">
            Allow your customers to add tips when they pay for their orders online through BakeGenie.
          </p>
        </div>

        {/* Right Column */}
        <div className="md:w-2/3 bg-white">
          {/* Tipping Settings */}
          <div className="border-b p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Enable Tipping</h3>
                <p className="text-gray-600 text-sm">
                  Allow customers to add a tip when paying online
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">$</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <Label className="text-base" htmlFor="enable-tipping">Enable Tipping Feature</Label>
              <Switch 
                id="enable-tipping" 
                checked={enableTipping} 
                onCheckedChange={setEnableTipping} 
              />
            </div>

            {enableTipping && (
              <>
                <div className="border-t pt-4 mb-4">
                  <Label className="mb-2 block font-medium">Default Tip Percentage</Label>
                  <div className="flex items-center gap-4 mt-2">
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
                  <Label htmlFor="tip-options" className="mb-2 block font-medium">Tip Percentage Options</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Enter percentage values separated by commas (e.g., 10,15,20)
                  </p>
                  <Input 
                    id="tip-options" 
                    value={tipOptions} 
                    onChange={(e) => setTipOptions(e.target.value)} 
                    placeholder="10,15,20" 
                    className="max-w-xs"
                  />
                </div>
              </>
            )}

            <div className="mt-6">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save Tipping Settings
              </Button>
            </div>
          </div>

          {/* Tipping Best Practices */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tipping Best Practices</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Offer reasonable tip percentages that make sense for your business and product prices</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Make sure your default tip amount is in the middle of your options to give customers a fair choice</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Consider your products and services when setting tip values - delivery services may warrant higher tips than simple pickups</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}