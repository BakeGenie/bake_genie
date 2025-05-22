import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Define types for master ingredients
type MasterIngredient = {
  id: number;
  name: string;
  category: string;
}

const MasterIngredients = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Demo data - in a real application this would come from an API
  const masterIngredientsDemo = [
    // Beverages and Spirits
    { id: 1, name: "Light Rum", category: "Beverages and Spirits" },
    { id: 2, name: "Tea", category: "Beverages and Spirits" },
    { id: 3, name: "Vodka", category: "Beverages and Spirits" },
    { id: 4, name: "Water", category: "Beverages and Spirits" },
    
    // Cake Box Mix
    { id: 5, name: "Carrot Cake Mix", category: "Cake Box Mix" },
    { id: 6, name: "Chocolate Cake Mix", category: "Cake Box Mix" },
    { id: 7, name: "Chocolate Chip Cake Mix", category: "Cake Box Mix" },
    { id: 8, name: "Chocolate Fudge Cake Mix", category: "Cake Box Mix" },
    { id: 9, name: "Devil Food Cake Mix", category: "Cake Box Mix" },
    { id: 10, name: "Eggless Cake Mix", category: "Cake Box Mix" },
    { id: 11, name: "Fruit Cake Mix", category: "Cake Box Mix" },
    { id: 12, name: "Genoese Cake Mix", category: "Cake Box Mix" },
    { id: 13, name: "Ginger Cake Mix", category: "Cake Box Mix" },
    { id: 14, name: "Lemon Cake Mix", category: "Cake Box Mix" },
    
    // Basic Ingredients
    { id: 15, name: "Flour", category: "Basic Ingredients" },
    { id: 16, name: "Sugar", category: "Basic Ingredients" },
    { id: 17, name: "Salt", category: "Basic Ingredients" },
    { id: 18, name: "Baking Powder", category: "Basic Ingredients" },
    { id: 19, name: "Baking Soda", category: "Basic Ingredients" },
    { id: 20, name: "Vanilla Extract", category: "Basic Ingredients" },
    
    // Dairy
    { id: 21, name: "Butter", category: "Dairy" },
    { id: 22, name: "Milk", category: "Dairy" },
    { id: 23, name: "Heavy Cream", category: "Dairy" },
    { id: 24, name: "Eggs", category: "Dairy" },
    { id: 25, name: "Cream Cheese", category: "Dairy" },
  ];
  
  // Use React Query to fetch ingredients (using demo data for now)
  const { data: masterIngredients = masterIngredientsDemo, isLoading } = useQuery({
    queryKey: ["/api/master-ingredients"],
    queryFn: async () => {
      // In a real app this would fetch from the API
      return masterIngredientsDemo;
    },
  });
  
  // Filter ingredients based on search
  const filteredIngredients = searchQuery 
    ? masterIngredients.filter(ing => 
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ing.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : masterIngredients;
  
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
  
  // Handler for adding an ingredient from master list
  const handleAddIngredient = (ingredient: MasterIngredient) => {
    // This would trigger a dialog to add details like quantity, cost, etc.
    toast({
      title: "Add Ingredient",
      description: `${ingredient.name} would be added to your ingredients list.`,
      duration: 3000,
    });
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
        <div className="flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
    </div>
  );
};

export default MasterIngredients;