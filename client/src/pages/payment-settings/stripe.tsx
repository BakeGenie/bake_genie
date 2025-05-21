import React from "react";
import { Button } from "@/components/ui/button";
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
          <span>Stripe Payment Provider</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row">
        {/* Left Column */}
        <div className="md:w-1/3 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold mb-2">Get your Invoices Paid Online</h2>
          <p className="text-gray-600 text-sm">
            BakeGenie has partnered with Stripe to provide you the easiest way to accept
            payments online.
          </p>
        </div>

        {/* Right Column */}
        <div className="md:w-2/3 bg-white">
          {/* Connect your Stripe Account */}
          <div className="border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="mb-4 md:mb-0 md:pr-8">
                <h3 className="text-lg font-semibold mb-2">Connect your Stripe Account</h3>
                <p className="text-gray-600 text-sm">
                  Click below to connect your BakeGenie account with Stripe and start collecting
                  payments for invoices you send via BakeGenie.
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">S</span>
                </div>
                <div className="absolute bottom-0 right-0 h-6 w-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">🔒</span>
                </div>
              </div>
            </div>
            <Button 
              className="bg-blue-500 hover:bg-blue-600 transition-colors"
              onClick={handleConnectWithStripe}
            >
              <span className="text-white mr-2">$</span>
              Connect with Stripe
            </Button>
          </div>

          {/* Benefits of using Stripe */}
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold mb-4">Benefits of using Stripe</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">No setup fees, no monthly fees, no hidden fees</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Get set up in minutes</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Supported in 26 countries. See <a href="https://stripe.com/global" className="text-blue-500 hover:underline">full country list</a> here</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Pricing: European issued cards 1.4% + 25c • Non-European issued cards 2.9% + 25c<br />
                <span className="text-gray-500 text-sm">(Pricing for other countries may vary slightly)</span></span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Payout vary depending on your country. See <a href="https://stripe.com/docs/payouts" className="text-blue-500 hover:underline">Payout Schedule</a> for further details.</span>
              </li>
            </ul>
          </div>

          {/* What is Stripe */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">What is Stripe</h3>
            <p className="text-gray-700">
              Stripe is an American technology company operating in over 26 countries that allows both private 
              individuals and businesses to accept payments over the Internet. 
              <a href="https://stripe.com/about" className="text-blue-500 hover:underline ml-1">Find out more</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}