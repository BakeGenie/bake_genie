import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ExternalLink,
  Loader2
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
  purchaseSizeUnit?: string;
  costPrice?: number;
  unit?: string;
  hasSpecificVolume?: boolean;
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

const IngredientsList = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editIngredient, setEditIngredient] = useState<any>(null);
  
  // Form state for new ingredient
  const [formData, setFormData] = useState<IngredientFormData>({
    name: "",
    supplier: "",
    purchaseSize: "",
    purchaseSizeUnit: "g",
    costPrice: "",
    unit: "g",
    hasSpecificVolume: false
  });
  
  // Form state for editing an existing ingredient
  const [editFormData, setEditFormData] = useState<IngredientFormData>({
    name: "",
    supplier: "",
    purchaseSize: "",
    purchaseSizeUnit: "g",
    costPrice: "",
    unit: "g",
    hasSpecificVolume: false
  });
  
  // Use React Query to fetch ingredients
  const { 
    data: ingredients = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["/api/ingredients"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/ingredients");
        if (!response.ok) {
          throw new Error("Failed to fetch ingredients");
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching ingredients:", error);
        // Return an empty array for now if there's an error
        return [];
      }
    },
  });
  
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
                    <TableCell>{ingredient.pack_size ? `${ingredient.pack_size} ${ingredient.unit}` : '-'}</TableCell>
                    <TableCell>{ingredient.cost_per_unit ? `$${ingredient.cost_per_unit}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500 hover:text-blue-600"
                          onClick={() => {
                            // Set up edit form data with current ingredient values
                            setEditIngredient(ingredient);
                            setEditFormData({
                              name: ingredient.name || "",
                              supplier: ingredient.supplier || "",
                              purchaseSize: ingredient.pack_size?.toString() || "",
                              purchaseSizeUnit: ingredient.unit || "g",
                              costPrice: ingredient.cost_per_unit?.toString() || "",
                              unit: ingredient.unit || "g",
                              hasSpecificVolume: false // Default value, update if you have this in the database
                            });
                            setIsEditDialogOpen(true);
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
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          // Reset form data when dialog closes
          setFormData({
            name: "",
            supplier: "",
            purchaseSize: "",
            purchaseSizeUnit: "g",
            costPrice: "",
            unit: "g",
            hasSpecificVolume: false
          });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Ingredient</DialogTitle>
            <DialogDescription>
              Add details for your new ingredient. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            
            // Validate required fields
            if (!formData.name) {
              toast({
                title: "Missing information", 
                description: "Ingredient name is required",
                variant: "destructive"
              });
              return;
            }
            
            if (!formData.costPrice) {
              toast({
                title: "Missing information", 
                description: "Cost price is required",
                variant: "destructive"
              });
              return;
            }
            
            // Set submitting state
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
              
              // Close the dialog and reset form
              setIsAddDialogOpen(false);
              setFormData({
                name: "",
                supplier: "",
                purchaseSize: "",
                purchaseSizeUnit: "g",
                costPrice: "",
                unit: "g",
                hasSpecificVolume: false
              });
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
          }} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right text-sm font-medium">
                Name*
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ingredient name"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="supplier" className="text-right text-sm font-medium">
                Supplier
              </label>
              <Input
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                placeholder="Supplier name"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="purchaseSize" className="text-right text-sm font-medium">
                Purchase Size
              </label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="purchaseSize"
                  name="purchaseSize"
                  value={formData.purchaseSize}
                  onChange={(e) => setFormData({...formData, purchaseSize: e.target.value})}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="flex-1"
                />
                <select 
                  className="h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.purchaseSizeUnit}
                  name="purchaseSizeUnit"
                  onChange={(e) => setFormData({...formData, purchaseSizeUnit: e.target.value})}
                >
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="each">each</option>
                  <option value="pack">pack</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="costPrice" className="text-right text-sm font-medium">
                Cost Price*
              </label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="costPrice"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="unit" className="text-right text-sm font-medium">
                Measurement*
              </label>
              <div className="col-span-3">
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.unit}
                  id="unit"
                  name="unit"
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  required
                >
                  <option value="ml">ml</option>
                  <option value="mg">mg</option>
                  <option value="st">st</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="gal">gal (US)</option>
                  <option value="gal_uk">gal (UK)</option>
                  <option value="qt">qt</option>
                  <option value="pint_us">pint (US)</option>
                  <option value="pint">pint</option>
                  <option value="cup_us">cup (US)</option>
                  <option value="cup">cup</option>
                  <option value="fl_oz_us">fl oz (US)</option>
                  <option value="fl_oz">fl oz</option>
                  <option value="tbl_us">Tbl (US)</option>
                  <option value="tbl">Tbl</option>
                  <option value="tsp_us">tsp (US)</option>
                  <option value="tsp">tsp</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1"></div>
              <div className="flex items-center space-x-2 col-span-3">
                <input 
                  type="checkbox" 
                  id="hasSpecificVolume"
                  name="hasSpecificVolume"
                  checked={formData.hasSpecificVolume}
                  onChange={(e) => setFormData({...formData, hasSpecificVolume: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hasSpecificVolume" className="text-sm font-medium text-gray-700">
                  Add specific Volume to each portion
                </label>
              </div>
            </div>
          
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Ingredient"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Ingredient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditIngredient(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Ingredient</DialogTitle>
            <DialogDescription>
              Update the details for {editIngredient?.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            
            if (!editIngredient) return;
            
            // Validate required fields
            if (!editFormData.name) {
              toast({
                title: "Missing information", 
                description: "Ingredient name is required",
                variant: "destructive"
              });
              return;
            }
            
            if (!editFormData.costPrice) {
              toast({
                title: "Missing information", 
                description: "Cost price is required",
                variant: "destructive"
              });
              return;
            }
            
            // Set submitting state
            setIsSubmitting(true);
            
            try {
              // Prepare the data to send to the API
              const ingredientData = {
                name: editFormData.name,
                supplier: editFormData.supplier || null,
                purchaseSize: editFormData.purchaseSize || null,
                purchaseSizeUnit: editFormData.purchaseSizeUnit,
                costPrice: editFormData.costPrice,
                unit: editFormData.unit,
                hasSpecificVolume: editFormData.hasSpecificVolume
              };
              
              console.log("Updating ingredient data:", ingredientData);
              
              // Send the data to the API
              const response = await fetch(`/api/ingredients/${editIngredient.id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(ingredientData)
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update ingredient');
              }
              
              const updatedIngredient = await response.json();
              console.log("Updated ingredient:", updatedIngredient);
              
              // Invalidate the query to refetch the ingredients
              await queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
              
              // Show success message
              toast({
                title: "Ingredient updated",
                description: `${editFormData.name} has been updated successfully`,
                duration: 3000,
              });
              
              // Close the dialog and reset state
              setIsEditDialogOpen(false);
              setEditIngredient(null);
            } catch (error) {
              console.error("Error updating ingredient:", error);
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update ingredient",
                variant: "destructive"
              });
            } finally {
              setIsSubmitting(false);
            }
          }} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editName" className="text-right text-sm font-medium">
                Ingredient Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="editName"
                name="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                placeholder="Ingredient name"
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editSupplier" className="text-right text-sm font-medium">
                Supplier
              </label>
              <Input
                id="editSupplier"
                name="supplier"
                value={editFormData.supplier}
                onChange={(e) => setEditFormData({...editFormData, supplier: e.target.value})}
                placeholder="Supplier name"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editPurchaseSize" className="text-right text-sm font-medium">
                Purchase Size
              </label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="editPurchaseSize"
                  name="purchaseSize"
                  type="number"
                  step="0.01"
                  value={editFormData.purchaseSize}
                  onChange={(e) => setEditFormData({...editFormData, purchaseSize: e.target.value})}
                  placeholder="e.g., 50"
                  className="flex-1"
                />
                <select 
                  className="h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editFormData.purchaseSizeUnit}
                  name="purchaseSizeUnit"
                  onChange={(e) => setEditFormData({...editFormData, purchaseSizeUnit: e.target.value})}
                >
                  <option value="ml">ml</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="each">each</option>
                  <option value="pack">pack</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editCostPrice" className="text-right text-sm font-medium">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <div className="relative col-span-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="editCostPrice"
                  name="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.costPrice}
                  onChange={(e) => setEditFormData({...editFormData, costPrice: e.target.value})}
                  placeholder="0.00"
                  className="pl-7"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="editUnit" className="text-right text-sm font-medium">
                Measurement <span className="text-red-500">*</span>
              </label>
              <div className="col-span-3">
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={editFormData.unit}
                  id="editUnit"
                  name="unit"
                  onChange={(e) => setEditFormData({...editFormData, unit: e.target.value})}
                  required
                >
                  <option value="ml">ml</option>
                  <option value="mg">mg</option>
                  <option value="st">st</option>
                  <option value="lb">lb</option>
                  <option value="oz">oz</option>
                  <option value="gal">gal (US)</option>
                  <option value="gal_uk">gal (UK)</option>
                  <option value="qt">qt</option>
                  <option value="pint_us">pint (US)</option>
                  <option value="pint">pint</option>
                  <option value="cup_us">cup (US)</option>
                  <option value="cup">cup</option>
                  <option value="fl_oz_us">fl oz (US)</option>
                  <option value="fl_oz">fl oz</option>
                  <option value="tbl_us">Tbl (US)</option>
                  <option value="tbl">Tbl</option>
                  <option value="tsp_us">tsp (US)</option>
                  <option value="tsp">tsp</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="col-span-1"></div>
              <div className="flex items-center space-x-2 col-span-3">
                <input 
                  type="checkbox" 
                  id="editHasSpecificVolume"
                  name="hasSpecificVolume"
                  checked={editFormData.hasSpecificVolume}
                  onChange={(e) => setEditFormData({...editFormData, hasSpecificVolume: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editHasSpecificVolume" className="text-sm font-medium text-gray-700">
                  Add specific Volume / Weight value
                </label>
              </div>
            </div>
            
            {editFormData.hasSpecificVolume && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="volumeConversion" className="text-right text-sm font-medium">
                  Volume Conversion
                </label>
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-sm">One</span>
                  <select 
                    className="h-9 w-[100px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                    defaultValue="cup_us"
                  >
                    <option value="cup_us">cup (US)</option>
                    <option value="pint">pint</option>
                    <option value="tbl">Tbl</option>
                    <option value="tsp">tsp</option>
                  </select>
                  <span className="text-sm">has</span>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    defaultValue="0"
                    className="w-20"
                  />
                  <select 
                    className="h-9 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm"
                    defaultValue="g"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
            )}
          
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditIngredient(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Ingredient"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IngredientsList;