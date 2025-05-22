import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusIcon, 
  Search, 
  Trash2, 
  FilterIcon,
  ChevronDownIcon,
  Edit,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Recipe } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Define recipe type with ingredients
interface RecipeWithIngredients extends Recipe {
  ingredients?: {
    id: number;
    recipeId: number;
    ingredientId: number;
    quantity: number;
    notes?: string;
    ingredient?: {
      id: number;
      name: string;
      unit: string;
      unitCost?: number;
    };
  }[];
}
interface Recipe {
  id: number;
  name: string;
  category?: string;
  servings?: number;
  servingSize?: string;
  customPrice?: string;
  costPrice?: string;
}

const categories = ["All Categories", "Cake", "Filling", "Cookies", "Icing", "Frosting", "Other"];

const RecipesList = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  
  // Fetch recipes from the database
  const { data: recipes = [], isLoading } = useQuery<RecipeWithIngredients[]>({
    queryKey: ['/api/recipes'],
    refetchOnWindowFocus: false,
  });
  
  // Delete recipe mutation
  const deleteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      return apiRequest(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Recipe deleted",
        description: "The recipe has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Filter recipes based on search query and selected category
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  // Calculate recipe cost
  const calculateRecipeCost = (recipe: RecipeWithIngredients): string => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      // Use cost price if available, otherwise return dash
      return recipe.costPrice ? `$${Number(recipe.costPrice).toFixed(2)}` : '-';
    }
    
    const total = recipe.ingredients.reduce((sum, item) => {
      if (item.ingredient && item.ingredient.unitCost) {
        return sum + (Number(item.ingredient.unitCost) * Number(item.quantity));
      }
      return sum;
    }, 0);
    
    return `$${total.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Recipes" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <Button 
            className="ml-auto bg-green-600 hover:bg-green-700" 
            size="sm" 
            onClick={() => navigate("/recipes/add-recipe")}
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add New Recipe
          </Button>
        }
      />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 mt-6 gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Recipes"
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center w-full sm:w-auto">
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <FilterIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full mr-3"></div>
          <span>Loading recipes...</span>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="bg-white rounded-md shadow-sm p-12 text-center">
          <p className="text-gray-500 mb-4">No recipes found</p>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => navigate("/recipes/add-recipe")}
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Create Your First Recipe
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-md shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Servings</TableHead>
                <TableHead>Ingredients</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">
                    <Button 
                      variant="link" 
                      className="p-0 text-blue-600 hover:underline"
                      onClick={() => navigate(`/recipes/view/${recipe.id}`)}
                    >
                      {recipe.name}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {recipe.category ? (
                      <Badge variant="outline">{recipe.category}</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {recipe.servings || '-'}
                  </TableCell>
                  <TableCell>
                    {recipe.ingredients?.length || 0}
                  </TableCell>
                  <TableCell>
                    {calculateRecipeCost(recipe)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/recipes/view/${recipe.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                          setRecipeToDelete(recipe);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipeToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => recipeToDelete && deleteMutation.mutate(recipeToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Recipe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipesList;