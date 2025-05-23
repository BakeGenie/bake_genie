import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowLeft, Upload } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';

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

export default function ExpensesImport() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setIsUploading(true);
    setProgress(5);
    setError(null);
    setSuccess(null);

    try {
      // Parse CSV file
      const fileContent = await csvFile.text();
      const parsedData = parseCSV(fileContent);
      
      if (parsedData.length === 0) {
        setError('No valid data found in the CSV file.');
        setIsUploading(false);
        return;
      }
      
      // Display sample for debugging
      console.log('CSV Headers:', Object.keys(parsedData[0]));
      console.log('CSV Sample Data:', parsedData.slice(0, 2));
      
      // Expense specific field mappings - these match exactly to database fields
      const mappings = {
        "date": "Date",
        "description": "Description", 
        "category": "Category",
        "amount": "Amount",
        "supplier": "Vendor",
        "paymentSource": "PaymentMethod",
        "vat": "VAT",
        "totalIncTax": "Total",
        "taxDeductible": "TaxDeductible"
      };
      
      setProgress(10);
      setError(null);
      
      try {
        // Map the data using our mappings
        const mappedData = parsedData.map(item => {
          const mappedItem: Record<string, any> = {};
          for (const [dbField, csvField] of Object.entries(mappings)) {
            // Make sure we're using the right data types
            if (dbField === 'amount' || dbField === 'vat' || dbField === 'totalIncTax') {
              // Convert to numeric, handle currency symbols
              if (item[csvField]) {
                // Remove currency symbols, quotes and other non-numeric chars except decimal point
                const numericString = String(item[csvField]).replace(/[^0-9.]/g, '');
                mappedItem[dbField] = numericString ? parseFloat(numericString) : 0;
              } else {
                mappedItem[dbField] = 0;
              }
            } else if (dbField === 'taxDeductible') {
              // Handle boolean fields
              const value = String(item[csvField] || '').toLowerCase();
              mappedItem[dbField] = value === 'yes' || value === 'true' || value === '1';
            } else if (dbField === 'date') {
              // Handle date fields
              if (item[csvField]) {
                // Try to parse the date
                const dateStr = String(item[csvField]).trim();
                try {
                  // Convert to ISO date format
                  const dateParts = dateStr.split(/[/\-\.]/);
                  // Assume date format is MM/DD/YYYY or DD/MM/YYYY based on the values
                  let month, day, year;
                  
                  if (dateParts.length === 3) {
                    // Try to guess the format based on values
                    const first = parseInt(dateParts[0]);
                    const second = parseInt(dateParts[1]);
                    
                    if (first <= 12 && second > 12) {
                      // Likely MM/DD/YYYY
                      [month, day, year] = dateParts;
                    } else {
                      // Likely DD/MM/YYYY
                      [day, month, year] = dateParts;
                    }
                    
                    // Ensure year is 4 digits
                    if (year.length === 2) {
                      year = '20' + year; // Assuming all years are 2000+
                    }
                    
                    mappedItem[dbField] = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                  } else {
                    // Try direct parsing
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                      mappedItem[dbField] = date.toISOString().split('T')[0];
                    } else {
                      mappedItem[dbField] = new Date().toISOString().split('T')[0]; // Default to today
                    }
                  }
                } catch (error) {
                  console.error('Error parsing date:', error);
                  mappedItem[dbField] = new Date().toISOString().split('T')[0]; // Default to today
                }
              } else {
                mappedItem[dbField] = new Date().toISOString().split('T')[0]; // Default to today
              }
            } else {
              // Use strings for other fields, remove any extra quotes
              const cleanValue = item[csvField] ? String(item[csvField]).replace(/^"|"$/g, '').trim() : '';
              mappedItem[dbField] = cleanValue;
            }
          }
          
          // Set default values for any missing fields to ensure DB compatibility
          mappedItem.description = mappedItem.description || '';
          mappedItem.category = mappedItem.category || 'Other';
          mappedItem.isRecurring = false; // Default value
          
          return mappedItem;
        });
        
        console.log('Mapped data sample:', mappedData.slice(0, 2));
        setProgress(50);
        
        // Send the mapped data to the server
        console.log('Sending the following data to the server (total:', mappedData.length, 'records)');
        
        const response = await fetch('/api/expenses/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            expenses: mappedData
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to import expenses');
        }
        
        const result = await response.json();
        console.log('Import response:', result);
        
        queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
        
        setProgress(100);
        setSuccess(`Successfully imported ${result.data.imported} expenses. ${result.data.failed ? `Failed to import ${result.data.failed} expenses.` : ''}`);
        setTimeout(() => {
          navigate('/expenses');
        }, 2000);
      } catch (error: any) {
        console.error('Error mapping or uploading data:', error);
        setError(`Error processing CSV data: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error reading or parsing file:', error);
      setError(`Error reading CSV file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/data')} className="mr-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Import Expenses</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Expenses CSV</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border border-green-200">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <Input 
                id="csvFile" 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload a CSV file with expense data. The file should have headers for Date, Description, Category, Amount, Vendor, Payment Method, VAT, Total, and Tax Deductible.
              </p>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => navigate('/data')} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!csvFile || isUploading}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}