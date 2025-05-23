import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Check, 
  FileSpreadsheet, 
  Upload, 
  X 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Papa from 'papaparse';

// CSV Column names that we expect in the quotes import CSV file
const EXPECTED_COLUMNS = [
  'Order Number',
  'Contact',
  'Event Date',
  'Event Type',
  'Theme',
  'Order Total'
];

export default function QuotesImport() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setImportResult(null);
    setProcessedData([]);
    setCsvData([]);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Basic validation - check if it's a CSV file
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    
    // Parse the CSV file to preview data
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const csvRows = results.data as any[];
        setCsvData(csvRows.slice(0, 5)); // Show first 5 rows in preview
        
        // Auto-detect column mappings
        const availableColumns = results.meta.fields || [];
        const detectedMappings: Record<string, string> = {};
        
        // Look for matches or close matches
        EXPECTED_COLUMNS.forEach(expectedCol => {
          // Try to find exact match first
          let match = availableColumns.find(col => col === expectedCol);
          
          if (!match) {
            // Try to find a fuzzy match (case insensitive)
            match = availableColumns.find(col => 
              col.toLowerCase().includes(expectedCol.toLowerCase()) || 
              expectedCol.toLowerCase().includes(col.toLowerCase())
            );
          }
          
          if (match) {
            detectedMappings[expectedCol] = match;
          }
        });
        
        setColumnMappings(detectedMappings);
      },
      error: (error) => {
        setError(`Error parsing CSV file: ${error.message}`);
      }
    });
  }, []);

  // Import quotes from the CSV
  const handleImport = useCallback(async () => {
    if (!file) {
      setError('Please select a CSV file first');
      return;
    }
    
    try {
      setProcessing(true);
      setProgress(10);
      setError(null);
      
      // Parse the entire file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const data = results.data as any[];
            setProcessedData(data);
            setProgress(40);
            
            // Map data using the column mappings
            const mappedData = data.map(row => {
              const mappedRow: Record<string, any> = {};
              
              // Apply column mappings
              Object.entries(columnMappings).forEach(([expectedCol, csvCol]) => {
                mappedRow[expectedCol] = row[csvCol];
              });
              
              return mappedRow;
            });
            
            setProgress(70);
            
            // Send data to the server
            const response = await apiRequest('POST', '/api/quotes/import', {
              items: mappedData
            });
            
            setProgress(100);
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to import quotes');
            }
            
            const result = await response.json();
            setImportResult(result);
            
            toast({
              title: 'Quotes imported successfully',
              description: `${result.inserted} quotes imported. ${result.errors} failed.`,
              variant: result.errors > 0 ? 'destructive' : 'default',
            });
          } catch (error: any) {
            setError(error.message || 'An error occurred during import');
            toast({
              title: 'Import failed',
              description: error.message || 'Failed to import quotes',
              variant: 'destructive',
            });
          } finally {
            setProcessing(false);
          }
        },
        error: (error) => {
          setError(`Error parsing CSV file: ${error.message}`);
          setProcessing(false);
          toast({
            title: 'CSV parsing failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      });
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      setProcessing(false);
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import quotes',
        variant: 'destructive',
      });
    }
  }, [file, columnMappings, toast]);

  // Reset state to start over
  const handleReset = useCallback(() => {
    setFile(null);
    setFileName('');
    setProcessing(false);
    setProcessedData([]);
    setProgress(0);
    setCsvData([]);
    setImportResult(null);
    setError(null);
    setColumnMappings({});
  }, []);

  // Update a column mapping
  const updateColumnMapping = useCallback((expectedCol: string, csvCol: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [expectedCol]: csvCol
    }));
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Import Quotes</CardTitle>
          <CardDescription>
            Import quotes from a CSV file. The file should contain columns for Order Number, Contact, Event Date, Event Type, Theme, and Order Total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!processing && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <label htmlFor="quote-csv" className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/50 px-4 py-6 text-center">
                    <FileSpreadsheet className="h-8 w-8 mb-2" />
                    <div className="text-sm font-medium">
                      {fileName || 'Click to select CSV file'}
                    </div>
                    {fileName && (
                      <p className="text-xs text-muted-foreground">{fileName}</p>
                    )}
                    <input
                      id="quote-csv"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <Button 
                  onClick={handleImport} 
                  disabled={!file || processing} 
                  variant="default"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import Quotes
                </Button>
              </div>

              {csvData.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-2">CSV Preview & Column Mapping</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verify that the columns are mapped correctly. You can change mappings if needed.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {EXPECTED_COLUMNS.map((col) => (
                      <div key={col} className="flex items-center gap-2">
                        <span className="text-sm font-medium min-w-[150px]">{col}:</span>
                        <select
                          value={columnMappings[col] || ''}
                          onChange={(e) => updateColumnMapping(col, e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">-- Select CSV Column --</option>
                          {csvData.length > 0 && 
                            Object.keys(csvData[0]).map((csvCol) => (
                              <option key={csvCol} value={csvCol}>{csvCol}</option>
                            ))
                          }
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {csvData.length > 0 && 
                            Object.keys(csvData[0]).map((header) => (
                              <TableHead key={header}>{header}</TableHead>
                            ))
                          }
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {Object.values(row).map((cell: any, cellIndex) => (
                              <TableCell key={cellIndex}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {processing && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">Importing quotes...</h3>
                <p className="text-sm text-muted-foreground">Please wait while we process your file.</p>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {importResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Import Results</h3>
                  <p className="text-sm text-muted-foreground">
                    {importResult.message}
                  </p>
                </div>
                <Button onClick={handleReset} variant="outline">
                  Import Another File
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 p-3 rounded-md">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium">
                    {importResult.inserted} Quotes Imported
                  </span>
                </div>
                
                {importResult.errors > 0 && (
                  <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 p-3 rounded-md">
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-medium">
                      {importResult.errors} Failed
                    </span>
                  </div>
                )}
              </div>

              {importResult.errors > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">Errors</h4>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errorDetails.map((error: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>
                              {Object.entries(error.item).map(([key, value]: [string, any]) => (
                                <div key={key}>
                                  <span className="font-semibold">{key}:</span> {value}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">{error.error}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {importResult.inserted > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">Successful Imports</h4>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quote Number</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Event Date</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.successDetails.map((quote: any) => (
                          <TableRow key={quote.id}>
                            <TableCell>{quote.quoteNumber}</TableCell>
                            <TableCell>{quote.contactName}</TableCell>
                            <TableCell>{quote.eventDate}</TableCell>
                            <TableCell>{quote.eventType}</TableCell>
                            <TableCell>{quote.title}</TableCell>
                            <TableCell>${quote.totalAmount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}