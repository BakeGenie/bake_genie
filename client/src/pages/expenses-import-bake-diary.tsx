import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Simple CSV parsing function that handles Bake Diary format
const parseCSV = (csvText: string) => {
  // Split by lines and filter out empty lines
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // First line contains the headers
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Parse the data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  
  return data;
};

const ExpensesImportBakeDiary = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);
  const { toast } = useToast();

  // Clear data when component unmounts or when file changes
  useEffect(() => {
    return () => {
      setParsedData([]);
      setHeaders([]);
      setProgress(0);
      setSuccessCount(0);
      setErrorCount(0);
      setErrorDetails([]);
    };
  }, [file]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Read the file
      const text = await selectedFile.text();
      
      // Use our parseCSV function defined at the top
      const records = parseCSV(text);
      
      if (records.length === 0) {
        toast({
          title: "Error",
          description: "The CSV file is empty or improperly formatted.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if this is a Bake Diary format (specific headers)
      const firstRow = records[0];
      const rowHeaders = Object.keys(firstRow);
      
      // Bake Diary format typically has these headers
      const isBakeDiaryFormat = rowHeaders.includes('Date') && 
                               (rowHeaders.includes('Vendor') || rowHeaders.includes('Payment')) &&
                               (rowHeaders.includes('Amount (Incl VAT)') || rowHeaders.includes('Amount'));
      
      if (isBakeDiaryFormat) {
        console.log("Detected BakeDiary format");
        console.log("CSV headers:", rowHeaders);
        console.log("First row:", firstRow);
        console.log("Total rows:", records.length);
        
        // Run a test import with a single record to verify API is working
        try {
          const testItem = {
            date: firstRow.Date || '',
            description: firstRow.Description || '',
            category: firstRow.Category || 'Other',
            amount: firstRow["Amount"] || firstRow["Amount (Incl VAT)"] || '0',
            supplier: firstRow.Vendor || null,
            paymentSource: firstRow.Payment || null,
            vat: firstRow.VAT || '0',
            totalIncTax: firstRow["Amount (Incl VAT)"] || firstRow.Amount || '0'
          };
          
          // Test the endpoint with a single item
          const testResponse = await fetch('/api/expenses/bake-diary/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [testItem] }),
            credentials: 'include'
          });
          
          if (!testResponse.ok) {
            throw new Error(`API test failed: ${testResponse.status}`);
          }
          
          console.log("API test successful!");
        } catch (testError) {
          console.error("API test error:", testError);
          // Continue anyway, as this is just a test
        }
        
        setHeaders(rowHeaders);
        setParsedData(records);
        
        toast({
          title: "Success",
          description: `Loaded ${records.length} expenses from ${selectedFile.name}`,
        });
      } else {
        toast({
          title: "Error",
          description: "This doesn't appear to be a Bake Diary CSV format. Please check the file and try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error parsing CSV:", error);
      toast({
        title: "Error",
        description: `Failed to parse CSV: ${error.message}`,
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    if (!parsedData.length) return;
    
    try {
      setImporting(true);
      setProgress(0);
      setSuccessCount(0);
      setErrorCount(0);
      setErrorDetails([]);
      
      // Map the data to match our database fields
      const expenses = parsedData.map(row => {
        // Debug log each row being processed
        console.log("Processing row:", row);
        
        return {
          date: row.Date || '', // Keep original format, server will parse
          description: row.Description || '',
          category: row.Category || 'Other',
          amount: row["Amount"] || row["Amount (Incl VAT)"] || '0', // Handle both formats
          supplier: row.Vendor || null, // Map Vendor to supplier
          paymentSource: row.Payment || null, // Map Payment to paymentSource
          vat: row.VAT || null,
          totalIncTax: row["Amount (Incl VAT)"] || row.Amount || '0', // Handle both formats
        };
      });
      
      // Process expenses in batches for reliability
      const batchSize = 5; // Smaller batch size for better error handling
      const totalBatches = Math.ceil(expenses.length / batchSize);
      
      for (let i = 0; i < expenses.length; i += batchSize) {
        const batch = expenses.slice(i, i + batchSize);
        
        // Update progress
        const currentProgress = Math.round(((i + batch.length) / expenses.length) * 100);
        setProgress(currentProgress);
        
        try {
          // Send batch to server using our specialized Bake Diary import endpoint
          console.log(`Sending batch ${Math.floor(i/batchSize) + 1} of ${totalBatches}:`, batch);
          
          // Add detailed error tracking
          console.log("Sending to API:", JSON.stringify(batch));
          
          const response = await fetch('/api/expenses/bake-diary/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: batch }),
            credentials: 'include'
          });
          
          // Check response status
          if (!response.ok) {
            console.error("API error status:", response.status);
            const errorText = await response.text();
            console.error("API error response:", errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }
          
          const result = await response.json();
          console.log("Batch result:", result);
          
          if (result.success) {
            setSuccessCount(prev => prev + result.inserted);
            setErrorCount(prev => prev + result.errors);
            
            if (result.errorDetails && result.errorDetails.length > 0) {
              console.error("Error details:", result.errorDetails);
              setErrorDetails(prev => [...prev, ...result.errorDetails]);
            }
            
            if (i + batchSize >= expenses.length) {
              // Final batch
              setProgress(100);
              
              if (result.errors === 0 && errorCount === 0) {
                toast({
                  title: "Import Complete",
                  description: `Successfully imported all ${successCount + result.inserted} expenses.`,
                });
              } else {
                toast({
                  title: "Import Completed with Errors",
                  description: `Imported ${successCount + result.inserted} expenses. ${errorCount + result.errors} errors occurred.`,
                  variant: "destructive"
                });
              }
            }
          } else {
            throw new Error(result.error || 'Unknown error occurred');
          }
        } catch (error: any) {
          console.error("Error importing expenses:", error);
          
          // Try to get more detailed error information
          let errorMessage = error.message || 'Unknown error';
          
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setErrorCount(prev => prev + batch.length);
          setErrorDetails(prev => [...prev, ...batch.map((item: any) => ({
            item,
            error: errorMessage
          }))]);
          
          toast({
            title: "Import Error",
            description: `Error importing batch: ${errorMessage}`,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error("Error importing expenses:", error);
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred during import",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  }, [parsedData, toast]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Import Bake Diary Expenses</h1>
          <p className="text-gray-500">Specialized importer for Bake Diary CSV format</p>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Select Bake Diary CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file exported from Bake Diary. This importer is specifically designed 
            to handle Bake Diary format with fields like "Vendor", "Payment", and "Amount (Incl VAT)".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-8 h-8 mb-3 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CSV file from Bake Diary (e.g., expenses export)
                  </p>
                </div>
                <input 
                  id="dropzone-file" 
                  type="file" 
                  className="hidden" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </label>
            </div>
            
            {file && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {headers.length > 0 && parsedData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Preview ({parsedData.length} expenses)
            </CardTitle>
            <CardDescription>
              Review the data before importing. The importer will map "Vendor" to "supplier", 
              "Payment" to "payment_source", and handle VAT correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header, colIndex) => (
                        <TableCell key={colIndex}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 5 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 5 of {parsedData.length} rows
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setHeaders([]);
              }}
              disabled={importing}
            >
              Clear
            </Button>
            <Button 
              onClick={handleImport}
              disabled={importing || !parsedData.length}
            >
              {importing ? 'Importing...' : 'Import Expenses'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {importing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
            <CardDescription>
              Importing expenses in batches for reliability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{progress}% complete</span>
              <span>
                {successCount} successful / {errorCount} errors
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {errorDetails.length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Import Errors ({errorDetails.length})
            </CardTitle>
            <CardDescription className="text-red-500">
              The following expenses could not be imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {errorDetails.slice(0, 5).map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Row {index + 1}</AlertTitle>
                  <AlertDescription className="text-sm">
                    <strong>Error:</strong> {error.error}<br />
                    <strong>Data:</strong> {JSON.stringify(error.item)}
                  </AlertDescription>
                </Alert>
              ))}
              {errorDetails.length > 5 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 5 of {errorDetails.length} errors
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {successCount > 0 && !importing && (
        <Card className="mb-6 border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Import Complete
            </CardTitle>
            <CardDescription className="text-green-500">
              Successfully imported {successCount} expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Your expenses have been imported successfully. You can now view them on the expenses page.
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => window.location.href = '/expenses'}>
                View Expenses
              </Button>
              <Button variant="outline" onClick={() => {
                setFile(null);
                setParsedData([]);
                setHeaders([]);
                setSuccessCount(0);
                setErrorCount(0);
                setErrorDetails([]);
              }}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8">
        <Separator className="my-4" />
        <h3 className="text-lg font-medium mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Export your expenses from Bake Diary as a CSV file</li>
          <li>Click the upload area above to select your CSV file</li>
          <li>Review the data in the preview table</li>
          <li>Click "Import Expenses" to begin the import process</li>
          <li>Wait for the import to complete</li>
        </ol>
      </div>
    </div>
  );
};

export default ExpensesImportBakeDiary;