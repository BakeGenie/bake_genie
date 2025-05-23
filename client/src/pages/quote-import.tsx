import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import CSVImporter from '@/components/csv-import/CSVImporter';
import { useQuery } from '@tanstack/react-query';

export default function QuoteImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<any>(null);
  
  // Get the current user ID from the authenticated user
  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  // Field mappings for quote imports
  const quoteFields = [
    { dbField: 'quote_number', displayName: 'Quote Number', required: true, alternativeNames: ['Order Number'] },
    { dbField: 'contact_name', displayName: 'Customer Name', alternativeNames: ['Contact', 'Customer'] },
    { dbField: 'event_date', displayName: 'Event Date', alternativeNames: ['Date'] },
    { dbField: 'event_type', displayName: 'Event Type', alternativeNames: ['Type'] },
    { dbField: 'description', displayName: 'Description/Theme', alternativeNames: ['Theme', 'Description'] },
    { dbField: 'total_amount', displayName: 'Total Amount', alternativeNames: ['Order Total', 'Total', 'Amount'] },
    { dbField: 'status', displayName: 'Status', alternativeNames: ['Quote Status'] },
    { dbField: 'expiry_date', displayName: 'Expiry Date', alternativeNames: ['Expiry'] },
    { dbField: 'notes', displayName: 'Notes', alternativeNames: ['Comments'] },
  ];

  const handleImportComplete = (result: any) => {
    setImportResult(result);
    
    if (result.successCount > 0) {
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successCount} quotes.`,
      });
    }
  };

  const handleBack = () => {
    setLocation('/data');
  };

  return (
    <CSVImporter
      title="Import Quotes"
      description="Upload a CSV file containing quotes data to import into the system. The file should include columns for quote number, customer name, event date, event type, description, total amount, status, expiry date, and notes."
      onBack={handleBack}
      onImportComplete={handleImportComplete}
      apiEndpoint="/api/quotes/import"
      fieldMappings={quoteFields}
      userId={user?.id || 1} // Use the authenticated user ID or fall back to default
    />
  );
}