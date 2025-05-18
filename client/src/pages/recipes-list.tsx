import React, { useState } from "react";
import { useLocation } from "wouter";
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
  ChevronDownIcon
} from "lucide-react";

// Mock data for demonstration
const mockRecipes = [
  { id: 1, name: "Butterscotch Sauce", category: "Filling", servings: 15, servingSize: "$0.29", customPrice: "$4.50", costPrice: "$4.38" },
  { id: 2, name: "Dark Chocolate Ganache", category: "Filling", servings: null, servingSize: "", customPrice: "$22.48", costPrice: "$22.48" },
  { id: 3, name: "Dark Chocolate Mud Cake", category: "Cake", servings: 15, servingSize: "$1.08", customPrice: "$16.17", costPrice: "$16.17" },
  { id: 4, name: "Jam Drops", category: "Cookies", servings: 20, servingSize: "$0.26", customPrice: "$5.17", costPrice: "$5.17" },
  { id: 5, name: "Raspberry Coulis", category: "Filling", servings: 15, servingSize: "$0.20", customPrice: "$3.07", costPrice: "$3.07" },
  { id: 6, name: "Salted Caramel", category: "Filling", servings: null, servingSize: "", customPrice: "$3.95", costPrice: "$3.95" },
  { id: 7, name: "Signature Chocolate Cake", category: "Cake", servings: 15, servingSize: "$0.94", customPrice: "$14.10", costPrice: "$14.10" }
];

const categories = ["All Categories", "Cake", "Filling", "Cookies"];

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
          <Button className="ml-auto" size="sm">
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
                    <a href="#" className="text-blue-600 hover:underline">
                      {recipe.name}
                    </a>
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