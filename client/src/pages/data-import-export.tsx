import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  Upload, 
  FileText,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function DataImportExport() {
  const [, setLocation] = useLocation();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generic import handler
  const handleImport = async (importType: string) => {
    // Create a temporary hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    
    // Trigger a click event to open file dialog
    fileInput.click();
    
    // Handle file selection
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        document.body.removeChild(fileInput);
        return;
      }
      
      const selectedFile = files[0];
      
      setIsImporting(true);
      setImportProgress(10);
      setImportError(null);
      
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", importType);
      
      // Add field mappings for contacts
      if (importType === "contacts") {
        const mappings = {
          "first_name": "First Name",
          "last_name": "Last Name",
          "email": "Email",
          "phone": "Number",
          "type": "Type"
        };
        formData.append("mappings", JSON.stringify(mappings));
      }
      
      try {
        setImportProgress(30);
        
        const response = await fetch("/api/data/import", {
          method: "POST",
          body: formData,
        });
        
        setImportProgress(70);
        
        const result = await response.json();
        
        setImportProgress(100);
        
        if (result.success) {
          toast({
            title: "Import successful",
            description: `Your ${importType.replace('_', ' ')} have been imported`,
          });
        } else {
          setImportError(result.message || "There were issues with your import");
          toast({
            title: "Import issues",
            description: result.message || "There were issues with your import",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Import error:", error);
        setImportError("There was an error importing your data");
        toast({
          title: "Import failed",
          description: `There was an error importing your ${importType.replace('_', ' ')}`,
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
        document.body.removeChild(fileInput);
      }
    };
  };

  // Export data
  const handleExport = async (exportType: string) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `bakegenie-export-${exportType}-${timestamp}.${exportType === "all" ? "json" : "csv"}`;
      
      toast({
        title: "Export started",
        description: "Preparing your data for download...",
      });
      
      const exportUrl = `/api/data/export${exportType === "all" ? "" : `/${exportType}`}?filename=${filename}`;
      
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export complete",
        description: `Your ${exportType} has been exported successfully`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            Import data or export backups
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="import" className="text-base py-3">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="export" className="text-base py-3">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5" />
                Import Data
              </h2>
              <p className="text-muted-foreground mb-6">
                Choose the type of data you want to import
              </p>
            </div>

            {isImporting && (
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            {importError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import issues</AlertTitle>
                <AlertDescription>
                  {importError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select Import Type</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("contacts")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Contacts</h4>
                        <p className="text-sm text-muted-foreground">Import your contacts from Bake Diary</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("orders")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Order List</h4>
                        <p className="text-sm text-muted-foreground">Import your orders from Bake Diary</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("order_items")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Order Items</h4>
                        <p className="text-sm text-muted-foreground">Import detailed order items</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("quotes")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Quote List</h4>
                        <p className="text-sm text-muted-foreground">Import your quotes from Bake Diary</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("expenses")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Expenses</h4>
                        <p className="text-sm text-muted-foreground">Import your expense data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("ingredients")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Ingredients</h4>
                        <p className="text-sm text-muted-foreground">Import your ingredients data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("recipes")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Recipes</h4>
                        <p className="text-sm text-muted-foreground">Import your recipe data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleImport("supplies")}>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Supplies</h4>
                        <p className="text-sm text-muted-foreground">Import your supplies data</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
                <Download className="h-5 w-5" />
                Export Data
              </h2>
              <p className="text-muted-foreground mb-6">
                Download your data for backup or transfer to another system
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("all")}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export All Data</h4>
                      <p className="text-sm text-muted-foreground">Complete backup of your account</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("contacts")}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export Contacts</h4>
                      <p className="text-sm text-muted-foreground">Export all contacts as CSV</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("orders")}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export Orders</h4>
                      <p className="text-sm text-muted-foreground">Export all orders as CSV</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("finance")}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export Financial Data</h4>
                      <p className="text-sm text-muted-foreground">Export expenses and income</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}