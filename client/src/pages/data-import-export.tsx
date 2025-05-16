import React, { useState } from "react";
import { useNavigate } from "wouter";
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
import AppLayout from "@/layouts/app-layout";

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
  const navigate = useNavigate();

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
      // Check if file is JSON
      if (file.type !== "application/json") {
        toast({
          title: "Invalid file type",
          description: "Please select a JSON file",
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

  // Handle import submission
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
      const formData = new FormData();
      formData.append("file", importFile);
      
      // Add import options
      Object.entries(importOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch("/api/data/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        setImportMessage("Data imported successfully!");
        // Format summary message
        if (result.result && result.result.summary) {
          const summary = result.result.summary;
          let summaryMessage = "Import summary:\n";
          
          Object.entries(summary).forEach(([key, value]: [string, any]) => {
            if (value.imported > 0 || value.errors > 0) {
              summaryMessage += `- ${key}: ${value.imported} imported, ${value.errors} errors\n`;
            }
          });
          
          setImportMessage(summaryMessage);
        }
      } else {
        setImportSuccess(false);
        setImportError(result.error || "Unknown error occurred");
      }
    } catch (error) {
      setImportSuccess(false);
      setImportError("Failed to import data. Please try again.");
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import from Cake Diary
  const handleImportFromCakeDiary = async () => {
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
      const formData = new FormData();
      formData.append("file", importFile);
      
      // Add import options
      Object.entries(importOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch("/api/data/import/cake-diary", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        setImportMessage("Data imported successfully from Cake Diary!");
        // Format summary message
        if (result.result && result.result.summary) {
          const summary = result.result.summary;
          let summaryMessage = "Import summary:\n";
          
          Object.entries(summary).forEach(([key, value]: [string, any]) => {
            if (value.imported > 0 || value.errors > 0) {
              summaryMessage += `- ${key}: ${value.imported} imported, ${value.errors} errors\n`;
            }
          });
          
          setImportMessage(summaryMessage);
        }
      } else {
        setImportSuccess(false);
        setImportError(result.error || "Unknown error occurred");
      }
    } catch (error) {
      setImportSuccess(false);
      setImportError("Failed to import data. Please try again.");
      console.error("Import error:", error);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Create endpoint based on export type
      const endpoint = exportType === "all" 
        ? "/api/data/export" 
        : `/api/data/export/${exportType}`;
      
      // Create a link to download the file
      const link = document.createElement("a");
      link.href = endpoint;
      link.setAttribute("download", `cakehub-export-${exportType}-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export started",
        description: "Your data export has started. The file will download automatically.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
      console.error("Export error:", error);
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
    <AppLayout>
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Data Import & Export</h1>
            <p className="text-muted-foreground">
              Backup your data or migrate from other systems
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Your Data</CardTitle>
                <CardDescription>
                  Download a backup of your data for safekeeping or to transfer to another system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="exportType">What would you like to export?</Label>
                    <Select value={exportType} onValueChange={setExportType}>
                      <SelectTrigger id="exportType">
                        <SelectValue placeholder="Select data to export" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Data</SelectItem>
                        <SelectItem value="orders">Orders</SelectItem>
                        <SelectItem value="contacts">Contacts</SelectItem>
                        <SelectItem value="recipes">Recipes</SelectItem>
                        <SelectItem value="products">Products</SelectItem>
                        <SelectItem value="financials">Financial Data</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="enquiries">Enquiries</SelectItem>
                        <SelectItem value="settings">Settings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="w-full"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download {exportType === "all" ? "All Data" : exportType}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>
                  Import data from a backup file or migrate from Cake Diary
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="importFile">Select a file to import</Label>
                    <input
                      id="importFile"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="border rounded p-2"
                    />
                    {importFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {importFile.name}
                      </p>
                    )}
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
                <Button 
                  onClick={handleImport} 
                  disabled={!importFile || isImporting}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Data
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleImportFromCakeDiary} 
                  disabled={!importFile || isImporting}
                  variant="outline"
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import from Cake Diary
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}