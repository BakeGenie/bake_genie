import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Simple CSV parsing function that handles ingredients format
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

const IngredientsImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);
  const { toast } = useToast();
  
  // Reset the import state if the file changes
  useEffect(() => {
    if (file) {
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
      
      // Use our parseCSV function
      const records = parseCSV(text);
      
      if (records.length === 0) {
        toast({
          title: "Error",
          description: "The CSV file is empty or improperly formatted.",
          variant: "destructive"
        });
        return;
      }
      
      // Check if this is an ingredients format (specific headers)
      const firstRow = records[0];
      const rowHeaders = Object.keys(firstRow);
      
      // Look for expected ingredients columns
      const isIngredientsFormat = rowHeaders.includes('Ingredient') && 
                                (rowHeaders.includes('Supplier')) &&
                                (rowHeaders.includes('Purchase Size') || rowHeaders.includes('Cost Price'));
      
      if (isIngredientsFormat) {
        console.log("Detected Ingredients format");
        console.log("CSV headers:", rowHeaders);
        console.log("First row:", firstRow);
        console.log("Total rows:", records.length);
        
        // Run a test import with a single record to verify API is working
        try {
          // Properly clean values before sending to API
          const testItem = {
            name: firstRow.Ingredient ? firstRow.Ingredient.replace(/"/g, '') : '',
            supplier: firstRow.Supplier ? firstRow.Supplier.replace(/"/g, '') : '',
            costPerUnit: (firstRow["Purchase Size"] || '0').replace(/"/g, ''),
            packCost: (firstRow["Cost Price"] || '0').replace(/"/g, ''),
            // Add any additional fields that might be useful
            category: firstRow.Category ? firstRow.Category.replace(/"/g, '') : 'General',
            unit: firstRow.Unit ? firstRow.Unit.replace(/"/g, '') : ''
          };
          
          // Test the endpoint with a single item
          const testResponse = await fetch('/api/ingredients/import', {
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
          description: `Loaded ${records.length} ingredients from ${selectedFile.name}`,
        });
      } else {
        toast({
          title: "Error",
          description: "This doesn't appear to be an ingredients CSV format. Expected columns: 'Ingredient', 'Supplier', 'Purchase Size', 'Cost Price'.",
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
    try {
      setImporting(true);
      setProgress(0);
      setSuccessCount(0);
      setErrorCount(0);
      setErrorDetails([]);
      
      // Map the data to match our database fields and clean all values
      const ingredients = parsedData.map(row => {
        // Debug log each row being processed
        console.log("Processing row:", row);
        
        // CSV column: "Ingredient" → Database field: "name"
        // CSV column: "Supplier" → Database field: "supplier"
        // CSV column: "Purchase Size" → Database field: "costPerUnit"
        // CSV column: "Cost Price" → Database field: "packCost"
        
        // Remove quotes from all string and numeric values
        const name = row.Ingredient ? row.Ingredient.replace(/"/g, '') : '';
        const supplier = row.Supplier ? row.Supplier.replace(/"/g, '') : '';
        
        // Handle numeric fields and ensure they're clean numbers
        let costPerUnit = row["Purchase Size"] || '0';
        costPerUnit = costPerUnit.toString().replace(/"/g, '');
        
        let packCost = row["Cost Price"] || '0';
        packCost = packCost.toString().replace(/"/g, '');
        
        // Additional fields that might be useful
        const category = row.Category ? row.Category.replace(/"/g, '') : 'General';
        const unit = row.Unit ? row.Unit.replace(/"/g, '') : '';
        
        return {
          name,
          supplier,
          costPerUnit,
          packCost,
          category,
          unit
        };
      });
      
      // Process ingredients in batches for reliability
      const batchSize = 5; // Smaller batch size for better error handling
      const totalBatches = Math.ceil(ingredients.length / batchSize);
      
      for (let i = 0; i < ingredients.length; i += batchSize) {
        const batch = ingredients.slice(i, i + batchSize);
        
        // Update progress
        const currentProgress = Math.round(((i + batch.length) / ingredients.length) * 100);
        setProgress(currentProgress);
        
        try {
          // Send batch to server
          console.log(`Sending batch ${Math.floor(i/batchSize) + 1} of ${totalBatches}:`, batch);
          
          // Add detailed error tracking
          console.log("Sending to API:", JSON.stringify(batch));
          
          const response = await fetch('/api/ingredients/import', {
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
            
            if (i + batchSize >= ingredients.length) {
              // Final batch
              setProgress(100);
              
              if (result.errors === 0 && errorCount === 0) {
                toast({
                  title: "Import Complete",
                  description: `Successfully imported all ${successCount + result.inserted} ingredients.`,
                });
              } else {
                toast({
                  title: "Import Completed with Errors",
                  description: `Imported ${successCount + result.inserted} ingredients with ${errorCount + result.errors} errors.`,
                  variant: "destructive"
                });
              }
            }
          } else {
            throw new Error(result.error || 'Unknown error');
          }
        } catch (error: any) {
          console.error("Error importing ingredients:", error);
          
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
      console.error("Error importing ingredients:", error);
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred during import",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  }, [parsedData, toast, successCount, errorCount]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Import Ingredients</h1>
          <p className="text-gray-500">Import ingredients data from CSV files</p>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Select Ingredients CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing ingredients data with columns for Ingredient, Supplier, Purchase Size, and Cost Price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/90"
            disabled={importing}
          />
        </CardContent>
      </Card>
      
      {importing && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Importing Ingredients...</CardTitle>
            <CardDescription>
              Please wait while we import your ingredients. This might take a while for large files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <div className="text-sm text-gray-500 flex justify-between">
              <span>Processing...</span>
              <span>{progress}% Complete</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {successCount > 0 && (
        <Card className="mb-6 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Import Success
            </CardTitle>
            <CardDescription>
              Successfully imported {successCount} ingredients into your database.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {errorDetails.length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Import Errors ({errorDetails.length})
            </CardTitle>
            <CardDescription>
              The following ingredients could not be imported
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorDetails.slice(0, 5).map((error, index) => (
              <Alert variant="destructive" key={index} className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Row {index + 1}</AlertTitle>
                <AlertDescription>
                  <div>Error: {error.error}</div>
                  <div className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto max-h-20">
                    Data: {JSON.stringify(error.item)}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
            {errorDetails.length > 5 && (
              <div className="text-center mt-2">
                Showing 5 of {errorDetails.length} errors
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>
              Review your ingredients data before importing. First {Math.min(5, parsedData.length)} of {parsedData.length} rows shown.
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
              {importing ? 'Importing...' : 'Import Ingredients'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <Separator className="my-6" />
      
      <div className="text-sm text-gray-500 mb-10">
        <h3 className="font-medium text-gray-700 mb-2">CSV Format Requirements:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>File must be in CSV format</li>
          <li>Required columns: Ingredient, Supplier, Purchase Size, Cost Price</li>
          <li>Ingredient column will be mapped to the name field in the database</li>
          <li>Supplier column will be mapped to the supplier field in the database</li>
          <li>Purchase Size column will be mapped to the cost_per_unit field in the database</li>
          <li>Cost Price column will be mapped to the pack_cost field in the database</li>
          <li>Optional columns: Category, Unit</li>
        </ul>
      </div>
    </div>
  );
};

export default IngredientsImport;