import React, { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, AlertCircle, CheckCircle2, Upload, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function OrderItemsImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [mappings, setMappings] = useState({
    "created_at": "Date Created",
    "order_id": "Order Number",
    "contact_item": "Contact Item",
    "description": "Details",
    "serving": "Servings",
    "labour": "Labour",
    "hours": "Hours",
    "overhead": "Overhead", 
    "recipes": "Recipes",
    "cost_price": "Cost Price",
    "sell_price": "Sell Price (excl VAT)"
  });

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Update mapping for a field
  const handleMappingChange = (field: string, value: string) => {
    setMappings({
      ...mappings,
      [field]: value
    });
  };

  // Submit the import
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mappings", JSON.stringify(mappings));
    formData.append("defaultsForMissing", "true");
    
    try {
      setUploadProgress(30);
      
      const response = await fetch("/api/order-items/import", {
        method: "POST",
        body: formData,
      });
      
      setUploadProgress(70);
      
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      setUploadProgress(100);
      
      if (data.success) {
        toast({
          title: "Import successful",
          description: data.message || `Successfully imported ${data.inserted} order items`,
        });
      } else {
        toast({
          title: "Import issues",
          description: data.error || "There were issues with your import",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    setResult(null);
    setUploadProgress(0);
    
    // Reset mappings to default
    setMappings({
      "created_at": "Date Created",
      "order_id": "Order Number",
      "contact_item": "Contact Item",
      "description": "Details",
      "serving": "Servings",
      "labour": "Labour",
      "hours": "Hours",
      "overhead": "Overhead", 
      "recipes": "Recipes",
      "cost_price": "Cost Price",
      "sell_price": "Sell Price (excl VAT)"
    });
  };

  return (
    <div className="bg-[#171923] min-h-screen text-white">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Import Order Items</h1>
            <p className="text-gray-400">
              Import order items from a CSV file with custom field mapping
            </p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/data")} className="text-white border-gray-600 hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Data Management
          </Button>
        </div>

        <Card className="bg-[#1A202C] border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-white">Import Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <p className="mb-2">Please follow these steps to import your order items:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Ensure your CSV file has headers matching the default mappings shown below</li>
              <li>If your CSV uses different header names, adjust the mappings accordingly</li>
              <li>Click "Upload &amp; Import" to process your data</li>
            </ol>
            <div className="mt-4 p-3 bg-[#2D3748] rounded-md">
              <h3 className="font-medium mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                <span>Column Mappings</span>
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                Match your CSV headers to our database fields. Adjust if your headers are different.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">created_at</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Date Created</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">order_id</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Order Number</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">contact_item</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Contact Item</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">description</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Details</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">serving</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Servings</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">labour</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Labour</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">hours</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Hours</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">overhead</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Overhead</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">recipes</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Recipes</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">cost_price</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Cost Price</span>
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-2 min-w-[120px] justify-center">sell_price</Badge>
                  <span className="mx-2">→</span>
                  <span className="text-blue-300">Sell Price (excl VAT)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="bg-[#1A202C] border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-xl text-white">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file" className="text-white">Select CSV File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="bg-[#2D3748] border-gray-600 text-white mt-1"
                  />
                  {file && (
                    <p className="mt-2 text-sm text-green-400">
                      Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading and processing...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="bg-gray-700" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={isUploading}
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                Reset
              </Button>
              <Button 
                type="submit" 
                disabled={!file || isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <>
                    <Spinner className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload &amp; Import
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {result && (
          <Card className={`mb-6 ${result.success ? 'bg-[#1A2F22] border-green-900' : 'bg-[#2D1E1E] border-red-900'}`}>
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 mr-2 text-green-500" />
                ) : (
                  <AlertCircle className="h-6 w-6 mr-2 text-red-500" />
                )}
                {result.success ? 'Import Successful' : 'Import Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-gray-300">
              {result.success ? (
                <>
                  <p className="mb-2">{result.message || `Successfully imported ${result.inserted} order items.`}</p>
                  {result.errors > 0 && (
                    <Alert variant="destructive" className="mt-4 bg-[#2D1E1E] border border-red-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Import Issues</AlertTitle>
                      <AlertDescription>
                        {`${result.errors} order items couldn't be imported. Check error details below.`}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {result.errorDetails && result.errorDetails.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Error Details:</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.errorDetails.map((error: any, idx: number) => (
                          <div key={idx} className="p-2 bg-[#2D1E1E] rounded border border-red-800 text-sm">
                            <p className="font-medium text-white">{error.error}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              Order: {error.item.order_id || error.item.orderId || error.item['Order Number'] || 'Unknown'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p>{result.error || 'Unknown error occurred during import.'}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}