import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Utility function to parse CSV
function parseCSV(csv: string) {
  const lines = csv.split('\n');
  const result = [];
  const headers = lines[0].split(',').map(header => header.trim());

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const obj: Record<string, string> = {};
    const currentLine = lines[i].split(',');

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentLine[j]?.trim() || '';
    }

    result.push(obj);
  }

  return { headers, data: result };
}

export default function BakeDiaryImport() {
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Bake Diary specific field mappings
  const mappings = {
    "type": "Type",
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email",
    "phone": "Number"
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setFileName(files[0].name);
    setError(null);
    
    // Read the CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        try {
          const csvContent = event.target.result as string;
          const { headers, data } = parseCSV(csvContent);
          
          console.log('CSV Headers:', headers);
          console.log('CSV Sample Data:', data.slice(0, 2));
          
          setParsedData(data);
        } catch (error) {
          console.error('Error parsing CSV:', error);
          setError('Failed to parse CSV file. Please check the format.');
        }
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
    
    try {
      console.log('Starting upload with parsed data:', parsedData.slice(0, 2));
      
      // Map the data using our mappings
      const mappedData = parsedData.map(item => {
        const mappedItem: Record<string, string> = {};
        for (const [dbField, csvField] of Object.entries(mappings)) {
          mappedItem[dbField] = item[csvField] || '';
        }
        return mappedItem;
      });
      
      console.log('Mapped data sample:', mappedData.slice(0, 2));
      setProgress(50);
      
      // Send data directly to API without file upload
      const response = await fetch('/api/import/json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'contacts',
          data: mappedData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import contacts');
      }
      
      const result = await response.json();
      console.log('Import response:', result);
      
      setProgress(100);
      
      toast({
        title: 'Import Successful',
        description: 'Your contacts have been imported successfully.'
      });
      
      // Redirect to contacts page after successful import
      setTimeout(() => {
        setLocation('/contacts');
      }, 1500);
      
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Failed to import contacts');
      
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import contacts',
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
        onClick={() => setLocation('/data-import-export')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Data Management
      </Button>
      
      <Card className="bg-[#1c1c1c] border-[#333333] text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Import Bake Diary Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload your Bake Diary contacts CSV file to import customer information.
                We'll automatically map the fields from the Bake Diary format.
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
                    variant="secondary"
                    onClick={handleFileSelect}
                    disabled={isUploading}
                  >
                    Select CSV File
                  </Button>
                  
                  <span className="text-sm text-gray-400">
                    {fileName || 'No file selected'}
                  </span>
                </div>
              </div>
              
              {parsedData && (
                <div className="bg-[#2a2a2a] p-3 rounded-md">
                  <p className="text-green-400 mb-2">CSV Preview:</p>
                  <div className="text-xs overflow-auto max-h-32">
                    <pre>{JSON.stringify(parsedData.slice(0, 3), null, 2)}</pre>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-[#7f1d1d] border border-[#b91c1c] text-white p-3 rounded-md flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <div>{error}</div>
                </div>
              )}
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="bg-gray-700" />
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={isUploading || !parsedData}
              >
                Import Contacts
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}