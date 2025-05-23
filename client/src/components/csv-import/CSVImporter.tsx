import React, { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Upload, FileUp, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import Papa from 'papaparse';

interface FieldMapping {
  dbField: string;
  displayName: string;
  required?: boolean;
}

interface CSVImporterProps {
  title: string;
  description: string;
  onBack: () => void;
  onImportComplete: (result: any) => void;
  apiEndpoint: string;
  fieldMappings: FieldMapping[];
  userId: number;
}

export default function CSVImporter({
  title,
  description,
  onBack,
  onImportComplete,
  apiEndpoint,
  fieldMappings,
  userId,
}: CSVImporterProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<'upload' | 'preview' | 'import'>('upload');
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize column mapping with empty values for all expected database fields
  const initialMapping = fieldMappings.reduce((acc: Record<string, string>, field) => {
    acc[field.dbField] = '';
    return acc;
  }, {});
  
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(initialMapping);

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
      
      // Automatically process the file when selected
      processCSVFile(selectedFile);
    }
  };
  
  // Extract the CSV processing logic to a separate function
  const processCSVFile = async (csvFile: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Read the file directly using FileReader
      const fileText = await csvFile.text();
      
      // Parse CSV using PapaParse
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Handle successful parsing
          const parsedData = results.data;
          if (parsedData.length === 0) {
            throw new Error('The CSV file is empty or improperly formatted.');
          }

          // Extract headers from first row
          const firstRow = parsedData[0] as Record<string, any>;
          const csvHeaders = Object.keys(firstRow);
          
          setHeaders(csvHeaders);
          setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows
          setTotalRows(parsedData.length);
          
          // Try to automatically map columns based on header names
          const newMapping = { ...initialMapping };
          
          fieldMappings.forEach(field => {
            const dbFieldLower = field.dbField.toLowerCase().replace(/_/g, ' ');
            const displayNameLower = field.displayName.toLowerCase();
            
            csvHeaders.forEach(header => {
              const headerLower = header.toLowerCase();
              
              if (
                headerLower === dbFieldLower ||
                headerLower === displayNameLower ||
                headerLower.includes(dbFieldLower) ||
                headerLower.includes(displayNameLower)
              ) {
                newMapping[field.dbField] = header;
              }
            });
          });
          
          setColumnMapping(newMapping);
          setCurrentTab('preview');
          
          toast({
            title: 'File Loaded',
            description: `Successfully loaded ${parsedData.length} rows from ${csvFile.name}.`,
          });
          setIsUploading(false);
        },
        error: (error) => {
          throw new Error(`Failed to parse CSV: ${error.message}`);
        }
      });
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file');
      toast({
        title: 'Upload Failed',
        description: err.message || 'An error occurred while processing the file.',
        variant: 'destructive',
      });
      setIsUploading(false);
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

    try {
      // Read the file directly using FileReader
      const fileText = await file.text();
      
      // Parse CSV using PapaParse
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Handle successful parsing
          const parsedData = results.data;
          if (parsedData.length === 0) {
            throw new Error('The CSV file is empty or improperly formatted.');
          }

          // Extract headers from first row
          const firstRow = parsedData[0] as Record<string, any>;
          const csvHeaders = Object.keys(firstRow);
          
          setHeaders(csvHeaders);
          setPreviewData(parsedData.slice(0, 5)); // Show first 5 rows
          setTotalRows(parsedData.length);
          
          // Try to automatically map columns based on header names
          const newMapping = { ...initialMapping };
          
          fieldMappings.forEach(field => {
            const dbFieldLower = field.dbField.toLowerCase().replace(/_/g, ' ');
            const displayNameLower = field.displayName.toLowerCase();
            
            csvHeaders.forEach(header => {
              const headerLower = header.toLowerCase();
              
              if (
                headerLower === dbFieldLower ||
                headerLower === displayNameLower ||
                headerLower.includes(dbFieldLower) ||
                headerLower.includes(displayNameLower)
              ) {
                newMapping[field.dbField] = header;
              }
            });
          });
          
          setColumnMapping(newMapping);
          setCurrentTab('preview');
          
          toast({
            title: 'File Loaded',
            description: `Successfully loaded ${parsedData.length} rows from ${file.name}.`,
          });
          setIsUploading(false);
        },
        error: (error) => {
          throw new Error(`Failed to parse CSV: ${error.message}`);
        }
      });
    } catch (err: any) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file');
      toast({
        title: 'Upload Failed',
        description: err.message || 'An error occurred while processing the file.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    // Validate required fields
    const missingRequiredFields = fieldMappings
      .filter(field => field.required)
      .filter(field => !columnMapping[field.dbField]);
    
    if (missingRequiredFields.length > 0) {
      const missingFieldNames = missingRequiredFields
        .map(field => field.displayName)
        .join(', ');
      
      toast({
        title: 'Missing Required Fields',
        description: `Please map the following required fields: ${missingFieldNames}`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsImporting(true);
    setError(null);

    try {
      // Read the full file data again
      const fileText = await file!.text();
      
      // Parse the entire CSV file
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const allData = results.data;
          
          // Send the data to the server for import
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              records: allData,
              columnMapping,
              userId,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to import data');
          }

          const result = await response.json();
          setImportResult(result);
          setImportComplete(true);
          setCurrentTab('import');
          onImportComplete(result);

          toast({
            title: 'Import Complete',
            description: result.message || `Successfully imported ${result.successCount} records.`,
          });
        },
        error: (error) => {
          throw new Error(`Failed to parse CSV: ${error.message}`);
        }
      });
    } catch (err: any) {
      console.error('Error importing data:', err);
      setError(err.message || 'Failed to import data');
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
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
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
              <li>Upload a CSV file with your data</li>
              <li>Map columns to appropriate fields in the next step</li>
              <li>Fields will be matched to our database fields</li>
              <li>Expected columns: {fieldMappings.map(f => f.displayName).join(', ')}</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
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
            {fieldMappings.map(field => (
              <div key={field.dbField} className="flex flex-col space-y-2">
                <Label htmlFor={field.dbField}>
                  {field.displayName}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Select 
                  value={columnMapping[field.dbField]} 
                  onValueChange={(value) => handleSelectMapping(field.dbField, value)}
                >
                  <SelectTrigger id={field.dbField}>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none_">None {field.required ? '' : '(Skip)'}</SelectItem>
                    {headers.map((header) => (
                      <SelectItem key={header} value={header}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
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
              Import {totalRows} Records
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
          {importResult?.message || `Import process completed.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {importResult?.successCount > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <p className="text-lg">
                Successfully imported {importResult.successCount} records
              </p>
            </div>
          )}
          
          {importResult?.errorCount > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Some records couldn't be imported</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{importResult.errorCount} records failed to import.</p>
                
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      {importResult.errors.map((err: any, idx: number) => (
                        <li key={idx}>
                          Row {err.row}: {err.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {importResult?.successCount === 0 && importResult?.errorCount === 0 && (
            <div className="text-amber-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>No records were processed.</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Import
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-6">
      {currentTab === 'upload' && renderUploadTab()}
      {currentTab === 'preview' && renderPreviewTab()}
      {currentTab === 'import' && renderImportTab()}
    </div>
  );
}