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

// Empty array for recipes - will be populated from database
const mockRecipes: Recipe[] = [];

const categories = ["All Categories", "Cake", "Filling", "Cookies", "Icing", "Frosting", "Other"];

const RecipesList = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  
  // Filter recipes based on search query and selected category
  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Recipes" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <Button 
            className="ml-auto" 
            size="sm" 
            onClick={() => {
              // Create a new recipe and display add recipe form
              navigate("/recipes/add-recipe");
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add New Recipe
          </Button>
        }
      />
      
      <div className="flex items-center justify-between mb-4 mt-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Recipes"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Select 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value)}
          >
            <SelectTrigger className="w-40">
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
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipe</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Servings</TableHead>
              <TableHead>Custom Price</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No recipes found
                </TableCell>
              </TableRow>
            ) : (
              filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell className="font-medium">
                    <Button 
                      variant="link" 
                      className="p-0 text-blue-600 hover:underline"
                      onClick={() => {/* View recipe logic */}}
                    >
                      {recipe.name}
                    </Button>
                  </TableCell>
                  <TableCell>{recipe.category}</TableCell>
                  <TableCell>
                    {recipe.servings ? (
                      <>
                        {recipe.servings}{' '}
                        <span className="text-gray-500 text-sm">({recipe.servingSize})</span>
                      </>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{recipe.customPrice}</TableCell>
                  <TableCell>{recipe.costPrice}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecipesList;