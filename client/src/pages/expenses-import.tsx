import { useState, useRef, useEffect } from "react";
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
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

// Helper function to parse CSV lines properly handling quotes
function parseCSVLine(line: string) {
  const values = [];
  let inQuote = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuote = !inQuote;
    } 
    else if (char === ',' && !inQuote) {
      values.push(currentValue.trim());
      currentValue = '';
    } 
    else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  return values;
}

// Improved CSV parser that handles quoted values and different formats
function parseCSV(csvText: string) {
  // Split the content into lines
  const lines = csvText.split("\n").filter(line => line.trim());
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
      headerLineIndex = 2; // Headers on 3rd line
      break;
    }
  }
  
  // Also check if headers contain BakeDiary specific columns
  const firstLine = parseCSVLine(lines[0]);
  if (firstLine.includes('Amount (Incl VAT)') || 
      (firstLine.includes('Vendor') && firstLine.includes('VAT'))) {
    isBakeDiaryFormat = true;
    headerLineIndex = 0; // Headers are actually on first line
  }
  
  console.log(isBakeDiaryFormat ? 
    "Detected BakeDiary format" : 
    "Using standard CSV format");
  
  // Make sure header line exists
  if (headerLineIndex >= lines.length) {
    throw new Error("CSV format error: couldn't find headers");
  }
  
  // Parse headers
  const headerLine = lines[headerLineIndex];
  if (!headerLine.trim()) {
    throw new Error("CSV format error: header line is empty");
  }
  
  const headers = parseCSVLine(headerLine);
  
  // Parse data rows
  const data = [];
  const dataStartIndex = headerLineIndex + 1;
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    const values = parseCSVLine(lines[i]);
    
    // Skip if there aren't enough values
    if (values.length < 3) continue;
    
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      if (index < values.length) {
        // Handle quoted values
        let value = values[index];
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        row[header.trim()] = value;
      } else {
        row[header.trim()] = ''; // Empty value for missing columns
      }
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
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expense field mappings for the database
  const mappings = {
    "date": "Date",
    "description": "Description",
    "supplier": "Vendor",
    "category": "Category",
    "payment_source": "Payment",
    "vat": "VAT",
    "amount": "Amount (Incl VAT)",
    "total_inc_tax": "Amount (Incl VAT)"
  };

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImportError(null);
      setImportSuccess(false);
      setParsedData(null);
      setHeaders([]);
      
      // Read and parse the file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const { headers, data } = parseCSV(content);
          setParsedData(data);
          setHeaders(headers);
          console.log("CSV headers:", headers);
          console.log("First row:", data[0]);
          console.log("Total rows:", data.length);
        } catch (error) {
          console.error("CSV parsing error:", error);
          setImportError("Invalid CSV format. Please check your file and try again.");
        }
      };
      reader.readAsText(selectedFile);
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
        setImportedItems(result.expenses?.length || 0);
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.expenses?.length || 0} expenses.`,
        });

        // Invalidate expenses queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        
        // Redirect back to expenses page after 1.5 seconds
        setTimeout(() => {
          setLocation('/expenses');
        }, 1500);
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

  // Get column headers to display based on the actual CSV file
  const getDisplayHeaders = () => {
    // If we have headers from the file, use them
    if (headers.length > 0) {
      // Filter to important columns only to avoid overcrowding
      const importantFields = [
        'Date', 'Description', 'Category', 'Amount', 'Amount (Incl VAT)', 
        'Vendor', 'Supplier', 'Payment', 'VAT'
      ];
      
      return headers.filter(header => 
        importantFields.some(field => 
          header.includes(field) || field.includes(header)
        )
      );
    }
    
    // Fallback to our default mappings
    return Object.values(mappings);
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

      <Card className="mb-8 bg-[#1c1c1c] border-[#333333] text-white">
        <CardHeader>
          <CardTitle>Import Expenses from CSV</CardTitle>
          <CardDescription className="text-gray-400">
            Upload a CSV file with expense data to import into your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className="flex justify-between items-center">
                <Button 
                  type="button"
                  onClick={handleSelectFile}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {file ? 'Change File' : 'Select File'}
                </Button>
                
                {file && (
                  <span className="text-sm text-gray-400">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                )}
              </div>
            
            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Importing expenses...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}

            {importSuccess && (
              <Alert variant="success" className="bg-green-900 border-green-700 text-white">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Import successful</AlertTitle>
                <AlertDescription>
                  Successfully imported {importedItems} expenses.
                </AlertDescription>
              </Alert>
            )}

            {importError && (
              <Alert variant="destructive" className="bg-red-900 border-red-700 text-white">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import failed</AlertTitle>
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}

            {parsedData && parsedData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Data Preview</h3>
                <div className="border border-gray-700 rounded overflow-auto max-h-60">
                  <Table className="text-white">
                    <TableHeader>
                      <TableRow className="bg-gray-800 hover:bg-gray-800">
                        {getDisplayHeaders().map((header) => (
                          <TableHead key={header} className="text-gray-300">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <TableRow key={i} className="border-gray-700 hover:bg-gray-800">
                          {getDisplayHeaders().map((header) => (
                            <TableCell key={`${i}-${header}`}>
                              {row[header] || ''}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  Showing {Math.min(5, parsedData.length)} of {parsedData.length} rows
                </div>
              </div>
            )}

            <div className="bg-gray-800 p-4 rounded-md">
              <h3 className="font-medium mb-2 text-gray-300">CSV Format Instructions</h3>
              <p className="text-sm text-gray-400 mb-2">
                Your CSV file should follow the Bake Diary format:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Headers should be on line 1 (standard CSV) or line 3 (Bake Diary export)</li>
                <li>Standard headers: Date, Description, Vendor, Category, Payment, VAT, Amount (Incl VAT)</li>
                <li>Date format can be "DD MMM YYYY" (like "11 Jan 2025")</li>
                <li>Amount values can include currency symbols ($, £, €)</li>
              </ul>
            </div>
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
            disabled={!file || importing || !parsedData}
            className="bg-green-600 hover:bg-green-700"
          >
            {importing ? "Importing..." : "Import Expenses"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}