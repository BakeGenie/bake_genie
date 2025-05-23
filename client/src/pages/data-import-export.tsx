import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  Upload, 
  FileText,
  Users,
  Database,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function DataImportExport() {
  const [, setLocation] = useLocation();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setImportFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setImportFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Import contacts
  const handleImportContacts = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("type", "contacts");

    try {
      setImportProgress(40);
      
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
          description: "Your contacts have been imported",
        });
      } else {
        toast({
          title: "Import issues",
          description: result.message || "There were issues with your import",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing your contacts",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Import orders
  const handleImportOrders = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("type", "orders");

    try {
      setImportProgress(40);
      
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
          description: "Your orders have been imported",
        });
      } else {
        toast({
          title: "Import issues",
          description: result.message || "There were issues with your import",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing your orders",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Export data
  const handleExport = async (exportType: string) => {
    setIsExporting(true);
    
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
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
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

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Upload your Bake Diary data to import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  importFile ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                {importFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="font-medium">{importFile.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div className="font-medium">Click to upload or drag and drop</div>
                    <div className="text-sm text-muted-foreground">
                      CSV file (max 10MB)
                    </div>
                  </div>
                )}
              </div>

              {isImporting && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing data...</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <div className="mt-8 space-y-4">
                <h3 className="font-semibold text-lg">Select Import Type</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={handleImportContacts}>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Contacts</h4>
                        <p className="text-sm text-muted-foreground">Import your contacts from Bake Diary</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={handleImportOrders}>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">Import Orders</h4>
                        <p className="text-sm text-muted-foreground">Import your orders from Bake Diary</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Download your data for backup or transfer to another system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("all")}>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export All Data</h4>
                      <p className="text-sm text-muted-foreground">Complete backup of your account</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("contacts")}>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export Contacts</h4>
                      <p className="text-sm text-muted-foreground">Export all contacts as CSV</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("orders")}>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export Orders</h4>
                      <p className="text-sm text-muted-foreground">Export all orders as CSV</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => handleExport("finance")}>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">Export Financial Data</h4>
                      <p className="text-sm text-muted-foreground">Export expenses and income</p>
                    </div>
                  </div>
                </Card>
              </div>
              
              {isExporting && (
                <div className="mt-4 p-4 bg-muted rounded-md text-center">
                  <p className="mb-2">Preparing export...</p>
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}