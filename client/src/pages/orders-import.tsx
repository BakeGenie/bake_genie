import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Advanced CSV parsing function that handles orders format and quoted values
const parseCSV = (csvText: string) => {
  // Split by lines and filter out empty lines
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // First line contains the headers
  // Use a more robust way to split the CSV that respects quotes
  const parseCSVLine = (line: string) => {
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue.trim());
    return values;
  };
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Parse the data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        // Remove any quotes from values 
        let value = values[index] ? values[index].trim() : '';
        // Remove enclosing quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        row[header] = value;
      });
      data.push(row);
    }
  }
  
  return data;
};

const OrdersImport = () => {
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
      
      // Check if this is an orders format (specific headers)
      const firstRow = records[0];
      const rowHeaders = Object.keys(firstRow);
      
      // Look for expected orders columns
      const isOrdersFormat = rowHeaders.includes('Order Number') || 
                            (rowHeaders.includes('Event Date')) ||
                            (rowHeaders.includes('Order Total'));
      
      if (isOrdersFormat) {
        console.log("Detected Orders format");
        console.log("CSV headers:", rowHeaders);
        console.log("First row:", firstRow);
        console.log("Total rows:", records.length);
        
        setHeaders(rowHeaders);
        setParsedData(records);
        
        toast({
          title: "Success",
          description: `Loaded ${records.length} orders from ${selectedFile.name}`,
        });
      } else {
        toast({
          title: "Error",
          description: "This doesn't appear to be an orders CSV format. Expected columns: 'Order Number', 'Event Date', 'Order Total', etc.",
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
      
      // Map the data to match our database fields
      const orders = parsedData.map(row => {
        // Debug log each row being processed
        console.log("Processing row:", row);
        
        // Map CSV columns to database fields
        return {
          orderNumber: row['Order Number'] || '',
          eventType: row['Event Type'] || '',
          eventDate: row['Event Date'] || '',
          theme: row['Theme'] || '',
          status: row['Status'] || 'Quote',
          totalAmount: row['Order Total'] || '0',
          deliveryFee: row['Delivery Tax'] || '0',
          deliveryTime: row['Delivery Time'] || '',
          profit: row['Profit'] || '0',
          subTotalAmount: row['Sub Total Amount'] || '0',
          discountAmount: row['Discount Amount'] || '0',
          taxRate: row['Tax'] || '0',
          deliveryAmount: row['Delivery Amount'] || '0',
          createdAt: row['Date Created'] || new Date().toISOString(),
          contactId: row['Contact ID'] || '1' // Default contact ID
        };
      });
      
      // Process orders in batches for reliability
      const batchSize = 5; // Smaller batch size for better error handling
      const totalBatches = Math.ceil(orders.length / batchSize);
      
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        
        // Update progress
        const currentProgress = Math.round(((i + batch.length) / orders.length) * 100);
        setProgress(currentProgress);
        
        try {
          // Send batch to server
          console.log(`Sending batch ${Math.floor(i/batchSize) + 1} of ${totalBatches}:`, batch);
          
          // Clean data before sending to ensure no HTML or special characters cause issues
          const cleanBatch = batch.map(item => {
            const cleaned = {};
            Object.keys(item).forEach(key => {
              let value = item[key];
              // Ensure string values
              if (typeof value === 'string') {
                // Remove any escape sequences or extra quotes that might cause issues
                value = value.replace(/\\"/g, '"').replace(/^"+|"+$/g, '');
              }
              cleaned[key] = value;
            });
            return cleaned;
          });
          
          // Add detailed error tracking
          console.log("Sending to API:", JSON.stringify(cleanBatch));
          
          const response = await fetch('/api/orders/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: cleanBatch }),
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
            
            if (i + batchSize >= orders.length) {
              // Final batch
              setProgress(100);
              
              if (result.errors === 0 && errorCount === 0) {
                toast({
                  title: "Import Complete",
                  description: `Successfully imported all ${successCount + result.inserted} orders.`,
                });
              } else {
                toast({
                  title: "Import Completed with Errors",
                  description: `Imported ${successCount + result.inserted} orders with ${errorCount + result.errors} errors.`,
                  variant: "destructive"
                });
              }
            }
          } else {
            throw new Error(result.error || 'Unknown error');
          }
        } catch (error: any) {
          console.error("Error importing orders:", error);
          
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
      console.error("Error importing orders:", error);
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
          <h1 className="text-3xl font-bold">Import Orders</h1>
          <p className="text-gray-500">Import your orders data from CSV files</p>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Select Orders CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file containing order data with the following columns: Order Number, Event Date, Event Type, etc.
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
            <CardTitle>Importing Orders...</CardTitle>
            <CardDescription>
              Please wait while we import your orders. This might take a while for large files.
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
              Successfully imported {successCount} orders into your database.
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
              The following orders could not be imported
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
              Review your orders data before importing. First {Math.min(5, parsedData.length)} of {parsedData.length} rows shown.
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
              {importing ? 'Importing...' : 'Import Orders'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <Separator className="my-6" />
      
      <div className="text-sm text-gray-500 mb-10">
        <h3 className="font-medium text-gray-700 mb-2">CSV Format Requirements:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>File must be in CSV format</li>
          <li>Required columns: "Order Number", "Event Date", "Event Type", "Status", "Order Total"</li>
          <li>"Order Number" column will be mapped to the order_number field in the database</li>
          <li>"Contact" or "Contact Email" column will be mapped to contact_id in the database</li>
          <li>"Event Date" column will be mapped to the event_date field in the database</li>
          <li>"Event Type" column will be mapped to the event_type field in the database</li>
          <li>"Order Total" column will be mapped to the total_amount field in the database</li>
          <li>Optional columns: "Theme", "Profit", "Status", "Sub Total Amount", "Discount Amount", "Tax", "Delivery Amount", "Delivery Time", "Date Created"</li>
        </ul>
      </div>
    </div>
  );
};

export default OrdersImport;