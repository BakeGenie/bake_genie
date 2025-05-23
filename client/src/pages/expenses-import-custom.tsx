import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileUp, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Helper function to parse CSV content properly
function parseCSV(content: string) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Get headers from the first line
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    
    // Create an object with header keys and row values
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
  
  return { headers, rows };
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : null;
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quotes inside quotes
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      result.push(currentValue);
      currentValue = '';
    } else {
      // Regular character
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  
  return result;
}

// Special function to handle Bake Diary date format
function formatBakeDiaryDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Try different date formats (DD/MM/YYYY, MM/DD/YYYY, etc.)
  const dateParts = dateStr.split('/');
  if (dateParts.length === 3) {
    // Assuming DD/MM/YYYY format used by Bake Diary
    const [day, month, year] = dateParts;
    // Create ISO format YYYY-MM-DD
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If that fails, try direct parsing
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Return original if all parsing fails
  return dateStr;
}

// Format number to remove currency symbols and handle different formats
function formatNumber(value: string): string {
  if (!value) return '';
  
  // Remove currency symbols, commas, and other non-numeric characters except decimal point
  return value.replace(/[^0-9.-]/g, '');
}

type ImportState = 'idle' | 'reading' | 'previewing' | 'processing' | 'success' | 'error';

const ExpensesImportCustom = () => {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvData, setCsvData] = useState<{ headers: string[], rows: Record<string, string>[] }>();
  const [importState, setImportState] = useState<ImportState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<any[]>([]);
  const [importedItems, setImportedItems] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Special field mapping for Bake Diary format
  const fieldMapping: Record<string, string> = {
    'Date': 'date',
    'Description': 'description',
    'Category': 'category',
    'Vendor': 'supplier', // Map Vendor to supplier field
    'Payment': 'paymentSource', // Map Payment to paymentSource field
    'VAT': 'vat',
    'Amount': 'amount',
    'Amount (Incl VAT)': 'amount' // Handle the actual format in Bake Diary CSV
  };
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      readFile(file);
    }
  };
  
  // Read the file contents
  const readFile = (file: File) => {
    setImportState('reading');
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = parseCSV(content);
        setCsvData(parsedData);
        setImportState('previewing');
      } catch (err: any) {
        setError(`Error parsing CSV file: ${err.message}`);
        setImportState('error');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file');
      setImportState('error');
    };
    
    reader.readAsText(file);
  };
  
  // Import the data to the server
  const handleImport = async () => {
    if (!csvData || !csvData.rows.length) {
      setError('No data to import');
      return;
    }
    
    setImportState('processing');
    setProgress(0);
    setError(null);
    setSuccessCount(0);
    setErrorCount(0);
    setErrorDetails([]);
    setImportedItems([]);
    
    // Map CSV data to expense objects
    const expenses = csvData.rows.map(row => {
      // Map fields from CSV to database fields using our mapping
      const expense: Record<string, any> = {};
      
      Object.entries(fieldMapping).forEach(([csvField, dbField]) => {
        if (row[csvField] !== undefined) {
          // Apply special formatting based on field type
          if (csvField === 'Date') {
            expense[dbField] = formatBakeDiaryDate(row[csvField]);
          } else if (csvField === 'Amount' || csvField === 'Amount (Incl VAT)' || csvField === 'VAT') {
            // Special handling for Amount (Incl VAT) field from Bake Diary
            if (csvField === 'Amount (Incl VAT)') {
              expense[dbField] = formatNumber(row[csvField]);
              expense['totalIncTax'] = formatNumber(row[csvField]);
            } else {
              expense[dbField] = formatNumber(row[csvField]);
            }
          } else {
            expense[dbField] = row[csvField];
          }
        }
      });
      
      // Set defaults for any missing fields
      expense.taxDeductible = true;
      
      // Only set totalIncTax if it hasn't been set by Amount (Incl VAT)
      if (!expense.totalIncTax) {
        expense.totalIncTax = expense.amount;
      }
      
      return expense;
    });
    
    try {
      // Log what we're about to send for debugging
      console.log("About to import expenses:", expenses);
      
      // Process expenses in batches for reliability
      const batchSize = 5; // Smaller batch size for testing
      const totalBatches = Math.ceil(expenses.length / batchSize);
      
      for (let i = 0; i < expenses.length; i += batchSize) {
        const batch = expenses.slice(i, i + batchSize);
        
        // Update progress
        const currentProgress = Math.round(((i + batch.length) / expenses.length) * 100);
        setProgress(currentProgress);
        
        try {
          // Send batch to server
          console.log(`Sending batch ${Math.floor(i/batchSize) + 1} of ${totalBatches}:`, batch);
          
          const response = await apiRequest('POST', '/api/expenses/bake-diary/import', {
            items: batch
          });
          
          const result = await response.json();
          console.log("Batch result:", result);
          
          if (result.success) {
            setSuccessCount(prev => prev + result.inserted);
            setErrorCount(prev => prev + result.errors);
            
            if (result.errorDetails && result.errorDetails.length > 0) {
              console.error("Error details:", result.errorDetails);
              setErrorDetails(prev => [...prev, ...result.errorDetails]);
            }
            
            if (result.successDetails && result.successDetails.length > 0) {
              setImportedItems(prev => [...prev, ...result.successDetails]);
            }
          } else {
            console.error("Batch failed:", result);
            throw new Error(result.error || 'Import failed');
          }
        } catch (batchErr) {
          console.error(`Error processing batch ${Math.floor(i/batchSize) + 1}:`, batchErr);
          throw batchErr;
        }
      }
      
      setImportState('success');
      setProgress(100);
    } catch (err: any) {
      setError(`Import failed: ${err.message}`);
      setImportState('error');
    }
  };
  
  // Trigger file browser
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };
  
  // Return to expenses page
  const handleDone = () => {
    setLocation('/expenses');
  };
  
  // Reset the import process
  const handleReset = () => {
    setImportState('idle');
    setSelectedFile(null);
    setCsvData(undefined);
    setError(null);
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    setErrorDetails([]);
    setImportedItems([]);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Import Bake Diary Expenses</CardTitle>
          <CardDescription>
            Import expense data from Bake Diary CSV export files.
            This special importer understands Bake Diary column names and formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Selection */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSelectFile}
                  disabled={importState === 'processing'}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Select File
                </Button>
                {selectedFile && (
                  <span className="text-sm text-muted-foreground">
                    {selectedFile.name}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Processing progress */}
            {importState === 'processing' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Importing...</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            
            {/* Success state */}
            {importState === 'success' && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Import Complete</AlertTitle>
                <AlertDescription>
                  Successfully imported {successCount} expense records.
                  {errorCount > 0 && ` Failed to import ${errorCount} records.`}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Data preview */}
            {importState === 'previewing' && csvData && csvData.rows.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Preview</h3>
                <div className="border rounded-md overflow-x-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvData.headers.map((header, index) => (
                          <TableHead key={index}>
                            {header}
                            {Object.keys(fieldMapping).includes(header) && (
                              <Badge variant="outline" className="ml-2">
                                → {fieldMapping[header]}
                              </Badge>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {csvData.headers.map((header, cellIndex) => (
                            <TableCell key={cellIndex}>{row[header]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {csvData.rows.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {csvData.rows.length} rows
                  </p>
                )}
              </div>
            )}
            
            {/* Results tabs */}
            {importState === 'success' && (
              <Tabs defaultValue="imported">
                <TabsList>
                  <TabsTrigger value="imported">
                    Imported Items ({successCount})
                  </TabsTrigger>
                  <TabsTrigger value="errors" disabled={errorCount === 0}>
                    Errors ({errorCount})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="imported" className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importedItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.amount}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>{item.paymentSource}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="errors" className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Error</TableHead>
                        <TableHead>Item</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errorDetails.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell>{detail.error}</TableCell>
                          <TableCell>
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(detail.item, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              {importState === 'idle' || importState === 'reading' ? (
                <Button variant="outline" onClick={handleDone}>
                  Cancel
                </Button>
              ) : (
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
              
              {importState === 'previewing' && (
                <Button onClick={handleImport}>
                  Import
                </Button>
              )}
              
              {importState === 'success' && (
                <Button onClick={handleDone}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpensesImportCustom;