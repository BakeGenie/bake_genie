import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertCircle, ArrowLeft, Upload, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function QuotesImport() {
  const [, setLocation] = useLocation();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        // Simple CSV parsing
        const rows = content.split('\n').map(row => 
          row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
        );
        
        // Extract headers and data
        const headers = rows[0];
        const data = rows.slice(1).filter(row => row.length === headers.length && row.some(cell => cell));
        
        // Create records with headers as keys
        const records = data.map(row => {
          const record: Record<string, string> = {};
          headers.forEach((header, index) => {
            record[header] = row[index] || '';
          });
          return record;
        });
        
        setParsedData(records);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setError('Could not parse CSV file. Make sure it\'s a valid CSV file.');
        setParsedData(null);
      }
    };
    reader.readAsText(files[0]);
  };
  
  const handleSubmit = async () => {
    if (!parsedData || parsedData.length === 0) {
      setError('No data to import. Please select a valid CSV file first.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create a mapping between CSV columns and database fields
      // This is a simplified version - in a real app, you'd probably want the user to map fields
      const columnMapping: Record<string, string> = {};
      
      // Try to intelligently map common column names to database fields
      Object.keys(parsedData[0]).forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('quote') && (lowerHeader.includes('number') || lowerHeader.includes('id'))) {
          columnMapping.quote_number = header;
        } else if (lowerHeader.includes('contact') || lowerHeader.includes('customer') || lowerHeader.includes('client')) {
          columnMapping.contact_name = header;
        } else if (lowerHeader.includes('event') && lowerHeader.includes('date')) {
          columnMapping.event_date = header;
        } else if (lowerHeader.includes('event') && lowerHeader.includes('type')) {
          columnMapping.event_type = header;
        } else if (lowerHeader.includes('description')) {
          columnMapping.description = header;
        } else if (lowerHeader.includes('price') || lowerHeader.includes('amount') || lowerHeader.includes('total')) {
          columnMapping.price = header;
        } else if (lowerHeader.includes('status')) {
          columnMapping.status = header;
        } else if (lowerHeader.includes('expiry') || lowerHeader.includes('expire')) {
          columnMapping.expiry_date = header;
        } else if (lowerHeader.includes('notes') || lowerHeader.includes('comment')) {
          columnMapping.notes = header;
        }
      });
      
      // Send the data to the server
      const response = await fetch('/api/quotes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: parsedData,
          columnMapping: columnMapping,
          userId: 1  // Default user ID for testing
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Import Successful',
          description: result.message || `Successfully imported ${result.successCount} quotes.`,
        });
        
        // Optional: Redirect back to data management after successful import
        setTimeout(() => setLocation('/data'), 1500);
      } else {
        setError(result.message || 'Failed to import quotes.');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => setLocation('/data')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Data Management
      </Button>
      
      <Card className="bg-[#1c1c1c] border-[#333333] text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Import Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload your Quotes CSV file to review your quote information.
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
                            {Object.keys(parsedData[0]).map(header => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedData.slice(0, 5).map((row, i) => (
                            <TableRow key={i}>
                              {Object.values(row).map((value, j) => (
                                <TableCell key={`${i}-${j}`}>{String(value)}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-2">
                      Showing {Math.min(5, parsedData.length)} of {parsedData.length} rows
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !parsedData}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Importing...' : 'Import Quotes'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}