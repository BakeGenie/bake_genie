import React, { useState } from "react";
import { AppLayout } from "@/layouts/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";

interface ImportResult {
  success: boolean;
  message: string;
  processedRows: number;
  skippedRows: number;
  errors?: string[];
}

export default function ImportPage() {
  const { toast } = useToast();
  const [selectedOrderListFile, setSelectedOrderListFile] = useState<File | null>(null);
  const [selectedQuoteListFile, setSelectedQuoteListFile] = useState<File | null>(null);
  const [selectedOrderItemsFile, setSelectedOrderItemsFile] = useState<File | null>(null);

  // Mutation for importing order list
  const importOrdersMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<ImportResult>("/api/import/orders", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Orders imported successfully",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Import failed",
          description: data.message,
          variant: "destructive",
        });
      }
      setSelectedOrderListFile(null);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: `Error importing orders: ${error}`,
        variant: "destructive",
      });
      setSelectedOrderListFile(null);
    },
  });

  // Mutation for importing quote list
  const importQuotesMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<ImportResult>("/api/import/quotes", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Quotes imported successfully",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Import failed",
          description: data.message,
          variant: "destructive",
        });
      }
      setSelectedQuoteListFile(null);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: `Error importing quotes: ${error}`,
        variant: "destructive",
      });
      setSelectedQuoteListFile(null);
    },
  });

  // Mutation for importing order items
  const importOrderItemsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<ImportResult>("/api/import/order-items", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Order items imported successfully",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Import failed",
          description: data.message,
          variant: "destructive",
        });
      }
      setSelectedOrderItemsFile(null);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: `Error importing order items: ${error}`,
        variant: "destructive",
      });
      setSelectedOrderItemsFile(null);
    },
  });

  // Handle file selection for order list
  const handleOrderListFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedOrderListFile(file);
  };

  // Handle file selection for quote list
  const handleQuoteListFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedQuoteListFile(file);
  };

  // Handle file selection for order items
  const handleOrderItemsFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedOrderItemsFile(file);
  };

  // Handle order list import
  const handleImportOrderList = () => {
    if (selectedOrderListFile) {
      importOrdersMutation.mutate(selectedOrderListFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
    }
  };

  // Handle quote list import
  const handleImportQuoteList = () => {
    if (selectedQuoteListFile) {
      importQuotesMutation.mutate(selectedQuoteListFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
    }
  };

  // Handle order items import
  const handleImportOrderItems = () => {
    if (selectedOrderItemsFile) {
      importOrderItemsMutation.mutate(selectedOrderItemsFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Import Data from Bake Diary</h1>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Please make sure your CSV files are exported from Bake Diary in the correct format.
            The import process will create new contacts, orders, and quotes in your BakeGenie account.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="order-items">Order Items</TabsTrigger>
          </TabsList>

          {/* Orders Import Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Import Orders from Bake Diary</CardTitle>
                <CardDescription>
                  Upload your Orders CSV file exported from Bake Diary. This will create new orders and contacts in BakeGenie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="order-list-file">Select Orders CSV File</Label>
                    <div className="flex gap-3">
                      <Input 
                        id="order-list-file" 
                        type="file" 
                        accept=".csv" 
                        onChange={handleOrderListFileChange}
                        disabled={importOrdersMutation.isPending}
                      />
                      <Button 
                        onClick={handleImportOrderList}
                        disabled={!selectedOrderListFile || importOrdersMutation.isPending}
                      >
                        {importOrdersMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FileUp className="mr-2 h-4 w-4" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                    {selectedOrderListFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {selectedOrderListFile.name}
                      </p>
                    )}
                  </div>

                  {importOrdersMutation.isSuccess && importOrdersMutation.data.success && (
                    <Alert variant="success">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Import Successful</AlertTitle>
                      <AlertDescription>
                        Successfully imported {importOrdersMutation.data.processedRows} orders
                        {importOrdersMutation.data.skippedRows > 0 && 
                          ` (${importOrdersMutation.data.skippedRows} skipped)`
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {importOrdersMutation.isSuccess && !importOrdersMutation.data.success && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>
                        {importOrdersMutation.data.message}
                        {importOrdersMutation.data.errors && importOrdersMutation.data.errors.length > 0 && (
                          <ul className="mt-2 list-disc pl-5 text-sm">
                            {importOrdersMutation.data.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importOrdersMutation.data.errors.length > 5 && (
                              <li>...and {importOrdersMutation.data.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotes Import Tab */}
          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle>Import Quotes from Bake Diary</CardTitle>
                <CardDescription>
                  Upload your Quotes CSV file exported from Bake Diary. This will create new quotes and contacts in BakeGenie.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="quote-list-file">Select Quotes CSV File</Label>
                    <div className="flex gap-3">
                      <Input 
                        id="quote-list-file" 
                        type="file" 
                        accept=".csv" 
                        onChange={handleQuoteListFileChange}
                        disabled={importQuotesMutation.isPending}
                      />
                      <Button 
                        onClick={handleImportQuoteList}
                        disabled={!selectedQuoteListFile || importQuotesMutation.isPending}
                      >
                        {importQuotesMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FileUp className="mr-2 h-4 w-4" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                    {selectedQuoteListFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {selectedQuoteListFile.name}
                      </p>
                    )}
                  </div>

                  {importQuotesMutation.isSuccess && importQuotesMutation.data.success && (
                    <Alert variant="success">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Import Successful</AlertTitle>
                      <AlertDescription>
                        Successfully imported {importQuotesMutation.data.processedRows} quotes
                        {importQuotesMutation.data.skippedRows > 0 && 
                          ` (${importQuotesMutation.data.skippedRows} skipped)`
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {importQuotesMutation.isSuccess && !importQuotesMutation.data.success && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>
                        {importQuotesMutation.data.message}
                        {importQuotesMutation.data.errors && importQuotesMutation.data.errors.length > 0 && (
                          <ul className="mt-2 list-disc pl-5 text-sm">
                            {importQuotesMutation.data.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importQuotesMutation.data.errors.length > 5 && (
                              <li>...and {importQuotesMutation.data.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Items Import Tab */}
          <TabsContent value="order-items">
            <Card>
              <CardHeader>
                <CardTitle>Import Order Items from Bake Diary</CardTitle>
                <CardDescription>
                  Upload your Order Items CSV file exported from Bake Diary. This will add items to existing orders.
                  Make sure to import your orders first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="order-items-file">Select Order Items CSV File</Label>
                    <div className="flex gap-3">
                      <Input 
                        id="order-items-file" 
                        type="file" 
                        accept=".csv" 
                        onChange={handleOrderItemsFileChange}
                        disabled={importOrderItemsMutation.isPending}
                      />
                      <Button 
                        onClick={handleImportOrderItems}
                        disabled={!selectedOrderItemsFile || importOrderItemsMutation.isPending}
                      >
                        {importOrderItemsMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FileUp className="mr-2 h-4 w-4" />
                            Import
                          </>
                        )}
                      </Button>
                    </div>
                    {selectedOrderItemsFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected file: {selectedOrderItemsFile.name}
                      </p>
                    )}
                  </div>

                  {importOrderItemsMutation.isSuccess && importOrderItemsMutation.data.success && (
                    <Alert variant="success">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle>Import Successful</AlertTitle>
                      <AlertDescription>
                        Successfully imported {importOrderItemsMutation.data.processedRows} order items
                        {importOrderItemsMutation.data.skippedRows > 0 && 
                          ` (${importOrderItemsMutation.data.skippedRows} skipped)`
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {importOrderItemsMutation.isSuccess && !importOrderItemsMutation.data.success && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Failed</AlertTitle>
                      <AlertDescription>
                        {importOrderItemsMutation.data.message}
                        {importOrderItemsMutation.data.errors && importOrderItemsMutation.data.errors.length > 0 && (
                          <ul className="mt-2 list-disc pl-5 text-sm">
                            {importOrderItemsMutation.data.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importOrderItemsMutation.data.errors.length > 5 && (
                              <li>...and {importOrderItemsMutation.data.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}