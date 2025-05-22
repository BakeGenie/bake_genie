import React, { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  Plus,
  Edit,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define ingredient type
interface Ingredient {
  id: number;
  name: string;
  supplier?: string;
  purchaseSize?: string;
  costPrice?: number;
  unit?: string;
}

const IngredientsList = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Sample ingredient data for the UI
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { 
      id: 1, 
      name: "All-Purpose Flour", 
      supplier: "Baker's Supply Co", 
      purchaseSize: "5kg bag", 
      costPrice: 12.99,
      unit: "grams" 
    },
    { 
      id: 2, 
      name: "Granulated Sugar", 
      supplier: "Sweet Supplies", 
      purchaseSize: "2kg bag", 
      costPrice: 8.50,
      unit: "grams" 
    },
    { 
      id: 3, 
      name: "Unsalted Butter", 
      supplier: "Dairy Fresh", 
      purchaseSize: "454g block", 
      costPrice: 6.75,
      unit: "grams" 
    },
    { 
      id: 4, 
      name: "Vanilla Extract", 
      supplier: "Flavor Essence", 
      purchaseSize: "500ml bottle", 
      costPrice: 18.99,
      unit: "ml" 
    },
    { 
      id: 5, 
      name: "Eggs", 
      supplier: "Farm Fresh", 
      purchaseSize: "12 count", 
      costPrice: 5.25,
      unit: "count" 
    }
  ]);
  
  // Filter ingredients based on search query
  const filteredIngredients = ingredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ingredient.supplier && ingredient.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Handle delete ingredient
  const handleDeleteIngredient = (id: number) => {
    const ingredientToDelete = ingredients.find(i => i.id === id);
    if (ingredientToDelete) {
      toast({
        title: "Ingredient deleted",
        description: `"${ingredientToDelete.name}" has been removed`,
        duration: 3000,
      });
      
      setIngredients(ingredients.filter(i => i.id !== id));
    }
  };
  
  // Handle view master ingredients
  const handleViewMasterIngredients = () => {
    navigate("/recipes/master-ingredients");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Ingredients" 
        backLink="/recipes" 
        backLabel="Back to Recipes & Ingredients"
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewMasterIngredients}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Master List
            </Button>
            <Button 
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Ingredient
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
                    No ingredients found. Add ingredients to your list or import from the Master List.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      <Button 
                        variant="link" 
                        className="p-0 text-blue-600 hover:underline"
                        onClick={() => {
                          toast({
                            title: "Ingredient details",
                            description: `Viewing details for ${ingredient.name}`,
                            duration: 3000,
                          });
                        }}
                      >
                        {ingredient.name}
                      </Button>
                    </TableCell>
                    <TableCell>{ingredient.supplier || '-'}</TableCell>
                    <TableCell>{ingredient.purchaseSize || '-'}</TableCell>
                    <TableCell>{ingredient.costPrice ? `$${ingredient.costPrice.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() => {
                            toast({
                              title: "Edit ingredient",
                              description: `Editing ${ingredient.name}`,
                              duration: 3000,
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteIngredient(ingredient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Add Ingredient Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Ingredient</DialogTitle>
            <DialogDescription>
              Add details for your new ingredient. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name*
              </label>
              <Input
                id="name"
                placeholder="Ingredient name"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="supplier" className="text-right text-sm font-medium">
                Supplier
              </label>
              <Input
                id="supplier"
                placeholder="Supplier name"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="purchaseSize" className="text-right text-sm font-medium">
                Purchase Size
              </label>
              <Input
                id="purchaseSize"
                placeholder="500g, 1L, etc."
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="costPrice" className="text-right text-sm font-medium">
                Cost Price*
              </label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="unit" className="text-right text-sm font-medium">
                Unit*
              </label>
              <Input
                id="unit"
                placeholder="g, ml, each, etc."
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({
                title: "Ingredient added",
                description: "New ingredient has been added to your list",
                duration: 3000,
              });
              setIsAddDialogOpen(false);
            }}>
              Add Ingredient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IngredientsList;