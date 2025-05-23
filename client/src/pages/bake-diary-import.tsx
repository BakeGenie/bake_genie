import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import SimpleFileUpload from '@/components/import/simple-file-upload';

export default function BakeDiaryImport() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Bake Diary specific field mappings
  const mappings = {
    "type": "Type",
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email",
    "phone": "Number"
  };

  const handleUploadComplete = (result: any) => {
    toast({
      title: 'Import Successful',
      description: 'Your contacts have been imported successfully.'
    });
    
    // Redirect to contacts page after successful import
    setTimeout(() => {
      setLocation('/contacts');
    }, 1500);
  };

  const handleUploadError = (error: string) => {
    toast({
      title: 'Import Failed',
      description: error,
      variant: 'destructive'
    });
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
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-gray-400">
                Upload your Bake Diary contacts CSV file to import customer information.
                We'll automatically map the fields from the Bake Diary format.
              </p>
              
              <SimpleFileUpload
                url="/api/data/import"
                type="contacts"
                mappings={mappings}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onUploadProgress={setProgress}
                buttonText="Select Bake Diary CSV File"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}