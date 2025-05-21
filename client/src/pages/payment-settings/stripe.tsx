import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function StripePaymentProvider() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleConnectWithStripe = () => {
    toast({
      title: "Stripe Connection",
      description: "This would connect to your Stripe account. API integration will be implemented."
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
        <h1 className="text-2xl font-bold">Stripe Payment Provider</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Get your Invoices Paid Online</CardTitle>
              <CardDescription>
                BakeGenie has partnered with Stripe to provide you the easiest way to accept payments online.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Connect your Stripe Account
                <div className="h-10 w-10 rounded-full bg-blue-100 p-2">
                  <div className="text-blue-600 font-bold text-xl flex items-center justify-center">S</div>
                </div>
              </CardTitle>
              <CardDescription>
                Click below to connect your BakeGenie account with Stripe and start collecting
                payments for invoices you send via BakeGenie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2"
                onClick={handleConnectWithStripe}
              >
                <div className="bg-white rounded text-blue-600 w-6 h-6 flex items-center justify-center font-bold text-lg">S</div>
                Connect with Stripe
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Benefits of using Stripe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>No setup fees, no monthly fees, no hidden fees</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Get set up in minutes</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Supported in 26 countries. See <a href="https://stripe.com/global" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">full country list</a> here.</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Pricing: European issued cards 1.4% + 25¢ • Non-European issued cards 2.9% + 25¢ <br />
                <span className="text-sm text-muted-foreground">(Pricing for other countries may vary slightly)</span></p>
              </div>
              <div className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Payout vary depending on your country. See <a href="https://stripe.com/docs/payouts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Payout Schedule</a> for further details.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start border-t pt-4">
              <h3 className="font-medium mb-2">What is Stripe</h3>
              <p className="text-muted-foreground">
                Stripe is an American technology company operating in over 26 countries that allows both private individuals and businesses to accept payments over the Internet. <a href="https://stripe.com/about" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Find out more</a>.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}