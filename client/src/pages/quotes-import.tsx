import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Upload, FileUp, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';


export default function QuotesImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const userId = 1; // Default user ID
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [filePath, setFilePath] = useState<string>('');
  const [totalRows, setTotalRows] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<'upload' | 'preview' | 'import'>('upload');
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Default column mapping for quotes
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    quote_id: '',
    name: '',
    event_date: '',
    event_type: '',
    description: '',
    price: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/quotes-import/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const data = await response.json();
      setHeaders(data.headers);
      setPreviewData(data.preview);
      setFilePath(data.filePath);
      setTotalRows(data.totalRows);
      setCurrentTab('preview');

      // Try to automatically map columns based on header names
      const newMapping = { ...columnMapping };
      data.headers.forEach((header: string) => {
        const headerLower = header.toLowerCase();
        
        if (headerLower.includes('order') && headerLower.includes('number')) {
          newMapping.quote_id = header;
        } else if (headerLower.includes('contact') || headerLower === 'name' || headerLower === 'customer') {
          newMapping.name = header;
        } else if (headerLower.includes('event') && headerLower.includes('date')) {
          newMapping.event_date = header;
        } else if (headerLower.includes('event') && headerLower.includes('type')) {
          newMapping.event_type = header;
        } else if (headerLower.includes('theme') || headerLower.includes('description')) {
          newMapping.description = header;
        } else if (headerLower.includes('price') || headerLower.includes('total')) {
          newMapping.price = header;
        }
      });
      
      setColumnMapping(newMapping);
      
      toast({
        title: 'File Uploaded',
        description: `Successfully uploaded ${file.name}.`,
      });
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
      toast({
        title: 'Upload Failed',
        description: err.message || 'An error occurred while uploading the file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/quotes-import/import', {
        filePath,
        columnMapping,
        userId: userId,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import quotes');
      }

      const result = await response.json();
      setImportResult(result);
      setImportComplete(true);
      setCurrentTab('import');

      toast({
        title: 'Import Complete',
        description: result.message || `Successfully imported ${result.importedCount} quotes.`,
      });
    } catch (err: any) {
      console.error('Error importing quotes:', err);
      setError(err.message || 'Failed to import quotes');
      toast({
        title: 'Import Failed',
        description: err.message || 'An error occurred during import.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectMapping = (field: string, value: string) => {
    setColumnMapping({
      ...columnMapping,
      [field]: value,
    });
  };

  const renderUploadTab = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Quote List CSV</CardTitle>
        <CardDescription>
          Upload a CSV file containing quotes data to import into the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid w-full max-w-md items-center gap-1.5">
            <Label htmlFor="file">CSV File</Label>
            <div className="flex gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button 
                type="button" 
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-sm text-muted-foreground mt-4">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Upload a CSV file with quote data</li>
              <li>Map columns to appropriate fields in the next step</li>
              <li>Fields will be matched to our database fields</li>
              <li>Expected columns: Quote Number/ID, Contact Name, Event Date, Event Type, Description, Price</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation('/data')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Data Import
        </Button>
      </CardFooter>
    </Card>
  );

  const renderPreviewTab = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Preview and Map Columns</CardTitle>
        <CardDescription>
          Preview the first few rows of your data and map the columns to appropriate fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="quote_id">Quote ID/Number</Label>
              <Select value={columnMapping.quote_id} onValueChange={(value) => handleSelectMapping('quote_id', value)}>
                <SelectTrigger id="quote_id">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Auto-generate)</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="name">Contact Name</Label>
              <Select value={columnMapping.name} onValueChange={(value) => handleSelectMapping('name', value)}>
                <SelectTrigger id="name">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="event_date">Event Date</Label>
              <Select value={columnMapping.event_date} onValueChange={(value) => handleSelectMapping('event_date', value)}>
                <SelectTrigger id="event_date">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select value={columnMapping.event_type} onValueChange={(value) => handleSelectMapping('event_type', value)}>
                <SelectTrigger id="event_type">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="description">Description/Theme</Label>
              <Select value={columnMapping.description} onValueChange={(value) => handleSelectMapping('description', value)}>
                <SelectTrigger id="description">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="price">Price/Total</Label>
              <Select value={columnMapping.price} onValueChange={(value) => handleSelectMapping('price', value)}>
                <SelectTrigger id="price">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {previewData && previewData.length > 0 && (
            <div className="border rounded-md mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header} className="whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header) => (
                        <TableCell key={header} className="whitespace-nowrap">
                          {row[header] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentTab('upload')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleImport} disabled={isImporting}>
          {isImporting ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              Import {totalRows} Quotes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );

  const renderImportTab = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Complete</CardTitle>
        <CardDescription>
          {importResult?.message || `Successfully imported quotes from your CSV file.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <p className="text-lg">
              Successfully imported {importResult?.importedCount || 0} quotes
            </p>
          </div>
          
          {importResult?.errors && importResult.errors.length > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Some quotes couldn't be imported</AlertTitle>
              <AlertDescription>
                {importResult.errors.length} error(s) occurred during import.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Your quotes have been successfully imported into the system. You can now view and manage them in the Quotes section.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setLocation('/data')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Data Import
        </Button>
        <Button onClick={() => setLocation('/quotes')}>
          View Quotes
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <SEO 
        title="Import Quotes - BakeDiary" 
        description="Import quote data from CSV files into your BakeDiary account" 
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Import Quotes</h1>
          <p className="text-muted-foreground">
            Import your quote data from a CSV file
          </p>
        </div>
        
        {currentTab === 'upload' && renderUploadTab()}
        {currentTab === 'preview' && renderPreviewTab()}
        {currentTab === 'import' && renderImportTab()}
      </div>
    </div>
  );
}