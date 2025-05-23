import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function BakeDiaryImport() {
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.[0]) {
      setError('Please select a file first');
      return;
    }
    
    setIsUploading(true);
    setProgress(10);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('type', 'contacts');
    
    // Add mappings for Bake Diary contacts format
    const mappings = {
      "type": "Type",
      "first_name": "First Name",
      "last_name": "Last Name",
      "email": "Email",
      "phone": "Number"
    };
    
    formData.append('mappings', JSON.stringify(mappings));
    
    try {
      setProgress(30);
      
      // Use fetch directly
      const response = await fetch('/api/data/import', {
        method: 'POST',
        body: formData,
      });
      
      setProgress(70);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import contacts');
      }
      
      setProgress(100);
      
      toast({
        title: 'Import Successful',
        description: 'Your contacts have been imported successfully.'
      });
      
      // Redirect to contacts page after successful import
      setTimeout(() => {
        setLocation('/contacts');
      }, 1500);
      
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import contacts');
      toast({
        title: 'Import Failed',
        description: err instanceof Error ? err.message : 'Failed to import contacts',
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
                disabled={isUploading || !fileName}
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