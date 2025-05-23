import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Helper function to parse CSV data
function parseCSV(csvText: string) {
  // Split the content into lines
  const lines = csvText.split("\n");
  if (lines.length < 2) {
    throw new Error("CSV file does not have enough lines");
  }

  // Detect format - is this a BakeDiary format or standard CSV?
  let headerLineIndex = 0; // Standard CSV
  let isBakeDiaryFormat = false;
  
  // Check for "BakeDiary" or "Bake Diary" in first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (lines[i].includes("Bake Diary") || lines[i].includes("BakeDiary")) {
      isBakeDiaryFormat = true;
      break;
    }
  }
  
  // Determine header position based on format
  if (isBakeDiaryFormat) {
    // BakeDiary format - headers could be on the 3rd line (index 2)
    headerLineIndex = 2;
    console.log("Detected BakeDiary format with headers on line 3");
  } else {
    // Standard CSV - headers are typically on the first line (index 0)
    headerLineIndex = 0;
    console.log("Using standard CSV format with headers on line 1");
  }
  
  // Make sure header line exists
  if (headerLineIndex >= lines.length) {
    throw new Error("CSV format error: couldn't find headers");
  }
  
  // Parse headers
  const headerLine = lines[headerLineIndex];
  if (!headerLine.trim()) {
    throw new Error("CSV format error: header line is empty");
  }
  
  const headers = headerLine.split(",").map(header => header.trim());
  
  // Parse data rows
  const data = [];
  const dataStartIndex = headerLineIndex + 1;
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = lines[i].split(",");
    
    // Skip if there aren't enough values
    if (values.length < 3) continue;
    
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      // Handle quoted values
      let value = values[index] ? values[index].trim() : "";
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      row[header] = value;
    });

    data.push(row);
  }

  return { headers, data };
}

export default function ExpensesImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importedItems, setImportedItems] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportError(null);
      setImportSuccess(false);
    }
  };

  // Function to trigger file input click
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Function to import expenses from the selected file
  const handleImport = async () => {
    if (!file) {
      setImportError("Please select a file to import");
      return;
    }

    setImporting(true);
    setProgress(10);
    setImportError(null);

    try {
      // Read file contents
      const fileText = await file.text();
      
      // Parse CSV data to validate format
      try {
        parseCSV(fileText);
      } catch (error) {
        setImportError("Invalid CSV format. Make sure your file has headers on line 3 and data starts on line 4.");
        setImporting(false);
        return;
      }

      setProgress(30);

      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("file", file);

      setProgress(50);

      // Send the file to the server
      const response = await apiRequest("POST", "/api/expenses-import", formData, true);

      setProgress(80);

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        setImportedItems(result.expenses.length);
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.expenses.length} expenses.`,
          variant: "success",
        });

        // Invalidate expenses queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      } else {
        setImportError(result.message || "Failed to import expenses");
        toast({
          title: "Import failed",
          description: result.message || "There was an error importing your expenses.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing expenses:", error);
      setImportError("There was an error importing your expenses. Please try again.");
      toast({
        title: "Import failed",
        description: "There was an error importing your expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/data")}
          className="mr-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Import Expenses</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Import Expenses from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file with expense data to import into your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer" onClick={handleSelectFile}>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              
              {!file ? (
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-lg font-medium">Click to select a CSV file</p>
                  <p className="text-sm text-gray-500 mt-1">
                    or drag and drop your file here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <p className="text-lg font-medium break-all">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {importing && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Importing expenses...</p>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {importSuccess && (
              <Alert variant="success" className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Import successful</AlertTitle>
                <AlertDescription>
                  Successfully imported {importedItems} expenses.
                </AlertDescription>
              </Alert>
            )}

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import failed</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">CSV Format Instructions</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your CSV file should have the following format:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Headers should be on line 3</li>
                <li>Data should start on line 4</li>
                <li>Column headers can include: Date, Description, Category, Amount, Supplier/Vendor, Payment/Payment Source, VAT, Total Inc Tax, Tax Deductible, Is Recurring</li>
                <li>Date format should be YYYY-MM-DD</li>
                <li>Amount values can include currency symbols ($, £, €)</li>
                <li>Boolean fields (Tax Deductible, Is Recurring) can be "Yes"/"No" or "True"/"False"</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setLocation("/data")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? "Importing..." : "Import Expenses"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}