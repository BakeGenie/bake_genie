import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Simple browser-compatible CSV parser function
function parseCSV(csvText: string) {
  // Split by lines and filter out empty lines
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return [];
  }
  
  // Get headers (first line)
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Parse records
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    
    // Skip lines that don't have enough values
    if (values.length < headers.length) {
      continue;
    }
    
    // Create record object
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    records.push(record);
  }
  
  return records;
}

export default function SuppliesImport() {
  const [location, setLocation] = useLocation();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Supplies specific field mappings - using camelCase for database fields
  const mappings = {
    "name": "Supplies",
    "supplier": "Supplier",
    "category": "Category",
    "price": "Item Price"
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setCsvFile(null);
      setParsedData(null);
      return;
    }
    
    setCsvFile(files[0]);
    setError(null);
    
    // Read and parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        
        // Parse CSV with a simple browser-compatible parser
        const records = parseCSV(content);
        
        console.log('CSV Headers:', Object.keys(records[0]));
        console.log('CSV Sample Data:', records.slice(0, 2));
        
        setParsedData(records);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setError('Could not parse CSV file. Make sure it\'s a valid CSV file.');
        setParsedData(null);
      }
    };
    reader.readAsText(files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!parsedData) {
      setError('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    setProgress(10);
    setError(null);
    
    try {
      // Map the data using our mappings
      const mappedData = parsedData.map(item => {
        const mappedItem: Record<string, any> = {};
        for (const [dbField, csvField] of Object.entries(mappings)) {
          // Make sure we're using the right data types
          if (dbField === 'price') {
            // Convert to numeric, handle currency symbols
            if (item[csvField]) {
              // Remove currency symbols, quotes and other non-numeric chars except decimal point
              const numericString = String(item[csvField]).replace(/[^0-9.]/g, '');
              mappedItem[dbField] = numericString ? parseFloat(numericString) : null;
            } else {
              mappedItem[dbField] = null;
            }
          } else {
            // Use strings for other fields, remove any extra quotes
            const cleanValue = item[csvField] ? String(item[csvField]).replace(/^"|"$/g, '').trim() : '';
            mappedItem[dbField] = cleanValue;
          }
        }
        return mappedItem;
      });
      
      console.log('Mapped data sample:', mappedData.slice(0, 2));
      setProgress(50);
      
      // Send data directly to API without file upload - use the special fixed endpoint
      const response = await fetch('/api/data-fixed/import/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'supplies',
          data: mappedData
        })
      });
      
      setProgress(90);
      
      if (!response.ok) {
        throw new Error('Failed to import supplies: ' + response.statusText);
      }
      
      try {
        const result = await response.json();
        console.log('Import response:', result);
        
        if (!result.success) {
          throw new Error(result.error || result.message || 'Failed to import supplies');
        }
      } catch (jsonError) {
        // If we can't parse JSON but the response was OK, consider it a success
        console.warn('Could not parse JSON response, but request was successful');
      }
      
      setProgress(100);
      
      toast({
        title: 'Import Successful',
        description: 'Your supplies have been imported successfully.'
      });
      
      // Redirect to supplies page after successful import
      setTimeout(() => {
        window.location.href = '/data';
      }, 1500);
      
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import supplies');
      
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import supplies',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => window.location.href = '/data'}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Data Management
      </Button>
      
      <Card className="bg-[#1c1c1c] border-[#333333] text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Import Supplies</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload your Supplies CSV file to import your bakery supply information.
                We'll automatically map the fields from your CSV file.
              </p>
              
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
                    onClick={handleFileSelect}
                    variant="outline"
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {csvFile ? 'Change File' : 'Select File'}
                  </Button>
                  
                  {csvFile && (
                    <span className="text-sm text-gray-400">
                      {csvFile.name}
                    </span>
                  )}
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Importing supplies...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                )}
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                {parsedData && parsedData.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Data Preview</h3>
                    <div className="border rounded overflow-auto max-h-60">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.entries(mappings).map(([dbField, csvField]) => (
                              <TableHead key={dbField}>
                                {csvField} ➔ {dbField}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 5).map((row, i) => (
                            <TableRow key={i}>
                              {Object.entries(mappings).map(([dbField, csvField]) => (
                                <TableCell key={`${i}-${dbField}`}>
                                  {row[csvField] || ''}
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
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!parsedData || isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                Import Supplies
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}