import React from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRightIcon } from "lucide-react";

export default function PaymentSettings() {
  const [_, setLocation] = useLocation();

  return (
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Receive Payments & Integration</h1>
          <p className="text-muted-foreground">
            Add a Payment Provider to allow your customers to pay through BakeGenie.
          </p>
        </div>
      </div>

      <div className="grid gap-2 mt-4">
        <Card 
          className="hover:border-primary/50 transition-colors cursor-pointer" 
          onClick={() => setLocation("/payment-settings/stripe")}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white w-6 h-6 rounded-sm flex items-center justify-center">
                <span className="font-bold">S</span>
              </div>
              <CardTitle className="text-base font-medium">Stripe Payments</CardTitle>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card 
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setLocation("/payment-settings/square")}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-black text-white w-6 h-6 rounded-sm flex items-center justify-center">
                <span className="font-bold">□</span>
              </div>
              <CardTitle className="text-base font-medium">Square Payments</CardTitle>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>

        <Card 
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setLocation("/payment-settings/tipping")}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 text-white w-6 h-6 rounded-sm flex items-center justify-center">
                <span className="font-bold">$</span>
              </div>
              <CardTitle className="text-base font-medium">Setup Tipping</CardTitle>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}