import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckIcon, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function StripePaymentProvider() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');
  
  // Get the connection status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/integrations/stripe/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/stripe/status');
      return response.json();
    },
    enabled: !!process.env.STRIPE_SECRET_KEY,
  });

  // Generate OAuth link for connecting to Stripe
  const { mutate: generateLink, isPending: isGeneratingLink } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrations/stripe/connect', {
        redirectUri: `${window.location.origin}/api/integrations/stripe/callback` 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Redirect to Stripe OAuth URL
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to connect with Stripe",
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to connect with Stripe. Please try again later.",
        variant: "destructive"
      });
    }
  });

  // Disconnect from Stripe
  const { mutate: disconnectStripe, isPending: isDisconnecting } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrations/stripe/disconnect');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Your Stripe account has been disconnected successfully"
      });
      setConnectionStatus('disconnected');
      refetchStatus();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect Stripe account",
        variant: "destructive"
      });
    }
  });

  // Handle clicking the Connect with Stripe button
  const handleConnectWithStripe = () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      toast({
        title: "Configuration Missing",
        description: "Stripe API keys need to be configured first.",
        variant: "destructive"
      });
      return;
    }
    generateLink();
  };

  // Update connection status when data is loaded
  useEffect(() => {
    if (!statusLoading && statusData) {
      setConnectionStatus(statusData.connected ? 'connected' : 'disconnected');
    }
  }, [statusData, statusLoading]);

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
                  {connectionStatus === 'connected' 
                    ? "Your Stripe account is connected and ready to accept payments."
                    : "Click below to connect your BakeGenie account with Stripe and start collecting payments for invoices you send via BakeGenie."}
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
            
            {statusLoading ? (
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-10 w-40" />
              </div>
            ) : connectionStatus === 'disconnected' ? (
              <Button 
                className="bg-blue-500 hover:bg-blue-600 transition-colors"
                onClick={handleConnectWithStripe}
                disabled={isGeneratingLink || !process.env.STRIPE_SECRET_KEY}
              >
                <span className="text-white mr-2">$</span>
                {isGeneratingLink ? "Connecting..." : "Connect with Stripe"}
              </Button>
            ) : (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Stripe Connected</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your Stripe account is successfully connected to BakeGenie.
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => disconnectStripe()}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect Stripe Account"}
                </Button>
              </div>
            )}
            
            {/* Missing API Key Warning */}
            {!process.env.STRIPE_SECRET_KEY && (
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">API Keys Required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Stripe API keys are required to complete the connection. Please contact your administrator to set up the Stripe API keys.
                </AlertDescription>
              </Alert>
            )}
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