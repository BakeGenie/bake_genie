import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleFileUploadProps {
  onUploadComplete: (result: any) => void;
  onUploadError: (error: string) => void;
  onUploadProgress?: (progress: number) => void;
  url: string;
  fileType?: string;
  mappings?: Record<string, string>;
  type: string;
  buttonText?: string;
}

const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  onUploadProgress,
  url,
  fileType = '.csv',
  mappings,
  type,
  buttonText = 'Select File'
}) => {
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
    
    // Auto-upload when file is selected
    handleUpload(files[0]);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(10);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      if (mappings) {
        formData.append('mappings', JSON.stringify(mappings));
      }
      
      console.log('Starting upload with mappings:', mappings);
      setProgress(20);
      
      // Use XHR for progress tracking
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progressPercent = Math.round((event.loaded / event.total) * 50) + 20;
          setProgress(progressPercent);
          if (onUploadProgress) {
            onUploadProgress(progressPercent);
          }
        }
      };
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          setProgress(100);
          try {
            const result = JSON.parse(xhr.responseText);
            onUploadComplete(result);
          } catch (error) {
            onUploadError('Invalid response from server');
          }
        } else {
          let errorMessage = 'Upload failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage = errorResponse.error || 'Upload failed';
          } catch (e) {
            // Ignore JSON parse error
          }
          setError(errorMessage);
          onUploadError(errorMessage);
        }
        setIsUploading(false);
      };
      
      xhr.onerror = function() {
        const errorMessage = 'Connection error';
        setError(errorMessage);
        onUploadError(errorMessage);
        setIsUploading(false);
      };
      
      // Send the form data
      xhr.send(formData);
      
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setError(errorMessage);
      onUploadError(errorMessage);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={fileType}
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
            {buttonText}
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
    </div>
  );
};

export default SimpleFileUpload;