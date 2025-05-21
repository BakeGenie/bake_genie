import React, { useState } from "react";
import { useLocation } from "wouter";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Trash2, 
  Plus
} from "lucide-react";

// Define ingredient type
interface Ingredient {
  id: number;
  name: string;
  supplier?: string;
  purchaseSize?: string;
  costPrice?: number;
}

const IngredientsList = () => {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  
  // Filter ingredients based on search query
  const filteredIngredients = ingredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Ingredients" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Master
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> New
            </Button>
          </div>
        }
      />
      
      <div className="mt-6">
        <div className="relative w-72 mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Ingredients"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Purchase Size</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIngredients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No ingredients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      <Button 
                        variant="link" 
                        className="p-0 text-blue-600 hover:underline"
                        onClick={() => {/* View ingredient logic */}}
                      >
                        {ingredient.name}
                      </Button>
                    </TableCell>
                    <TableCell>{ingredient.supplier || '-'}</TableCell>
                    <TableCell>{ingredient.purchaseSize || '-'}</TableCell>
                    <TableCell>{ingredient.costPrice ? `$ ${ingredient.costPrice.toFixed(2)}` : '-'}</TableCell>
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
    </div>
  );
};

export default IngredientsList;