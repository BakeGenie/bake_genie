import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const InvoicePreview = () => {
  const [invoiceHtml, setInvoiceHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch sample invoice HTML when component mounts
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/sample-invoice');
        if (!response.ok) {
          throw new Error('Failed to fetch sample invoice');
        }
        const html = await response.text();
        setInvoiceHtml(html);
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

    fetchInvoice();
  }, [toast]);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Sample Invoice Preview</CardTitle>
          <CardDescription>
            This is a preview of how your invoices will look when sent to customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-[600px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border h-[600px] overflow-auto">
              <iframe
                srcDoc={invoiceHtml}
                title="Invoice Preview"
                className="w-full h-full"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button
            onClick={() => {
              // Create a new window with the invoice HTML
              const invoiceWindow = window.open('', '_blank');
              if (invoiceWindow) {
                invoiceWindow.document.write(invoiceHtml);
                invoiceWindow.document.close();
              } else {
                toast({
                  title: 'Popup Blocked',
                  description: 'Please allow popups to view the invoice in a new window',
                  variant: 'destructive',
                });
              }
            }}
          >
            Open in New Window
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InvoicePreview;