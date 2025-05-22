import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, CheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function SquarePaymentProvider() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'loading'>('loading');

  // Get the connection status
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/integrations/square/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/integrations/square/status');
      return response.json();
    },
  });

  // Generate OAuth link for connecting to Square
  const { mutate: generateLink, isPending: isGeneratingLink } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrations/square/connect', {
        redirectUri: `${window.location.origin}/api/integrations/square/callback`
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Square authorization page
      if (data && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Connection Error",
          description: "Unable to generate Square authorization URL",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect with Square",
        variant: "destructive"
      });
    }
  });

  // Disconnect from Square
  const { mutate: disconnect, isPending: isDisconnecting } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/integrations/square/disconnect');
      return response.json();
    },
    onSuccess: () => {
      setConnectionStatus('disconnected');
      toast({
        title: "Disconnected",
        description: "Your Square account has been disconnected successfully."
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Error",
        description: error.message || "Failed to disconnect from Square",
        variant: "destructive"
      });
    }
  });

  // Handle clicking the Connect with Square button
  const handleConnectWithSquare = () => {
    generateLink();
  };
  
  // Update connection status when data is loaded
  useEffect(() => {
    if (!statusLoading && statusData) {
      if (statusData.connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    }
  }, [statusData, statusLoading]);
  
  // Parse URL parameters to show success/error messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success) {
      toast({
        title: "Connection Successful",
        description: "Your Square account has been connected successfully.",
      });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      refetchStatus();
    } else if (error) {
      toast({
        title: "Connection Error",
        description: `Failed to connect: ${error}`,
        variant: "destructive"
      });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, refetchStatus]);

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
          <span>Square Payment Provider</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row">
        {/* Left Column */}
        <div className="md:w-1/3 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold mb-2">Get your Invoices Paid Online</h2>
          <p className="text-gray-600 text-sm">
            BakeGenie has partnered with Square to provide you the easiest way to accept
            payments online.
          </p>
        </div>

        {/* Right Column */}
        <div className="md:w-2/3 bg-white">
          {/* Connect your Square Account */}
          <div className="border-b p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div className="mb-4 md:mb-0 md:pr-8">
                <h3 className="text-lg font-semibold mb-2">Connect your Square Account</h3>
                <p className="text-gray-600 text-sm">
                  Click below to connect your BakeGenie account with Square and start collecting
                  payments for invoices you send via BakeGenie.
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-xl font-bold">□</span>
                </div>
                <div className="absolute bottom-0 right-0 h-6 w-6 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs">🔒</span>
                </div>
              </div>
            </div>
            {connectionStatus === 'disconnected' ? (
              <Button 
                className="bg-gray-900 hover:bg-black transition-colors"
                onClick={handleConnectWithSquare}
                disabled={isGeneratingLink}
              >
                <div className="bg-white rounded-sm text-black w-5 h-5 flex items-center justify-center mr-2">
                  <div className="bg-black w-3 h-3"></div>
                </div>
                {isGeneratingLink ? "Connecting..." : "Connect with Square"}
              </Button>
            ) : connectionStatus === 'connected' ? (
              <div className="space-y-3">
                <div className="flex items-center text-green-600 font-medium">
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Connected to Square
                </div>
                <Button 
                  variant="outline"
                  onClick={() => disconnect()}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect from Square"}
                </Button>
              </div>
            ) : (
              <Button disabled className="bg-gray-900">
                <div className="w-5 h-5 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin" />
                Loading...
              </Button>
            )}
            
            {/* API Key Information */}
            {connectionStatus === 'disconnected' && (
              <Alert className="mt-4 bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">API Keys Required</AlertTitle>
                <AlertDescription className="text-amber-700">
                  Square API keys may be required to complete the connection. If you have trouble connecting, please ensure your Square API keys are properly configured.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Benefits of using Square */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Benefits of using Square</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Get set up in minutes</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Square is supported in a wide range of countries including the US, Canada, Japan, Australia, and the United Kingdom. To find out if your country is supported, please <a href="https://squareup.com/help/us/en/article/5840-square-payment-processing-available-countries" className="text-blue-500 hover:underline">visit here</a>.</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Pricing: Fees may vary but full information can be by visiting <a href="https://squareup.com/us/en/pricing" className="text-blue-500 hover:underline">Square's Fees</a> page</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-gray-700">Payout vary depending on your country. See <a href="https://squareup.com/help/us/en/article/5012-square-instant-deposit" className="text-blue-500 hover:underline">Square Deposit Options</a> for further details.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}