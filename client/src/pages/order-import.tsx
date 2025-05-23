import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import CSVImporter from '@/components/csv-import/CSVImporter';

export default function OrderImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<any>(null);
  
  // Field mappings for order imports
  const orderFields = [
    { dbField: 'order_number', displayName: 'Order Number', required: true },
    { dbField: 'contact_name', displayName: 'Contact Name' },
    { dbField: 'event_date', displayName: 'Event Date' },
    { dbField: 'event_type', displayName: 'Event Type' },
    { dbField: 'status', displayName: 'Status' },
    { dbField: 'delivery_option', displayName: 'Delivery Option' },
    { dbField: 'delivery_address', displayName: 'Delivery Address' },
    { dbField: 'delivery_cost', displayName: 'Delivery Cost' },
    { dbField: 'total', displayName: 'Order Total' },
    { dbField: 'deposit_amount', displayName: 'Deposit Amount' },
    { dbField: 'deposit_paid', displayName: 'Deposit Paid' },
    { dbField: 'balance_paid', displayName: 'Balance Paid' },
    { dbField: 'notes', displayName: 'Notes' },
    { dbField: 'description', displayName: 'Description/Theme' },
  ];

  const handleImportComplete = (result: any) => {
    setImportResult(result);
    
    if (result.successCount > 0) {
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successCount} orders.`,
      });
    }
  };

  const handleBack = () => {
    setLocation('/data');
  };

  return (
    <CSVImporter
      title="Import Orders"
      description="Upload a CSV file containing orders data to import into the system."
      onBack={handleBack}
      onImportComplete={handleImportComplete}
      apiEndpoint="/api/orders/import"
      fieldMappings={orderFields}
      userId={1} // Default user ID for testing, in production this would come from auth context
    />
  );
}