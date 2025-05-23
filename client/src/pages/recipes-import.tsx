import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';

// Simple browser-compatible CSV parser function optimized for Bake Diary recipe export format
function parseCSV(csvText: string) {
  // Split by lines and filter out empty lines
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    return [];
  }
  
  // For Bake Diary recipe format, the actual headers are in the 3rd row (index 2)
  // If there aren't enough lines for this format, default to standard CSV parsing
  let headerLine = 0;
  let dataStartLine = 1;
  
  // Check if we have enough lines to extract headers from 3rd row
  if (lines.length >= 4) {
    // Look for the line that contains "Recipies,Category,Servings,Custom Price" pattern
    for (let i = 0; i < 5 && i < lines.length; i++) {
      if (lines[i].includes("Category") && lines[i].includes("Servings") && 
          (lines[i].includes("Custom Price") || lines[i].includes("Custom"))) {
        headerLine = i;
        dataStartLine = i + 1;
        break;
      }
    }
  }
  
  // Get headers from the identified header line
  const headers = lines[headerLine].split(',').map(header => header.trim());
  
  console.log('Detected header line:', headerLine, 'with headers:', headers);
  console.log('Data starting from line:', dataStartLine);
  
  // Parse records starting from the line after headers
  const records = [];
  for (let i = dataStartLine; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    
    // Split values for each row
    const values = line.split(',').map(value => value.trim());
    
    // Skip lines that are likely not data (e.g., header separators, totals)
    // Skip lines with fewer columns than what we need for meaningful data
    if (values.length < 2 || !values[0] || values[0].includes('----')) {
      continue;
    }
    
    // Create record object
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) { // Only add fields that have a header name
        record[header] = values[index] || '';
      }
    });
    
    // Ensure there's a recipe name
    if (record['Recipies'] && record['Recipies'].length > 0) {
      records.push(record);
    }
  }
  
  return records;
}

export default function RecipesImport() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Recipe specific field mappings - these match exactly to database fields
  const mappings = {
    "name": "Recipies",
    "category": "Category", 
    "servings": "Servings",
    "total_cost": "Custom Price",
    "description": "Description"
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
          if (dbField === 'total_cost') {
            // Convert to numeric, handle currency symbols
            if (item[csvField]) {
              // Handle specific Bake Diary format - may contain price in parentheses or with currency symbols
              let valueToProcess = String(item[csvField]);
              
              // Check for formats like "54.5 $00,4." or "$14.10" or "7.78"
              // First remove any currency symbols and other non-numeric chars except decimal point
              const numericString = valueToProcess.replace(/[^0-9.]/g, '');
              
              // Special case for empty or invalid values
              if (!numericString || numericString === '.') {
                mappedItem[dbField] = 0;
              } else {
                // Handle potential multiple decimal points
                const parts = numericString.split('.');
                if (parts.length > 2) {
                  // If we have multiple decimal points, use the first two parts
                  mappedItem[dbField] = parseFloat(`${parts[0]}.${parts[1]}`);
                } else {
                  mappedItem[dbField] = parseFloat(numericString);
                }
              }
            } else {
              mappedItem[dbField] = 0;
            }
          } else if (dbField === 'servings') {
            // Handle numeric fields and formats like "15 ($0.29)"
            if (item[csvField]) {
              let servingValue = String(item[csvField]);
              
              // Extract just the number part (before any parentheses or spaces)
              const servingsMatch = servingValue.match(/^(\d+)/);
              if (servingsMatch && servingsMatch[1]) {
                mappedItem[dbField] = parseInt(servingsMatch[1]);
              } else {
                // If no clear number is found, try to get any digits
                const numericString = servingValue.replace(/[^0-9]/g, '');
                mappedItem[dbField] = numericString ? parseInt(numericString) : 1;
              }
            } else {
              mappedItem[dbField] = 1; // Default to 1 serving
            }
          } else {
            // Use strings for other fields, remove any extra quotes and clean up
            let cleanValue = '';
            if (item[csvField]) {
              // Remove quotes, normalize whitespace
              cleanValue = String(item[csvField])
                .replace(/^"|"$/g, '')
                .replace(/\\"/g, '"')
                .trim();
            }
            mappedItem[dbField] = cleanValue;
          }
        }
        
        // Set default values for any missing fields to ensure DB compatibility
        mappedItem.description = mappedItem.description || '';
        
        return mappedItem;
      });
      
      console.log('Mapped data sample:', mappedData.slice(0, 2));
      setProgress(50);
      
      // Send data directly to a special direct-SQL API route to bypass ORM
      console.log('Sending the following data to the server (total:', mappedData.length, 'records)');
      
      const response = await fetch('/api/recipes/direct-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipes: mappedData
        })
      });
      
      setProgress(90);
      
      if (!response.ok) {
        throw new Error('Failed to import recipes: ' + response.statusText);
      }
      
      try {
        const result = await response.json();
        console.log('Import response:', result);
        
        if (!result.success) {
          throw new Error(result.error || result.message || 'Failed to import recipes');
        }
      } catch (jsonError) {
        // If we can't parse JSON but the response was OK, consider it a success
        console.warn('Could not parse JSON response, but request was successful');
      }
      
      setProgress(100);
      
      toast({
        title: 'Import Successful',
        description: 'Your recipes have been imported successfully.'
      });
      
      // Redirect to recipes page after successful import
      setTimeout(() => {
        window.location.href = '/data';
      }, 1500);
      
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import recipes');
      
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import recipes',
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
          <CardTitle className="text-2xl">Import Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload your Recipes CSV file to import your bakery recipe information.
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
                      <span>Importing recipes...</span>
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
                Import Recipes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}