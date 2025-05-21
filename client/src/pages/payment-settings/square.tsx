import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function SquarePaymentProvider() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleConnectWithSquare = () => {
    toast({
      title: "Square Connection",
      description: "This would connect to your Square account. API integration will be implemented."
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
        <h1 className="text-2xl font-bold">Square Payment Provider</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Get your Invoices Paid Online</CardTitle>
              <CardDescription>
                BakeGenie has partnered with Square to provide you the easiest way to accept payments online.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Connect your Square Account
                <div className="h-10 w-10 rounded-full bg-gray-100 p-2">
                  <div className="bg-black w-6 h-6 rounded-md flex items-center justify-center mx-auto">
                    <div className="bg-white w-3 h-3"></div>
                  </div>
                </div>
              </CardTitle>
              <CardDescription>
                Click below to connect your BakeGenie account with Square and start collecting
                payments for invoices you send via BakeGenie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="bg-black hover:bg-gray-800 transition-colors flex items-center gap-2"
                onClick={handleConnectWithSquare}
              >
                <div className="bg-white rounded text-black w-6 h-6 flex items-center justify-center">
                  <div className="bg-black w-3 h-3"></div>
                </div>
                Connect with Square
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefits of using Square</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Get set up in minutes</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Square is supported in a wide range of countries including the US, Canada, Japan, Australia, and the United Kingdom. To find out if your country is supported, please <a href="https://squareup.com/help/us/en/article/5840-square-payment-processing-available-countries" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">visit here</a>.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Pricing: Fees may vary but full information can be by visiting <a href="https://squareup.com/us/en/pricing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Square's Fees</a> page</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Payout vary depending on your country. See <a href="https://squareup.com/help/us/en/article/5012-square-instant-deposit" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Square Deposit Options</a> for further details.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}