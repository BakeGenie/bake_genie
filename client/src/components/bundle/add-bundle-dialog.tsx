import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, Search, Plus, X } from "lucide-react";

// Define the form schema
const bundleFormSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Price must be a valid positive number" }
  ),
});

type BundleFormValues = z.infer<typeof bundleFormSchema>;

// Define types for recipes and supplies
interface Recipe {
  id: number;
  name: string;
  price?: number;
}

interface Supply {
  id: number;
  name: string;
  price?: number;
}

interface AddBundleDialogProps {
  onSave: (bundle: BundleFormValues & { recipes: Recipe[], supplies: Supply[] }) => void;
  trigger?: React.ReactNode;
}

const AddBundleDialog: React.FC<AddBundleDialogProps> = ({ onSave, trigger }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("");
  const [supplySearchQuery, setSupplySearchQuery] = useState("");
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [selectedSupplies, setSelectedSupplies] = useState<Supply[]>([]);
  
  // Empty arrays for recipes and supplies - will be populated from database
  const allRecipes: Recipe[] = [];
  const allSupplies: Supply[] = [];

  // Filter recipes based on search
  const filteredRecipes = allRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(recipeSearchQuery.toLowerCase())
  );

  // Filter supplies based on search
  const filteredSupplies = allSupplies.filter(supply => 
    supply.name.toLowerCase().includes(supplySearchQuery.toLowerCase())
  );

  // Calculate total price from selected items
  const calculateTotalPrice = () => {
    const recipeTotal = selectedRecipes.reduce((sum, recipe) => sum + (typeof recipe.price === 'string' ? parseFloat(recipe.price) || 0 : recipe.price || 0), 0);
    const supplyTotal = selectedSupplies.reduce((sum, supply) => sum + (typeof supply.price === 'string' ? parseFloat(supply.price) || 0 : supply.price || 0), 0);
    return recipeTotal + supplyTotal;
  };

  // Initialize the form with default values
  const form = useForm<BundleFormValues>({
    resolver: zodResolver(bundleFormSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "0.00"
    },
  });

  // Add a recipe to the selection
  const addRecipe = (recipe: Recipe) => {
    if (!selectedRecipes.some(r => r.id === recipe.id)) {
      setSelectedRecipes([...selectedRecipes, recipe]);
    }
  };

  // Remove a recipe from the selection
  const removeRecipe = (recipeId: number) => {
    setSelectedRecipes(selectedRecipes.filter(r => r.id !== recipeId));
  };

  // Add a supply to the selection
  const addSupply = (supply: Supply) => {
    if (!selectedSupplies.some(s => s.id === supply.id)) {
      setSelectedSupplies([...selectedSupplies, supply]);
    }
  };

  // Remove a supply from the selection
  const removeSupply = (supplyId: number) => {
    setSelectedSupplies(selectedSupplies.filter(s => s.id !== supplyId));
  };

  // Handle form submission
  const onSubmit = (data: BundleFormValues) => {
    // Calculate and include the total cost in the data
    const totalCost = calculateTotalPrice().toFixed(2);
    const finalData = {
      ...data,
      price: data.price,
      totalCost: totalCost,
      recipes: selectedRecipes,
      supplies: selectedSupplies
    };
    
    onSave(finalData);
    setOpen(false);
    
    // Reset form state
    form.reset();
    setSelectedRecipes([]);
    setSelectedSupplies([]);
    setRecipeSearchQuery("");
    setSupplySearchQuery("");
  };

  // Categories for bundles
  const categories = ["Cake", "Macaron", "Cookie", "Cupcake", "Other"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Bundle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Bundle</DialogTitle>
          <DialogDescription>
            Combine recipes and supplies to create a product bundle
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* Bundle Details Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Bundle Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bundle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bundle name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bundle Price</FormLabel>
                      <FormControl>
                        <div className="relative w-1/3">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            className="pl-7" 
                            {...field} 
                            value={calculateTotalPrice().toFixed(2)}
                            readOnly
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Price is calculated automatically based on selected items
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              {/* Recipes Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Recipes</h2>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for recipes"
                    className="pl-8"
                    value={recipeSearchQuery}
                    onChange={(e) => setRecipeSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="mt-4">
                  {selectedRecipes.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Recipes:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipes.map(recipe => (
                          <Badge key={recipe.id} variant="secondary" className="flex items-center gap-1">
                            {recipe.name}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 text-muted-foreground"
                              onClick={() => removeRecipe(recipe.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 border rounded-md border-dashed">
                      <div className="flex items-center text-center text-muted-foreground">
                        <InfoIcon className="h-5 w-5 mr-2" />
                        <p>Search your recipe list and add them to your bundle</p>
                      </div>
                    </div>
                  )}
                  
                  {filteredRecipes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Search Results:</h4>
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-[1fr,auto] bg-muted p-2 text-sm font-medium">
                          <div>Recipe Name</div>
                          <div className="text-right">Action</div>
                        </div>
                        <div className="divide-y max-h-32 overflow-y-auto">
                          {filteredRecipes.map(recipe => (
                            <div key={recipe.id} className="grid grid-cols-[1fr,auto] p-2 items-center">
                              <div>{recipe.name}</div>
                              <Button
                                size="sm"
                                onClick={() => addRecipe(recipe)}
                                disabled={selectedRecipes.some(r => r.id === recipe.id)}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Supplies Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Supplies</h2>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for supplies"
                    className="pl-8"
                    value={supplySearchQuery}
                    onChange={(e) => setSupplySearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="mt-4">
                  {selectedSupplies.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Selected Supplies:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedSupplies.map(supply => (
                          <Badge key={supply.id} variant="outline" className="flex items-center gap-1">
                            {supply.name}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 text-muted-foreground"
                              onClick={() => removeSupply(supply.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 border rounded-md border-dashed">
                      <div className="flex items-center text-center text-muted-foreground">
                        <InfoIcon className="h-5 w-5 mr-2" />
                        <p>Search your supplies list and add them to your bundle</p>
                      </div>
                    </div>
                  )}
                  
                  {filteredSupplies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Search Results:</h4>
                      <div className="border rounded-md overflow-hidden">
                        <div className="grid grid-cols-[1fr,auto] bg-muted p-2 text-sm font-medium">
                          <div>Supply Name</div>
                          <div className="text-right">Action</div>
                        </div>
                        <div className="divide-y max-h-32 overflow-y-auto">
                          {filteredSupplies.map(supply => (
                            <div key={supply.id} className="grid grid-cols-[1fr,auto] p-2 items-center">
                              <div>{supply.name}</div>
                              <Button
                                size="sm"
                                onClick={() => addSupply(supply)}
                                disabled={selectedSupplies.some(s => s.id === supply.id)}
                              >
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Bundle Summary:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecipes.length} Recipes, {selectedSupplies.length} Supplies
                  </p>
                </div>
                <p className="text-lg font-medium">
                  Total Price: ${calculateTotalPrice().toFixed(2)}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">
                Save Bundle
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBundleDialog;