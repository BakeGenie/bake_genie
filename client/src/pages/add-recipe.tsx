import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InfoIcon, Plus, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Measurement units for ingredient amounts
const measurementUnits = [
  "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "piece", "pinch"
];

// Define recipe form schema
const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  servings: z.number().optional(),
  costPrice: z.string().optional(),
  customPrice: z.string().optional(),
  directions: z.string().optional(),
  storageInfo: z.string().optional(),
  allergens: z.object({
    eggs: z.boolean().default(false),
    fish: z.boolean().default(false),
    shellfish: z.boolean().default(false),
    peanuts: z.boolean().default(false),
    sesame: z.boolean().default(false),
    lupin: z.boolean().default(false),
    dairy: z.boolean().default(false),
    nuts: z.boolean().default(false),
    soy: z.boolean().default(false),
    mustard: z.boolean().default(false),
    celery: z.boolean().default(false),
    gluten: z.boolean().default(false),
    sulphites: z.boolean().default(false),
    milk: z.boolean().default(false),
    other: z.boolean().default(false),
  }),
  nutsDetails: z.string().optional(),
  otherAllergenDetails: z.string().optional(),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const categories = ["Cake", "Filling", "Cookies", "Icing", "Frosting", "Other"];

const AddRecipe = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<{ qty: string; ingredient: string; cost: string; unit: string }[]>([]);
  const [recipeImage, setRecipeImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ingredient dialog state
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "kg",
    cost: "$ 0.00",
  });
  
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Cake",
      servings: undefined,
      costPrice: "$ 0.00",
      customPrice: "0",
      directions: "",
      storageInfo: "",
      allergens: {
        eggs: false,
        fish: false,
        shellfish: false,
        peanuts: false,
        sesame: false,
        lupin: false,
        dairy: false,
        nuts: false,
        soy: false,
        mustard: false,
        celery: false,
        gluten: false,
        sulphites: false,
        milk: false,
        other: false,
      },
      nutsDetails: "",
      otherAllergenDetails: "",
    },
  });

  const handleAddIngredientClick = () => {
    setIngredientDialogOpen(true);
  };
  
  const resetIngredientDialog = () => {
    setNewIngredient({
      name: "",
      quantity: "",
      unit: "kg",
      cost: "$ 0.00",
    });
  };
  
  const handleAddIngredientToRecipe = () => {
    if (newIngredient.name && newIngredient.quantity) {
      setIngredients([
        ...ingredients, 
        { 
          ingredient: newIngredient.name, 
          qty: newIngredient.quantity, 
          unit: newIngredient.unit, 
          cost: newIngredient.cost 
        }
      ]);
      
      // Calculate total cost for the recipe
      const totalCost = parseFloat(form.getValues("costPrice").replace("$", "").trim()) || 0;
      const ingredientCost = parseFloat(newIngredient.cost.replace("$", "").trim()) || 0;
      const newTotalCost = totalCost + ingredientCost;
      
      // Update the form's costPrice field
      form.setValue("costPrice", `$ ${newTotalCost.toFixed(2)}`);
      
      // Close dialog and reset values
      setIngredientDialogOpen(false);
      resetIngredientDialog();
      
      toast({
        title: "Ingredient added",
        description: `${newIngredient.name} has been added to the recipe`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter both an ingredient name and quantity",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (3MB limit = 3 * 1024 * 1024 bytes)
      if (file.size > 3 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Image must be less than 3MB in size.",
        });
        return;
      }
      setRecipeImage(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const onSubmit = async (data: RecipeFormValues) => {
    try {
      // Here you would create a FormData object and append the image if needed
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      
      // Add ingredients with all fields (name, quantity, unit, cost)
      formData.append('ingredients', JSON.stringify(ingredients.map(ing => ({
        name: ing.ingredient,
        quantity: ing.qty,
        unit: ing.unit,
        cost: ing.cost
      }))));
      
      // Add image if selected
      if (recipeImage) {
        formData.append('image', recipeImage);
      }
      
      // In a real implementation, this would send formData to your API
      console.log("Recipe form data:", data);
      console.log("Ingredients:", ingredients);
      console.log("Image:", recipeImage);
      
      toast({
        title: "Recipe saved",
        description: "Your recipe has been saved successfully",
      });
      
      // Navigate back to recipes list
      navigate("/recipes/recipes-list");
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem saving your recipe",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Add New Recipe" 
        backLink="/recipes/recipes-list" 
        backLabel="Back to Recipes"
      />
      
      <div className="max-w-6xl mx-auto mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name:</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Recipe Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description:</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter Description" {...field} />
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
                        <FormLabel>Category:</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
                  
                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servings:</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost Price:</FormLabel>
                        <FormControl>
                          <Input 
                            readOnly 
                            value={field.value} 
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Price:</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              placeholder="0" 
                              {...field}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <InfoIcon className="h-3 w-3" /> Your 'Custom Price' should be the same as your 'Cost Price', unless you add in a buffer for ingredient price changes.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>Ingredients</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddIngredientClick}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Ingredient
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ingredients.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-2 font-medium text-sm">
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-2">Unit</div>
                        <div className="col-span-6">Ingredient</div>
                        <div className="col-span-2">Cost</div>
                      </div>
                      {ingredients.map((ing, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <div className="col-span-2">
                            <Input 
                              value={ing.qty} 
                              readOnly
                              className="bg-muted/30"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              value={ing.unit} 
                              readOnly
                              className="bg-muted/30"
                            />
                          </div>
                          <div className="col-span-6">
                            <Input 
                              value={ing.ingredient} 
                              readOnly
                              className="bg-muted/30"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              value={ing.cost} 
                              readOnly
                              className="bg-muted/30"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                      <InfoIcon className="h-8 w-8 mb-2" />
                      <p>You have not added any ingredients to your recipe.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Ingredient Dialog */}
              <Dialog open={ingredientDialogOpen} onOpenChange={setIngredientDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Ingredient</DialogTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-4 top-4"
                      onClick={() => setIngredientDialogOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-2 pb-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Search Ingredients:</h4>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter Ingredient Name"
                          className="pl-8"
                          value={newIngredient.name}
                          onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Quantity:</h4>
                        <Input
                          type="text"
                          value={newIngredient.quantity}
                          onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Measurement:</h4>
                        <Select
                          value={newIngredient.unit}
                          onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {measurementUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Cost: $ {parseFloat(newIngredient.cost.replace("$", "").trim() || "0").toFixed(2)}</h4>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={parseFloat(newIngredient.cost.replace("$", "").trim() || "0")}
                        onChange={(e) => setNewIngredient({ 
                          ...newIngredient, 
                          cost: `$ ${parseFloat(e.target.value).toFixed(2)}` 
                        })}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setIngredientDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleAddIngredientToRecipe}>
                      Add to Recipe
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Image Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="recipeImage"
                  />
                  <div className="flex">
                    <Input 
                      placeholder="Choose files to upload"
                      value={recipeImage ? recipeImage.name : ""}
                      readOnly
                      className="rounded-r-none"
                    />
                    <Button 
                      type="button" 
                      className="rounded-l-none"
                      onClick={triggerFileInput}
                    >
                      Choose Files
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <InfoIcon className="h-3 w-3" /> Images larger than 3mb may take longer to upload when saving the order.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recipe Directions</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="directions"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter in the directions to follow when making this recipe." 
                          className="min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Allergens</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">Please select which allergens are applicable to this recipe</p>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="allergens.eggs"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Eggs</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.soy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Soy</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.fish"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Fish</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.mustard"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Mustard</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.shellfish"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Shellfish</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.celery"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Celery (Celeriac)</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.peanuts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Peanuts</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.gluten"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Gluten (Wheat, rye, spelt, oats, kamut)</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.sesame"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Sesame</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.sulphites"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Sulphites & Sulphar Dioxide</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.lupin"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Lupin</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.milk"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Milk</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.dairy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Dairy</FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="allergens.nuts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Nuts</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {form.watch("allergens.nuts") && (
                    <FormField
                      control={form.control}
                      name="nutsDetails"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormControl>
                            <Input placeholder="e.g. Brazil, Almond, Walnut, Macadamia, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="allergens.other"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Other</FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("allergens.other") && (
                    <FormField
                      control={form.control}
                      name="otherAllergenDetails"
                      render={({ field }) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <Input placeholder="Enter Other Allergen Details" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Storage Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="storageInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter Storage Information and Shelf Life details" 
                            className="min-h-32" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/recipes/recipes-list")}
              >
                Cancel
              </Button>
              <Button type="submit">Save Recipe</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddRecipe;