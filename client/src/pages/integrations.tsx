import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertCircle, 
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
import { 
  SiSquare, 
  SiXero 
} from "react-icons/si";

export default function IntegrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("square");

  // Square integration
  const { 
    data: squareStatus,
    isLoading: isLoadingSquare,
    isError: isSquareError,
    refetch: refetchSquareStatus
  } = useQuery({
    queryKey: ['api/square/status'],
    retry: false
  });

  // Xero integration
  const { 
    data: xeroStatus,
    isLoading: isLoadingXero,
    isError: isXeroError,
    refetch: refetchXeroStatus
  } = useQuery({
    queryKey: ['api/xero/status'],
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

  // Xero connect mutation
  const xeroConnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/xero/auth');
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
        description: "Failed to connect to Xero",
        variant: "destructive",
      });
    }
  });

  // Xero disconnect mutation
  const xeroDisconnectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/xero/disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api/xero/status'] });
      toast({
        title: "Success",
        description: "Successfully disconnected from Xero",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disconnect from Xero",
        variant: "destructive",
      });
    }
  });

  // Xero sync orders mutation
  const xeroSyncOrdersMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/xero/sync/orders');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully synced orders to Xero",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync orders to Xero",
        variant: "destructive",
      });
    }
  });

  // Xero sync contacts mutation
  const xeroSyncContactsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/xero/sync/contacts');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully synced contacts to Xero",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to sync contacts to Xero",
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

  // Xero connection handlers
  const handleConnectXero = () => {
    xeroConnectMutation.mutate();
  };

  const handleDisconnectXero = () => {
    xeroDisconnectMutation.mutate();
  };

  // Xero sync handlers
  const handleSyncOrdersToXero = () => {
    xeroSyncOrdersMutation.mutate();
  };

  const handleSyncContactsToXero = () => {
    xeroSyncContactsMutation.mutate();
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your CakeHub account with other services
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="square" className="flex items-center gap-2">
            <SiSquare className="h-4 w-4" />
            Square Payments
          </TabsTrigger>
          <TabsTrigger value="xero" className="flex items-center gap-2">
            <SiXero className="h-4 w-4" />
            Xero Accounting
          </TabsTrigger>
        </TabsList>

        {/* Square Integration Tab */}
        <TabsContent value="square">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SiSquare className="h-5 w-5" />
                Square Payments Integration
              </CardTitle>
              <CardDescription>
                Connect your Square account to accept payments through CakeHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSquare ? (
                <div className="flex items-center justify-center p-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isSquareError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch Square connection status. Please try again.
                  </AlertDescription>
                </Alert>
              ) : squareStatus?.connected ? (
                <div className="space-y-4">
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Connected</AlertTitle>
                    <AlertDescription>
                      Your Square account is connected to CakeHub.
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
                  <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
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
        </TabsContent>

        {/* Xero Integration Tab */}
        <TabsContent value="xero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SiXero className="h-5 w-5" />
                Xero Accounting Integration
              </CardTitle>
              <CardDescription>
                Connect your Xero account to sync financial data with CakeHub
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingXero ? (
                <div className="flex items-center justify-center p-6">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : isXeroError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to fetch Xero connection status. Please try again.
                  </AlertDescription>
                </Alert>
              ) : xeroStatus?.connected ? (
                <div className="space-y-4">
                  <Alert variant="success" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Connected</AlertTitle>
                    <AlertDescription>
                      Your Xero account is connected to CakeHub.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4">
                    <h3 className="font-medium text-lg mb-2">Available Actions:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Button
                        variant="outline"
                        onClick={handleSyncOrdersToXero}
                        disabled={xeroSyncOrdersMutation.isPending}
                        className="h-auto py-3 flex flex-col items-center justify-center gap-1"
                      >
                        <div className="font-medium">Sync Orders to Xero</div>
                        <div className="text-xs text-muted-foreground">
                          Create invoices from your CakeHub orders
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handleSyncContactsToXero}
                        disabled={xeroSyncContactsMutation.isPending}
                        className="h-auto py-3 flex flex-col items-center justify-center gap-1"
                      >
                        <div className="font-medium">Sync Contacts to Xero</div>
                        <div className="text-xs text-muted-foreground">
                          Create contacts from your CakeHub customers
                        </div>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-medium text-lg mb-2">Connected Features:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Sync orders as invoices</li>
                      <li>Sync customers as contacts</li>
                      <li>Track payment status</li>
                      <li>Manage financial records</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="default" className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-600">Not Connected</AlertTitle>
                    <AlertDescription>
                      Connect your Xero account to enable financial data synchronization.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4">
                    <h3 className="font-medium text-lg mb-2">Benefits:</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Automatically sync orders as invoices</li>
                      <li>Keep your accounting records up-to-date</li>
                      <li>Sync customer information</li>
                      <li>Simplify tax filing and financial reporting</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => refetchXeroStatus()}
                disabled={isLoadingXero}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              
              {xeroStatus?.connected ? (
                <Button 
                  variant="destructive"
                  onClick={handleDisconnectXero}
                  disabled={xeroDisconnectMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Disconnect Xero
                </Button>
              ) : (
                <Button 
                  onClick={handleConnectXero}
                  disabled={xeroConnectMutation.isPending}
                >
                  <SiXero className="h-4 w-4 mr-2" />
                  Connect Xero
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}