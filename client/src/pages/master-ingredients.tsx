import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define types for master ingredients
type MasterIngredient = {
  id: number;
  name: string;
  category: string;
}

// Define the form data type
interface IngredientFormData {
  name: string;
  supplier: string;
  purchaseSize: string;
  purchaseSizeUnit: string;
  costPrice: string;
  unit: string;
  hasSpecificVolume: boolean;
}

const MasterIngredients = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  
  // State for the ingredient dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<MasterIngredient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for new ingredient
  const [formData, setFormData] = useState<IngredientFormData>({
    name: "",
    supplier: "",
    purchaseSize: "",
    purchaseSizeUnit: "ml",
    costPrice: "",
    unit: "ml",
    hasSpecificVolume: false
  });
  
  // Calculate price per unit
  const pricePerUnit = () => {
    if (!formData.costPrice || !formData.purchaseSize || parseFloat(formData.purchaseSize) === 0) {
      return "0.00";
    }
    
    const cost = parseFloat(formData.costPrice);
    const size = parseFloat(formData.purchaseSize);
    return (cost / size).toFixed(2);
  };
  
  // Demo data - in a real application this would come from an API
  const masterIngredientsDemo = [
    // Beverages and Spirits
    { id: 1, name: "Amaretto", category: "Beverages and Spirits" },
    { id: 2, name: "Coffee", category: "Beverages and Spirits" },
    { id: 3, name: "Cognac", category: "Beverages and Spirits" },
    { id: 4, name: "Cointreau", category: "Beverages and Spirits" },
    { id: 5, name: "Dark Rum", category: "Beverages and Spirits" },
    { id: 6, name: "Kahlua", category: "Beverages and Spirits" },
    { id: 7, name: "Kirsch", category: "Beverages and Spirits" },
    { id: 8, name: "Light Rum", category: "Beverages and Spirits" },
    { id: 9, name: "Tea", category: "Beverages and Spirits" },
    { id: 10, name: "Vodka", category: "Beverages and Spirits" },
    { id: 11, name: "Water", category: "Beverages and Spirits" },
    
    // Cake Box Mix
    { id: 12, name: "Carrot Cake Mix", category: "Cake Box Mix" },
    { id: 13, name: "Chocolate Cake Mix", category: "Cake Box Mix" },
    { id: 14, name: "Chocolate Chip Cake Mix", category: "Cake Box Mix" },
    { id: 15, name: "Chocolate Fudge Cake Mix", category: "Cake Box Mix" },
    { id: 16, name: "Devil Food Cake Mix", category: "Cake Box Mix" },
    { id: 17, name: "Eggless Cake Mix", category: "Cake Box Mix" },
    { id: 18, name: "Fruit Cake Mix", category: "Cake Box Mix" },
    { id: 19, name: "Genoese Cake Mix", category: "Cake Box Mix" },
    { id: 20, name: "Ginger Cake Mix", category: "Cake Box Mix" },
    { id: 21, name: "Lemon Cake Mix", category: "Cake Box Mix" },
    
    // Basic Ingredients
    { id: 22, name: "Flour", category: "Basic Ingredients" },
    { id: 23, name: "Sugar", category: "Basic Ingredients" },
    { id: 24, name: "Salt", category: "Basic Ingredients" },
    { id: 25, name: "Baking Powder", category: "Basic Ingredients" },
    { id: 26, name: "Baking Soda", category: "Basic Ingredients" },
    { id: 27, name: "Vanilla Extract", category: "Basic Ingredients" },
    
    // Dairy
    { id: 28, name: "Butter", category: "Dairy" },
    { id: 29, name: "Milk", category: "Dairy" },
    { id: 30, name: "Heavy Cream", category: "Dairy" },
    { id: 31, name: "Eggs", category: "Dairy" },
    { id: 32, name: "Cream Cheese", category: "Dairy" },
  ];
  
  // Use React Query to fetch ingredients (using demo data for now)
  const { data: masterIngredients = masterIngredientsDemo, isLoading } = useQuery({
    queryKey: ["/api/master-ingredients"],
    queryFn: async () => {
      // In a real app this would fetch from the API
      return masterIngredientsDemo;
    },
  });
  
  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(masterIngredients.map(ing => ing.category)));
  const categories = ["All Categories", ...uniqueCategories].sort();
  
  // Filter ingredients based on search and category
  const filteredIngredients = masterIngredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ing.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || ing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Group ingredients by category
  const groupedIngredients = filteredIngredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, MasterIngredient[]>);
  
  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedIngredients).sort();
  
  // Handler for opening the add ingredient dialog
  const handleAddIngredient = (ingredient: MasterIngredient) => {
    setSelectedIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      supplier: "",
      purchaseSize: "",
      purchaseSizeUnit: "ml",
      costPrice: "",
      unit: "ml",
      hasSpecificVolume: false
    });
    setIsDialogOpen(true);
  };

  // Handler for saving an ingredient
  const handleSaveIngredient = async () => {
    // Validate required fields
    if (!formData.costPrice) {
      toast({
        title: "Missing information", 
        description: "Cost price is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the data to send to the API
      const ingredientData = {
        name: formData.name,
        supplier: formData.supplier || null,
        purchaseSize: formData.purchaseSize || null,
        purchaseSizeUnit: formData.purchaseSizeUnit,
        costPrice: formData.costPrice,
        unit: formData.unit,
        hasSpecificVolume: formData.hasSpecificVolume
      };
      
      console.log("Sending ingredient data:", ingredientData);
      
      // Send the data to the API
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ingredientData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add ingredient');
      }
      
      const newIngredient = await response.json();
      console.log("Added ingredient:", newIngredient);
      
      // Invalidate the query to refetch the ingredients
      await queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      
      // Show success message
      toast({
        title: "Ingredient added",
        description: `${formData.name} has been added to your ingredients list`,
        duration: 3000,
      });
      
      // Close the dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add ingredient",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Master Ingredient List" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <Button onClick={() => navigate("/recipes/ingredients-list")}>
            View Ingredients
          </Button>
        }
      />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ingredients"
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="mt-8 text-center">Loading ingredients...</div>
        ) : filteredIngredients.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">No ingredients found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {sortedCategories.map(category => (
              <div key={category} className="space-y-2">
                <h3 className="font-semibold text-lg">{category}</h3>
                <Separator />
                <div className="grid grid-cols-1">
                  {groupedIngredients[category].map(ingredient => (
                    <div 
                      key={ingredient.id} 
                      className="py-2 px-4 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div className="flex-1">{ingredient.name}</div>
                      <div className="flex-1 text-gray-500">{ingredient.category}</div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddIngredient(ingredient)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Ingredient Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selectedIngredient?.name || 'Add Ingredient'}</DialogTitle>
          <DialogDescription className="sr-only">
            Add ingredient details including purchase size, cost price, and supplier information.
          </DialogDescription>
          
          <div className="absolute top-3 right-3">
            <button
              className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex flex-col items-center pt-8 pb-4">
            <div className="bg-blue-100 p-3 rounded-full mb-3">
              <Plus className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-medium">{selectedIngredient?.name}</h2>
          </div>
          
          <div className="px-6 pb-6 pt-2">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
                  Purchase Size
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-1 inline-flex">
                          <Info className="h-4 w-4 text-gray-400" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-60">The size of the package you purchase</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-gray-500">Measurement</div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.purchaseSize}
                  onChange={(e) => setFormData({...formData, purchaseSize: e.target.value})}
                  className="flex-1"
                />
                <Select 
                  value={formData.purchaseSizeUnit} 
                  onValueChange={(value) => setFormData({...formData, purchaseSizeUnit: value, unit: value})}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="oz">oz</SelectItem>
                    <SelectItem value="tbl">tbl</SelectItem>
                    <SelectItem value="tsp">tsp</SelectItem>
                    <SelectItem value="cup">cup</SelectItem>
                    <SelectItem value="each">each</SelectItem>
                    <SelectItem value="pack">pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-5 space-y-1">
              <div className="text-sm font-medium text-gray-600">
                Cost Price
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  className="pl-7"
                />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                $ {pricePerUnit()} per {formData.unit}
              </div>
            </div>
            
            <div className="mt-5 space-y-1">
              <div className="text-sm font-medium text-gray-600">
                Supplier <span className="text-gray-400">(Optional)</span>
              </div>
              <Input
                placeholder="Enter Supplier Name"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              />
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-gray-300 text-gray-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveIngredient} 
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-1">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Saving</span>
                  </div>
                ) : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterIngredients;