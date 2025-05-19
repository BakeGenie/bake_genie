import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  X 
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { SiSquare } from "react-icons/si";

export default function IntegrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Square integration
  const { 
    data: squareStatus,
    isLoading: isLoadingSquare,
    refetch: refetchSquareStatus
  } = useQuery({
    queryKey: ['api/square/status'],
    retry: false
  });

  // Square connect mutation
  const squareConnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/square/auth');
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to get authorization URL",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to connect to Square",
        variant: "destructive",
      });
    }
  });

  // Square disconnect mutation
  const squareDisconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/square/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/square/status'] });
      toast({
        title: "Success",
        description: "Successfully disconnected from Square",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect from Square",
        variant: "destructive",
      });
    }
  });

  // Square connection handlers
  const handleConnectSquare = () => {
    squareConnectMutation.mutate();
  };

  const handleDisconnectSquare = () => {
    squareDisconnectMutation.mutate();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your BakeGenie account with payment services
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SiSquare className="h-5 w-5" />
            Square Payments Integration
          </CardTitle>
          <CardDescription>
            Connect your Square account to accept payments through BakeGenie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSquare ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : squareStatus?.connected ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Connected</AlertTitle>
                <AlertDescription>
                  Your Square account is connected to BakeGenie.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <h3 className="font-medium text-lg mb-2">Connected Features:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Accept credit card payments</li>
                  <li>Process refunds</li>
                  <li>View transaction history</li>
                  <li>Generate payment receipts</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTitle className="text-blue-600">Not Connected</AlertTitle>
                <AlertDescription>
                  Connect your Square account to enable payment processing.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4">
                <h3 className="font-medium text-lg mb-2">Benefits:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Accept payments online or in person</li>
                  <li>Send digital invoices to customers</li>
                  <li>Track payment status for orders</li>
                  <li>Manage payment methods securely</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => refetchSquareStatus()}
            disabled={isLoadingSquare}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          
          {squareStatus?.connected ? (
            <Button 
              variant="destructive"
              onClick={handleDisconnectSquare}
              disabled={squareDisconnectMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Disconnect Square
            </Button>
          ) : (
            <Button 
              onClick={handleConnectSquare}
              disabled={squareConnectMutation.isPending}
            >
              <SiSquare className="h-4 w-4 mr-2" />
              Connect Square
            </Button>
          )}
        </CardFooter>
      </Card>

      <div className="bg-gray-50 border rounded-lg p-6 mt-8">
        <h2 className="text-xl font-medium mb-3">Need Additional Integrations?</h2>
        <p className="text-muted-foreground">
          BakeGenie is constantly evolving to meet your business needs. If you need integration with 
          additional payment processors or business tools, please contact our support team.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => window.open('/help', '_blank')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      </div>
    </div>
  );
}