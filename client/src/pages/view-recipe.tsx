import React from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { 
  ClockIcon, 
  UtensilsCrossedIcon, 
  Edit,
  Loader2,
  ArrowLeftIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Type for ingredients
interface Ingredient {
  id: number;
  name: string;
  unit: string;
  costPerUnit: string | null;
  packSize: string | null;
  packCost: string | null;
  supplier: string | null;
}

// Type for a recipe with ingredients
interface RecipeWithIngredients {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  servings: number;
  servingSize: string | null;
  instructions: string | null;
  prepTime: number | null;
  cookTime: number | null;
  category: string | null;
  ingredients?: {
    id: number;
    recipeId: number;
    ingredientId: number;
    quantity: string;
    unit: string;
    cost: string;
    ingredient?: Ingredient;
    notes?: string;
  }[];
}

const ViewRecipePage = () => {
  const params = useParams();
  const recipeId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Query to fetch recipe details
  const { data: recipe, isLoading } = useQuery<RecipeWithIngredients>({
    queryKey: [`/api/recipes/${recipeId}`],
    enabled: !!recipeId,
  });

  // Query to fetch all ingredients
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Calculate recipe cost
  const calculateRecipeCost = (recipe: RecipeWithIngredients): number => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return 0;
    }
    
    return recipe.ingredients.reduce((total, item) => {
      // Try to get the ingredient cost from the joined ingredient object
      if (item.ingredient && item.ingredient.costPerUnit) {
        return total + (Number(item.ingredient.costPerUnit) * Number(item.quantity));
      }
      
      // If not available, try to find the ingredient in our ingredients list
      const ingredient = ingredients.find(ing => ing.id === item.ingredientId);
      if (ingredient && ingredient.costPerUnit) {
        return total + (Number(ingredient.costPerUnit) * Number(item.quantity));
      }
      
      // If all else fails, use the cost value in the recipe_ingredients table
      return total + Number(item.cost || 0);
    }, 0);
  };

  if (isLoading || isLoadingIngredients) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader 
          title="Recipe Details" 
          backLink="/recipes/recipes-list" 
          backLabel="Back to Recipes"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading recipe...</span>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader 
          title="Recipe Not Found" 
          backLink="/recipes/recipes-list" 
          backLabel="Back to Recipes"
        />
        <div className="bg-white rounded-md shadow-sm p-12 text-center mt-6">
          <p className="text-gray-500 mb-4">The recipe you're looking for could not be found.</p>
          <Button onClick={() => navigate("/recipes/recipes-list")}>
            Back to Recipes
          </Button>
        </div>
      </div>
    );
  }

  const recipeCost = calculateRecipeCost(recipe);
  const costPerServing = recipeCost / (recipe.servings || 1);

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Recipe Details" 
        backLink="/recipes/recipes-list" 
        backLabel="Back to Recipes"
        actions={
          <Button 
            onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
            className="ml-auto"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-2" /> Edit Recipe
          </Button>
        }
      />
      
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            {recipe.category && (
              <p className="text-gray-500 mt-1">{recipe.category}</p>
            )}
            {recipe.description && (
              <p className="mt-4 text-gray-700">{recipe.description}</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center">
              <UtensilsCrossedIcon className="h-4 w-4 mr-2 text-gray-500" />
              <span>{recipe.servings} servings</span>
            </div>
            {recipe.prepTime && (
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Prep: {recipe.prepTime} min</span>
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>Cook: {recipe.cookTime} min</span>
              </div>
            )}
          </div>
          
          <Separator className="my-6" />
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
            <ul className="space-y-2">
              {recipe.ingredients && recipe.ingredients.map((item) => {
                const ingredient = item.ingredient || 
                  ingredients.find(ing => ing.id === item.ingredientId);
                  
                if (!ingredient) return null;
                
                return (
                  <li key={item.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.quantity} {ingredient.unit}</span>{" "}
                      <span>{ingredient.name}</span>
                      {item.notes && (
                        <span className="text-gray-500 text-sm"> ({item.notes})</span>
                      )}
                    </div>
                    {ingredient.costPerUnit && (
                      <span className="text-gray-500 text-sm">
                        ${(Number(ingredient.costPerUnit) * Number(item.quantity)).toFixed(2)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          
          {recipe.instructions && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Instructions</h2>
              <div className="text-gray-700 whitespace-pre-line">
                {recipe.instructions}
              </div>
            </div>
          )}
          
          <Separator className="my-6" />
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500">Total Cost</p>
              <p className="text-xl font-medium">${recipeCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-500">Cost per Serving</p>
              <p className="text-xl font-medium">${costPerServing.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate("/recipes/recipes-list")}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back to Recipes
        </Button>
        <Button 
          onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
        >
          <Edit className="h-4 w-4 mr-2" /> Edit Recipe
        </Button>
      </div>
    </div>
  );
};

export default ViewRecipePage;