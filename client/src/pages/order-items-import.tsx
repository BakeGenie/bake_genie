import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ChevronLeft, FileUp, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

export default function OrderItemsImport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Ref for file input
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Read the file as text
      const fileContent = await readFileAsText(file);
      setUploadProgress(30);
      
      // Parse CSV to JSON
      const jsonData = parseCSV(fileContent);
      setUploadProgress(50);
      
      // Map CSV columns to database fields
      const mappedData = mapColumnsToFields(jsonData);
      setUploadProgress(70);
      
      // Send data to the server for import
      const result = await apiRequest('POST', '/api/order-items/import', {
        items: mappedData
      });
      
      setUploadProgress(90);
      
      // Parse the response
      const importResult = await result.json();
      setImportResult(importResult);
      
      // Show toast based on result
      if (importResult.success) {
        toast({
          title: 'Import Completed',
          description: importResult.message,
        });
      } else {
        toast({
          title: 'Import Failed',
          description: importResult.error || 'Unknown error occurred',
          variant: 'destructive',
        });
      }
      
      setUploadProgress(100);
    } catch (err) {
      console.error('Error processing file:', err);
      setError(`Failed to process file: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: 'Import Failed',
        description: `Error: ${err instanceof Error ? err.message : String(err)}`,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  };

  // Parse CSV to JSON
  const parseCSV = (csvText: string): any[] => {
    // Split by line and get header and rows
    const lines = csvText.split('\\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }
    
    // Parse header (handling quoted headers)
    const headerLine = lines[0];
    const headers = parseCSVRow(headerLine);
    
    // Parse each data row
    const jsonData = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      const rowData: Record<string, string> = {};
      
      for (let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = j < row.length ? row[j] : '';
      }
      
      jsonData.push(rowData);
    }
    
    return jsonData;
  };

  // Helper to parse a CSV row properly handling quoted fields
  const parseCSVRow = (rowText: string): string[] => {
    const result = [];
    let insideQuote = false;
    let currentField = '';
    
    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      
      if (char === '"') {
        // Handle escaped quotes (two adjacent quote characters inside a quoted field)
        if (insideQuote && i < rowText.length - 1 && rowText[i + 1] === '"') {
          currentField += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote mode
          insideQuote = !insideQuote;
        }
      }
      else if (char === ',' && !insideQuote) {
        // End of field
        result.push(currentField);
        currentField = '';
      }
      else {
        currentField += char;
      }
    }
    
    // Add the last field
    result.push(currentField);
    
    return result;
  };

  // Map CSV columns to database fields
  const mapColumnsToFields = (jsonData: any[]): any[] => {
    const columnMapping: { [key: string]: string } = {
      'Date Created': 'created_at',
      'Order Number': 'order_id',
      'Contact Item': 'contact_item',
      'Details': 'description',
      'Servings': 'serving',
      'Labour': 'labour',
      'Hours': 'hours',
      'Overhead': 'overhead',
      'Recipes': 'recipes',
      'Cost Price': 'cost_price',
      'Sell Price (excl VAT)': 'sell_price'
    };
    
    return jsonData.map(item => {
      const mappedItem: Record<string, any> = {};
      
      // Map each field using the mapping dictionary
      for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
        // If the CSV column exists in the data, map it to the DB field
        if (csvColumn in item) {
          mappedItem[dbField] = item[csvColumn];
        }
      }
      
      return mappedItem;
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/data-import-export')}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Import Order Items</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Order Items from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file containing order item details. Make sure your CSV has required columns for order items like Order Number and Description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="border rounded-md p-6 flex flex-col items-center justify-center text-center">
                <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload CSV File</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to browse for a file or drag and drop
                </p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button onClick={triggerFileInput} className="mb-2">
                  Browse Files
                </Button>
                {file && (
                  <div className="text-sm mt-2 text-muted-foreground">
                    Selected: {file.name}
                  </div>
                )}
              </div>
              
              {isUploading && (
                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              
              {importResult && (
                <div className="mt-4">
                  <h3 className="font-semibold text-lg mb-2">Import Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md bg-green-50 p-4">
                      <p className="text-green-700 font-medium">Successfully Imported</p>
                      <p className="text-3xl font-bold text-green-800">{importResult.inserted}</p>
                    </div>
                    <div className="rounded-md bg-red-50 p-4">
                      <p className="text-red-700 font-medium">Failed to Import</p>
                      <p className="text-3xl font-bold text-red-800">{importResult.errors}</p>
                    </div>
                  </div>
                  
                  {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-md mb-2">Error Details</h4>
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                        {importResult.errorDetails.map((error: any, index: number) => (
                          <div key={index} className="text-sm py-1 border-b last:border-0">
                            <span className="font-medium">Item {index + 1}:</span> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={processFile} disabled={!file || isUploading}>
              {isUploading ? 'Processing...' : 'Import Order Items'}
              {!isUploading && <Upload className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}