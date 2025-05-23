import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Download, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataImportExport() {
  const [activeTab, setActiveTab] = useState("export");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");
  const [exportType, setExportType] = useState("all");
  const { toast } = useToast();

  // Import options
  const [importOptions, setImportOptions] = useState({
    replaceExisting: false,
    importContacts: true,
    importOrders: true,
    importRecipes: true,
    importProducts: true,
    importFinancials: true,
    importTasks: true,
    importEnquiries: true,
    importSettings: true,
  });

  // Handle import file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if file is JSON or CSV
      if (file.type !== "application/json" && 
          !file.name.toLowerCase().endsWith('.csv') && 
          file.type !== "text/csv") {
        toast({
          title: "Invalid file type",
          description: "Please select a JSON or CSV file",
          variant: "destructive",
        });
        return;
      }
      setImportFile(file);
      // Reset status
      setImportSuccess(null);
      setImportMessage("");
      setImportError("");
    }
  };

  // Handle import submission with improved feedback and error handling
  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportSuccess(null);
    setImportMessage("");
    setImportError("");

    try {
      // Show initial toast to indicate import has started
      toast({
        title: "Import started",
        description: "Your data import is being processed...",
      });

      const formData = new FormData();
      formData.append("file", importFile);
      
      // Add import options
      Object.entries(importOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Check file size (client-side validation)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (importFile.size > maxSize) {
        throw new Error(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      }

      const response = await fetch("/api/data/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Import failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        
        // Format summary message with better formatting for display
        if (result.result && result.result.summary) {
          const summary = result.result.summary;
          let summaryMessage = "Import Summary:\n\n";
          let totalImported = 0;
          let totalErrors = 0;
          
          Object.entries(summary).forEach(([key, value]: [string, any]) => {
            if (value.imported > 0 || value.errors > 0) {
              const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
              summaryMessage += `• ${formattedKey}: ${value.imported} imported`;
              
              if (value.errors > 0) {
                summaryMessage += `, ${value.errors} errors`;
              }
              
              summaryMessage += "\n";
              totalImported += value.imported;
              totalErrors += value.errors;
            }
          });
          
          // Add a summary line at the top
          summaryMessage = `Successfully imported ${totalImported} items with ${totalErrors} errors.\n\n` + summaryMessage;
          
          setImportMessage(summaryMessage);
        } else {
          setImportMessage("Data imported successfully!");
        }
        
        toast({
          title: "Import completed successfully",
          description: `Imported data from "${importFile.name}"`,
        });
      } else {
        setImportSuccess(false);
        setImportError(result.error || "Unknown error occurred");
        
        toast({
          title: "Import failed",
          description: result.error || "An error occurred during import",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportSuccess(false);
      setImportError(error instanceof Error ? error.message : "Failed to import data. Please try again.");
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import from Bake Diary
  const handleImportFromCakeDiary = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    // Verify file type is CSV for Bake Diary imports
    if (!importFile.name.toLowerCase().endsWith('.csv') && importFile.type !== "text/csv") {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file for Bake Diary imports",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportSuccess(null);
    setImportMessage("");
    setImportError("");

    try {
      const formData = new FormData();
      formData.append("file", importFile);
      
      // Add import options
      Object.entries(importOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Determine the import type based on filename
      let importEndpoint = "/api/import/orders"; // Default to orders
      
      if (importFile.name.toLowerCase().includes("order list")) {
        importEndpoint = "/api/import/orders";
      } else if (importFile.name.toLowerCase().includes("quote list")) {
        importEndpoint = "/api/import/quotes";
      } else if (importFile.name.toLowerCase().includes("order items") || 
                importFile.name.toLowerCase().includes("detailed order")) {
        importEndpoint = "/api/import/order-items";
      }

      const response = await fetch(importEndpoint, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        setImportMessage(`Data imported successfully from Bake Diary! ${result.message || ''}`);
        
        // Format error messages if any
        if (result.errors && result.errors.length > 0) {
          const errorList = result.errors.slice(0, 5); // Show just the first 5 errors
          let errorMessage = "\n\nErrors encountered:\n";
          errorList.forEach((err: string, index: number) => {
            errorMessage += `${index + 1}. ${err}\n`;
          });
          
          if (result.errors.length > 5) {
            errorMessage += `...and ${result.errors.length - 5} more errors.`;
          }
          
          setImportMessage(prev => prev + errorMessage);
        }
      } else {
        setImportSuccess(false);
        setImportError(result.message || "Unknown error occurred");
      }
    } catch (error) {
      setImportSuccess(false);
      setImportError("Failed to import data. Please try again.");
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export with improved error handling and progress feedback
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Create filename with proper extension
      const appName = "bakegenie";
      const fileExtension = exportType === "all" ? "json" : "csv";
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${appName}-export-${exportType}-${timestamp}.${fileExtension}`;
      
      // Create download URL
      const downloadUrl = exportType === "all" 
        ? `/api/data/export?filename=${filename}` 
        : `/api/data/export/${exportType}?filename=${filename}`;
      
      toast({
        title: "Export started",
        description: "Your data export is being prepared...",
      });
      
      // Fetch the export data - this will trigger the download
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }
      
      // Get the response as blob
      const blob = await response.blob();
      
      // Create object URL and download link
      const objectUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = filename;
      downloadLink.click();
      
      // Clean up the object URL
      window.URL.revokeObjectURL(objectUrl);

      toast({
        title: "Export complete",
        description: `Your ${exportType === "all" ? "data" : exportType} has been exported successfully.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle import option
  const toggleImportOption = (option: keyof typeof importOptions) => {
    setImportOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Data Import & Export</h1>
            <p className="text-muted-foreground">
              Backup your data or migrate from other systems
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="export" className="data-[state=active]:bg-primary/90 data-[state=active]:text-white">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-primary/90 data-[state=active]:text-white">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-6">
            <Card className="border-t-4 border-t-primary/90 shadow-md">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Download className="h-5 w-5" />
                  Export Your Data
                </CardTitle>
                <CardDescription>
                  Download a backup of your data for safekeeping or to transfer to another system
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="exportType" className="text-base font-medium">What would you like to export?</Label>
                    <Select value={exportType} onValueChange={setExportType}>
                      <SelectTrigger id="exportType" className="h-11">
                        <SelectValue placeholder="Select data to export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-medium">All Data (Complete Backup)</SelectItem>
                        <Separator className="my-2" />
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="contacts">Contacts</SelectItem>
                        <SelectItem value="recipes">Recipes</SelectItem>
                        <SelectItem value="products">Products</SelectItem>
                        <SelectItem value="financials">Financial Data</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="enquiries">Enquiries</SelectItem>
                        <SelectItem value="settings">Settings</SelectItem>
                        <Separator className="my-2" />
                        <SelectItem value="template_orders">Orders Template</SelectItem>
                        <SelectItem value="template_quotes">Quotes Template</SelectItem>
                        <SelectItem value="template_order_items">Order Items Template</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-md p-4 mt-2">
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">Export Information</p>
                      <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                        <li className="flex items-start gap-2">
                          <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>All Data</strong> exports a complete JSON backup of your entire account.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Individual data types</strong> are exported as CSV files for easy viewing in spreadsheets.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Templates</strong> provide empty CSV files that show the correct format for importing data.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-slate-50 dark:bg-slate-900/50 py-4">
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="w-full h-11"
                  size="lg"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Preparing Export...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download {exportType === "all" ? "All Data" : exportType}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <Card className="border-t-4 border-t-purple-500 shadow-md">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-purple-500">
                  <Upload className="h-5 w-5" />
                  Import Data
                </CardTitle>
                <CardDescription>
                  Import data from a backup file or migrate from Bake Diary
                </CardDescription>
              </CardHeader>
              <div className="px-6 pt-2">
                <Alert className="mb-6 border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/20">
                  <AlertCircle className="h-4 w-4 text-purple-500" />
                  <AlertTitle className="text-purple-700 dark:text-purple-300">Import from Bake Diary (CSV)</AlertTitle>
                  <AlertDescription className="text-purple-700 dark:text-purple-400">
                    To import data from Bake Diary, select one of the CSV files exported from Bake Diary:
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Order List - To import orders and their basic details</li>
                      <li>Quote List - To import quotes and their basic details</li>
                      <li>Detailed Order Items - To import order items and details</li>
                    </ul>
                    <div className="mt-2 border-t border-purple-200 dark:border-purple-800/50 pt-2">
                      <p className="text-sm font-medium">Need a template?</p>
                      <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                        Download a CSV template from the Export tab by selecting one of these options:
                      </p>
                      <ul className="list-disc pl-5 mt-1 text-xs text-purple-600 dark:text-purple-300 space-y-1">
                        <li>Orders Template - For Order List imports</li>
                        <li>Quotes Template - For Quote List imports</li>
                        <li>Order Items Template - For Detailed Order Items imports</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="importFile" className="text-base font-medium">Select File to Import</Label>
                    <div className="border-2 border-dashed border-purple-200 dark:border-purple-800/40 rounded-md p-6 text-center hover:bg-purple-50/50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer">
                      <input
                        id="importFile"
                        type="file"
                        accept=".json,.csv,application/json,text/csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="importFile" className="cursor-pointer block">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-10 w-10 text-purple-400" />
                          {importFile ? (
                            <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Click to browse or drag and drop a file
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Supported formats: JSON (full backup), CSV (data table)
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Import Options</h3>
                    
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="replaceExisting" 
                          checked={importOptions.replaceExisting}
                          onCheckedChange={() => toggleImportOption("replaceExisting")}
                        />
                        <Label htmlFor="replaceExisting">Replace existing data</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importContacts" 
                          checked={importOptions.importContacts}
                          onCheckedChange={() => toggleImportOption("importContacts")}
                        />
                        <Label htmlFor="importContacts">Import contacts</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importOrders" 
                          checked={importOptions.importOrders}
                          onCheckedChange={() => toggleImportOption("importOrders")}
                        />
                        <Label htmlFor="importOrders">Import orders</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importRecipes" 
                          checked={importOptions.importRecipes}
                          onCheckedChange={() => toggleImportOption("importRecipes")}
                        />
                        <Label htmlFor="importRecipes">Import recipes</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importProducts" 
                          checked={importOptions.importProducts}
                          onCheckedChange={() => toggleImportOption("importProducts")}
                        />
                        <Label htmlFor="importProducts">Import products</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importFinancials" 
                          checked={importOptions.importFinancials}
                          onCheckedChange={() => toggleImportOption("importFinancials")}
                        />
                        <Label htmlFor="importFinancials">Import financial data</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importTasks" 
                          checked={importOptions.importTasks}
                          onCheckedChange={() => toggleImportOption("importTasks")}
                        />
                        <Label htmlFor="importTasks">Import tasks</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importEnquiries" 
                          checked={importOptions.importEnquiries}
                          onCheckedChange={() => toggleImportOption("importEnquiries")}
                        />
                        <Label htmlFor="importEnquiries">Import enquiries</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importSettings" 
                          checked={importOptions.importSettings}
                          onCheckedChange={() => toggleImportOption("importSettings")}
                        />
                        <Label htmlFor="importSettings">Import settings</Label>
                      </div>
                    </div>
                  </div>

                  {importSuccess !== null && (
                    <Alert variant={importSuccess ? "default" : "destructive"} className="mt-4">
                      {importSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertTitle>Success</AlertTitle>
                          <AlertDescription>
                            {importMessage.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{importError}</AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                {importFile && importFile.name.toLowerCase().endsWith('.csv') && (
                  <Button 
                    onClick={handleImportFromCakeDiary} 
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Importing CSV...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Bake Diary CSV
                      </>
                    )}
                  </Button>
                )}
                
                {importFile && importFile.type === "application/json" && (
                  <Button 
                    onClick={handleImport} 
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Importing JSON...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Import JSON Backup
                      </>
                    )}
                  </Button>
                )}
                
                {!importFile && (
                  <div className="w-full py-2 text-center text-muted-foreground">
                    Please select a file to import
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}