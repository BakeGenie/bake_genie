import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';

interface UploadFormProps {
  type: string;
  onSuccess?: () => void;
}

export function UploadForm({ type, onSuccess }: UploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('type', type);

    try {
      setProgress(30);

      // Add specific mappings for contacts
      if (type === 'contacts') {
        const mappings = {
          "type": "Type",
          "first_name": "First Name",
          "last_name": "Last Name",
          "email": "Email",
          "phone": "Number"
        };
        formData.append('mappings', JSON.stringify(mappings));
      }

      // Direct XMLHttpRequest for better control
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/data/import', true);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 50) + 30;
          setProgress(percentComplete); 
        }
      };
      
      xhr.onload = function() {
        setProgress(100);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          toast({
            title: "Upload Successful",
            description: `Your ${type} data has been imported`,
          });
          if (onSuccess) onSuccess();
        } else {
          let errorMessage = 'Server error';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.error || response.message || 'Server error';
          } catch (e) {
            errorMessage = 'Server error with status ' + xhr.status;
          }
          setError(errorMessage);
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        setUploading(false);
      };
      
      xhr.onerror = function() {
        setProgress(0);
        setError("Network error occurred");
        toast({
          title: "Upload Failed",
          description: "Network error occurred",
          variant: "destructive",
        });
        setUploading(false);
      };
      
      // Send the form data
      xhr.send(formData);
      
    } catch (error) {
      console.error("Upload error:", error);
      setError("There was an error uploading your file");
      setUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          name="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            // Reset error when file is selected
            if (e.target.files && e.target.files.length > 0) {
              setError(null);
            }
          }}
        />
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleBrowseClick}
          disabled={uploading}
        >
          Select CSV File
        </Button>
        <span className="text-sm text-gray-400">
          {fileInputRef.current?.files?.[0]?.name || "No file selected"}
        </span>
      </div>

      {error && (
        <div className="bg-[#7f1d1d] border border-[#b91c1c] text-white p-3 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <div>{error}</div>
        </div>
      )}

      {uploading && (
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
        disabled={uploading || !fileInputRef.current?.files?.[0]}
        className="w-full"
      >
        Upload & Import
      </Button>
    </form>
  );
}