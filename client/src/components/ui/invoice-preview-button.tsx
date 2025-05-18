import React, { useState } from 'react';
import { Button } from './button';
import { FileTextIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InvoicePreviewButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sample-invoice');
      if (!response.ok) {
        throw new Error('Failed to fetch sample invoice');
      }
      const html = await response.text();
      
      // Open the invoice in a new window
      const invoiceWindow = window.open('', '_blank');
      if (invoiceWindow) {
        invoiceWindow.document.write(html);
        invoiceWindow.document.close();
      } else {
        toast({
          title: 'Popup Blocked',
          description: 'Please allow popups to view the invoice in a new window',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sample invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePreview} 
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <span className="flex items-center">
          <FileTextIcon className="mr-2 h-4 w-4" />
          Preview Sample Invoice
        </span>
      )}
    </Button>
  );
}