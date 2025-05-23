import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import CSVImporter from '@/components/csv-import/CSVImporter';

export default function QuoteImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<any>(null);
  
  // Field mappings for quote imports
  const quoteFields = [
    { dbField: 'quote_id', displayName: 'Quote Number/ID', required: true },
    { dbField: 'name', displayName: 'Contact Name' },
    { dbField: 'event_date', displayName: 'Event Date' },
    { dbField: 'event_type', displayName: 'Event Type' },
    { dbField: 'description', displayName: 'Description/Theme' },
    { dbField: 'price', displayName: 'Price/Total' },
    { dbField: 'status', displayName: 'Status' },
    { dbField: 'expiry_date', displayName: 'Expiry Date' },
    { dbField: 'notes', displayName: 'Notes' },
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
      description="Upload a CSV file containing quotes data to import into the system."
      onBack={handleBack}
      onImportComplete={handleImportComplete}
      apiEndpoint="/api/quotes/import"
      fieldMappings={quoteFields}
      userId={1} // Default user ID for testing, in production this would come from auth context
    />
  );
}