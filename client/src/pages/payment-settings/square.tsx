import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function SquarePaymentProvider() {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleConnectWithSquare = () => {
    toast({
      title: "Square Connection",
      description: "This would connect to your Square account. API integration will be implemented."
    });
  };

  const handleRefreshStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Status Refreshed",
        description: "Connection status has been checked."
      });
    }, 1500);
  };

  const handleContactSupport = () => {
    toast({
      title: "Contact Support",
      description: "Opening support contact form."
    });
  };

  return (
    <div className="h-full py-6 px-4 md:px-8">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-gray-600 text-sm">Connect your BakeGenie account with payment services.</p>
      
        <div className="mt-8">
          <div className="flex items-center mb-2">
            <div className="bg-black text-white w-5 h-5 rounded-sm flex items-center justify-center mr-2">
              <span className="font-bold text-xs">□</span>
            </div>
            <h2 className="text-xl font-semibold">Square Payments Integration</h2>
          </div>
          <p className="text-gray-600 text-sm ml-7">Connect your Square account to accept payments through BakeGenie</p>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-4">
          <p className="font-medium text-blue-800">Not Connected</p>
          <p className="text-blue-600 text-sm">Connect your Square account to enable payment processing.</p>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Benefits:</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Accept payments online or in person</li>
            <li>Send digital invoices to customers</li>
            <li>Track payment status for orders</li>
            <li>Manage payment methods securely</li>
          </ul>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleRefreshStatus}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>

          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            onClick={handleConnectWithSquare}
          >
            <div className="bg-white rounded-sm text-black w-5 h-5 flex items-center justify-center">
              <div className="bg-black w-3 h-3"></div>
            </div>
            Connect Square
          </Button>
        </div>

        <div className="mt-12 border-t pt-6">
          <h3 className="font-semibold mb-3">Need Additional Integrations?</h3>
          <p className="text-gray-700 text-sm">
            BakeGenie is constantly evolving to meet your business needs. If you need integration with additional 
            payment processors or business tools, please contact our support team.
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4 flex items-center gap-1"
            onClick={handleContactSupport}
          >
            <ExternalLink className="h-4 w-4" />
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}