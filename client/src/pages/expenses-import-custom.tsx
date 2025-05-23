import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, FileUp, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Helper function to parse CSV content properly
function parseCSV(content: string) {
  const rows = content.split('\n').filter(line => line.trim());
  
  if (rows.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }
  
  // Parse headers
  const headers = parseCSVLine(rows[0]);
  
  // Process data rows
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const values = parseCSVLine(rows[i]);
    
    // Skip rows that don't have enough values
    if (values.length < 3) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        row[header] = values[index];
      } else {
        row[header] = '';
      }
    });
    
    data.push(row);
  }
  
  return { headers, data };
}

// Helper function to parse a single CSV line properly handling quotes
function parseCSVLine(line: string) {
  const values: string[] = [];
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

// Handle Bake Diary date format
function formatBakeDiaryDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Remove quotes if present
  dateStr = dateStr.replace(/^"|"$/g, '').trim();
  
  // Handle format "DD MMM YYYY" (like "11 Jan 2025")
  const dateParts = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (dateParts) {
    const day = parseInt(dateParts[1]).toString().padStart(2, '0');
    const month = dateParts[2].toLowerCase();
    const year = dateParts[3];
    
    // Map month names to numbers
    const monthMap: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08', 
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    
    if (monthMap[month]) {
      return `${year}-${monthMap[month]}-${day}`;
    }
  }
  
  // Try direct Date object parsing as a fallback
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (err) {
    console.log(`Error parsing date: ${dateStr}`);
  }
  
  return new Date().toISOString().split('T')[0];
}

// Format number to remove currency symbols and commas
function formatNumber(value: string): string {
  return value.replace(/^"|"$/g, '').replace(/[^0-9.]/g, '') || '0';
}

type ImportState = 'idle' | 'reading' | 'previewing' | 'processing' | 'success' | 'error';

const ExpensesImportCustom: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<ImportState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [csvData, setCsvData] = useState<{ headers: string[], data: any[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importedItems, setImportedItems] = useState<any[]>([]);
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setState('reading');
      setErrors([]);
      
      const reader = new FileReader();
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsedData = parseCSV(content);
          
          // Validate headers for Bake Diary format
          if (
            parsedData.headers.includes('Date') &&
            parsedData.headers.includes('Description') &&
            parsedData.headers.includes('Amount (Incl VAT)')
          ) {
            console.log('Detected BakeDiary format');
            console.log('CSV headers:', parsedData.headers);
            if (parsedData.data.length > 0) {
              console.log('First row:', parsedData.data[0]);
              console.log('Total rows:', parsedData.data.length);
            }
            setCsvData(parsedData);
            setState('previewing');
          } else {
            setErrors(['Invalid CSV format: Missing required headers (Date, Description, Amount (Incl VAT))']);
            setState('error');
          }
        } catch (err: any) {
          setErrors([`Error parsing CSV: ${err.message}`]);
          setState('error');
        }
      };
      
      reader.onerror = () => {
        setErrors(['Error reading file']);
        setState('error');
      };
      
      reader.readAsText(event.target.files[0]);
    }
  };
  
  // Handle import button click
  const handleImport = async () => {
    if (!csvData || csvData.data.length === 0) {
      toast({
        title: 'Error',
        description: 'No data to import',
        variant: 'destructive',
      });
      return;
    }
    
    setState('processing');
    setProgress(0);
    setErrors([]);
    setImportedItems([]);
    
    try {
      // Process data directly here (client-side)
      const expenses = [];
      const newErrors = [];
      
      for (let i = 0; i < csvData.data.length; i++) {
        const row = csvData.data[i];
        setProgress(Math.round((i / csvData.data.length) * 100));
        
        try {
          // Extract and validate fields
          const dateText = row['Date'] || '';
          const description = row['Description'] || '';
          const amount = formatNumber(row['Amount (Incl VAT)'] || '0');
          
          if (!dateText || !description || !amount || amount === '0') {
            newErrors.push(`Row ${i + 2}: Missing required fields (Date, Description, or Amount)`);
            continue;
          }
          
          // Convert date format
          const formattedDate = formatBakeDiaryDate(dateText);
          
          // Create complete expense object with proper field mapping
          const expense = {
            date: formattedDate,
            description,
            category: row['Category'] || '',
            supplier: row['Vendor'] || '',
            payment_source: row['Payment'] || '',
            vat: formatNumber(row['VAT'] || '0'),
            amount,
            total_inc_tax: amount
          };
          
          expenses.push(expense);
        } catch (err: any) {
          newErrors.push(`Row ${i + 2}: ${err.message}`);
        }
      }
      
      if (expenses.length === 0) {
        throw new Error('No valid expenses found to import');
      }
      
      setErrors(newErrors);
      
      // Send data to server
      const response = await apiRequest('POST', '/api/expenses/batch', { expenses });
      const result = await response.json();
      
      if (result.success) {
        setImportedItems(result.expenses || []);
        setState('success');
        toast({
          title: 'Success',
          description: `Successfully imported ${result.expenses.length} expenses`,
        });
      } else {
        throw new Error(result.message || 'Failed to import expenses');
      }
    } catch (err: any) {
      console.error('Error importing expenses:', err);
      setErrors(prev => [...prev, `Import error: ${err.message}`]);
      setState('error');
      toast({
        title: 'Import Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };
  
  // Handle triggering file input click
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Render the preview table
  const renderPreview = () => {
    if (!csvData || csvData.data.length === 0) return null;
    
    return (
      <div className="mt-4 border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {csvData.headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {csvData.data.slice(0, 5).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {csvData.headers.map((header, colIndex) => (
                  <TableCell key={colIndex}>{row[header]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {csvData.data.length > 5 && (
          <div className="p-2 text-center text-sm text-gray-500">
            Showing 5 of {csvData.data.length} rows
          </div>
        )}
      </div>
    );
  };
  
  // Render errors
  const renderErrors = () => {
    if (errors.length === 0) return null;
    
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Errors</AlertTitle>
        <AlertDescription>
          {errors.length > 10 ? (
            <div>
              <p className="mb-2">{errors.length} errors found:</p>
              <ul className="ml-6 list-disc">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                <li>...and {errors.length - 10} more</li>
              </ul>
            </div>
          ) : (
            <ul className="ml-6 list-disc">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </AlertDescription>
      </Alert>
    );
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Expenses (Bake Diary Format)</CardTitle>
          <CardDescription>
            Import your expenses from a CSV file exported from Bake Diary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="csvFile">Select CSV File</Label>
              <div className="flex space-x-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={state === 'processing'}
                />
                <Button
                  onClick={triggerFileSelect}
                  disabled={state === 'processing'}
                  className="flex items-center"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Select File
                </Button>
                {file && <Badge variant="outline">{file.name}</Badge>}
              </div>
            </div>
            
            {(state === 'reading' || state === 'processing') && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{state === 'reading' ? 'Reading file...' : 'Processing data...'}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
            
            {state === 'previewing' && csvData && (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>File Loaded Successfully</AlertTitle>
                  <AlertDescription>
                    {csvData.data.length} records found. Preview the first 5 rows below.
                  </AlertDescription>
                </Alert>
                {renderPreview()}
              </>
            )}
            
            {renderErrors()}
            
            {state === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-700">Import Successful!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Successfully imported {importedItems.length} expenses.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/expenses')}>
            Cancel
          </Button>
          
          {state === 'previewing' && (
            <Button onClick={handleImport} disabled={!csvData || csvData.data.length === 0}>
              Import {csvData?.data.length || 0} Expenses
            </Button>
          )}
          
          {state === 'success' && (
            <Button onClick={() => navigate('/expenses')}>
              View Expenses
            </Button>
          )}
          
          {state === 'error' && (
            <Button variant="outline" onClick={() => setState('idle')}>
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExpensesImportCustom;