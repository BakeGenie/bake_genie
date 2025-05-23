import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import CSVImporter from '@/components/csv-import/CSVImporter';

export default function OrderItemsImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<any>(null);
  
  // Field mappings for order item imports
  const orderItemFields = [
    { dbField: 'order_id', displayName: 'Order Number/ID', required: true },
    { dbField: 'description', displayName: 'Description/Details' },
    { dbField: 'serving', displayName: 'Servings' },
    { dbField: 'labour', displayName: 'Labour' },
    { dbField: 'hours', displayName: 'Hours' },
    { dbField: 'overhead', displayName: 'Overhead' },
    { dbField: 'recipes', displayName: 'Recipes' },
    { dbField: 'cost_price', displayName: 'Cost Price' },
    { dbField: 'sell_price', displayName: 'Sell Price' },
    { dbField: 'quantity', displayName: 'Quantity' },
    { dbField: 'notes', displayName: 'Notes' },
  ];

  const handleImportComplete = (result: any) => {
    setImportResult(result);
    
    if (result.successCount > 0) {
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successCount} order items.`,
      });
    }
  };

  const handleBack = () => {
    setLocation('/data');
  };

  return (
    <CSVImporter
      title="Import Order Items"
      description="Upload a CSV file containing order items data to import into the system."
      onBack={handleBack}
      onImportComplete={handleImportComplete}
      apiEndpoint="/api/order-items/import"
      fieldMappings={orderItemFields}
      userId={1} // Default user ID for testing, in production this would come from auth context
    />
  );
}