import { useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import CSVImporter from '@/components/csv-import/CSVImporter';

export default function RecipesImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [importResult, setImportResult] = useState<any>(null);
  
  // Field mappings for recipe imports
  const recipeFields = [
    { dbField: 'name', displayName: 'Recipe Name', required: true },
    { dbField: 'category', displayName: 'Category' },
    { dbField: 'servings', displayName: 'Servings' },
    { dbField: 'total_cost', displayName: 'Price/Cost' },
    { dbField: 'description', displayName: 'Description' },
    { dbField: 'notes', displayName: 'Notes' },
  ];

  const handleImportComplete = (result: any) => {
    setImportResult(result);
    
    if (result.successCount > 0) {
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.successCount} recipes.`,
      });
    }
  };

  const handleBack = () => {
    setLocation('/data');
  };

  return (
    <CSVImporter
      title="Import Recipes"
      description="Upload a CSV file containing recipe data to import into the system."
      onBack={handleBack}
      onImportComplete={handleImportComplete}
      apiEndpoint="/api/recipes/direct-import"
      fieldMappings={recipeFields}
      userId={1} // Default user ID for testing, in production this would come from auth context
    />
  );
}