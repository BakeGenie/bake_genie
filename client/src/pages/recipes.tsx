import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Recipe, Ingredient } from "@shared/schema";
import { RecipeWithIngredients } from "@/types";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertRecipeSchema, insertIngredientSchema } from "@shared/schema";
import { PlusIcon, ClockIcon, UtensilsCrossedIcon, XIcon, SearchIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Extended schema with validation rules for recipe
const recipeFormSchema = insertRecipeSchema.extend({
  name: z.string().min(1, "Name is required"),
  servings: z.coerce.number().int().positive("Servings must be a positive number"),
  ingredients: z.array(
    z.object({
      ingredientId: z.number().int().positive("Ingredient is required"),
      quantity: z.coerce.number().positive("Quantity must be a positive number"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one ingredient is required"),
});

// Extended schema with validation rules for ingredient
const ingredientFormSchema = insertIngredientSchema.extend({
  name: z.string().min(1, "Name is required"),
  unit: z.string().min(1, "Unit is required"),
  unitCost: z.coerce.number().optional(),
  packSize: z.coerce.number().optional(),
  packCost: z.coerce.number().optional(),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;
type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

const Recipes = () => {
  const { toast } = useToast();
  const [isNewRecipeDialogOpen, setIsNewRecipeDialogOpen] = React.useState(false);
  const [isNewIngredientDialogOpen, setIsNewIngredientDialogOpen] = React.useState(false);
  const [isViewRecipeDialogOpen, setIsViewRecipeDialogOpen] = React.useState(false);
  const [selectedRecipe, setSelectedRecipe] = React.useState<RecipeWithIngredients | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("recipes");
  const [searchRecipe, setSearchRecipe] = React.useState("");
  const [searchIngredient, setSearchIngredient] = React.useState("");

  // Fetch recipes
  const { data: recipes = [], isLoading: isLoadingRecipes } = useQuery<RecipeWithIngredients[]>({
    queryKey: ["/api/recipes"],
  });

  // Fetch ingredients
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Recipe form
  const recipeForm = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      name: "",
      description: "",
      servings: 1,
      instructions: "",
      prepTime: 0,
      cookTime: 0,
      category: "",
      ingredients: [
        {
          ingredientId: 0,
          quantity: 0,
          notes: "",
        },
      ],
    },
  });

  // Ingredient form
  const ingredientForm = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      userId: 1, // In a real app, this would be the current user's ID
      name: "",
      unit: "",
      unitCost: 0,
      packSize: 0,
      packCost: 0,
    },
  });

  // Handle recipe ingredient fields
  const { fields, append, remove } = useFieldArray({
    control: recipeForm.control,
    name: "ingredients"
  });

  // Handle new recipe submission
  const handleNewRecipeSubmit = async (data: RecipeFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/recipes", data);
      
      // Invalidate recipes query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      
      // Reset form and close dialog
      recipeForm.reset();
      setIsNewRecipeDialogOpen(false);
      
      toast({
        title: "Recipe Created",
        description: `${data.name} has been added to your recipes.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle new ingredient submission
  const handleNewIngredientSubmit = async (data: IngredientFormValues) => {
    setIsSubmitting(true);
    
    try {
      await apiRequest("POST", "/api/ingredients", data);
      
      // Invalidate ingredients query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      
      // Reset form and close dialog
      ingredientForm.reset();
      setIsNewIngredientDialogOpen(false);
      
      toast({
        title: "Ingredient Created",
        description: `${data.name} has been added to your ingredients.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the ingredient. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter recipes by search term
  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchRecipe.toLowerCase()) ||
    (recipe.description && recipe.description.toLowerCase().includes(searchRecipe.toLowerCase()))
  );

  // Filter ingredients by search term
  const filteredIngredients = ingredients.filter(ingredient => 
    ingredient.name.toLowerCase().includes(searchIngredient.toLowerCase())
  );

  // Handle recipe selection for viewing
  const handleRecipeClick = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe);
    setIsViewRecipeDialogOpen(true);
  };

  // Calculate total cost of a recipe
  const calculateRecipeCost = (recipe: RecipeWithIngredients) => {
    if (!recipe.ingredients) return 0;
    
    return recipe.ingredients.reduce((total, recipeIngredient) => {
      const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId);
      if (!ingredient || !ingredient.unitCost) return total;
      
      return total + (Number(ingredient.unitCost) * Number(recipeIngredient.quantity));
    }, 0);
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Recipes & Ingredients"
        actions={
          <div className="flex space-x-2">
            {activeTab === "recipes" ? (
              <Button onClick={() => setIsNewRecipeDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" /> New Recipe
              </Button>
            ) : (
              <Button onClick={() => setIsNewIngredientDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" /> New Ingredient
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        defaultValue="recipes"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        </TabsList>
        
        {/* Recipes Tab */}
        <TabsContent value="recipes">
          <div className="mb-4 mt-4 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search recipes..."
              className="pl-9"
              value={searchRecipe}
              onChange={(e) => setSearchRecipe(e.target.value)}
            />
          </div>
          
          {isLoadingRecipes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRecipeClick(recipe)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle>{recipe.name}</CardTitle>
                    {recipe.category && (
                      <CardDescription>{recipe.category}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {recipe.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{recipe.description}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <UtensilsCrossedIcon className="h-4 w-4 mr-1" />
                        <span>{recipe.servings} servings</span>
                      </div>
                      {(recipe.prepTime || recipe.cookTime) && (
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>
                            {recipe.prepTime && `${recipe.prepTime} min prep`}
                            {recipe.prepTime && recipe.cookTime && " + "}
                            {recipe.cookTime && `${recipe.cookTime} min cook`}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-sm font-medium">Cost per serving</span>
                      <span className="font-medium">
                        ${(calculateRecipeCost(recipe) / (recipe.servings || 1)).toFixed(2)}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-8">
              <CardContent className="pt-6 text-center">
                <div className="mb-4">
                  <UtensilsCrossedIcon className="h-12 w-12 mx-auto text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No recipes found</h3>
                <p className="text-gray-500 mb-4">
                  {searchRecipe
                    ? "No recipes match your search criteria. Try a different search term."
                    : "You haven't created any recipes yet. Create your first recipe to get started."}
                </p>
                <Button onClick={() => setIsNewRecipeDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" /> New Recipe
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Ingredients Tab */}
        <TabsContent value="ingredients">
          <div className="mb-4 mt-4 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ingredients..."
              className="pl-9"
              value={searchIngredient}
              onChange={(e) => setSearchIngredient(e.target.value)}
            />
          </div>
          
          {isLoadingIngredients ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-2"></div>
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-12 bg-gray-100 rounded mb-2"></div>
              ))}
            </div>
          ) : filteredIngredients.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Ingredient</th>
                        <th className="text-left p-4">Unit</th>
                        <th className="text-right p-4">Unit Cost</th>
                        <th className="text-right p-4">Pack Size</th>
                        <th className="text-right p-4">Pack Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ingredient) => (
                        <tr
                          key={ingredient.id}
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            toast({
                              title: "Edit Ingredient",
                              description: "Ingredient editing will be implemented soon.",
                            });
                          }}
                        >
                          <td className="p-4">{ingredient.name}</td>
                          <td className="p-4">{ingredient.unit}</td>
                          <td className="p-4 text-right">
                            {ingredient.unitCost !== null
                              ? `$${Number(ingredient.unitCost).toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="p-4 text-right">
                            {ingredient.packSize !== null
                              ? `${Number(ingredient.packSize).toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="p-4 text-right">
                            {ingredient.packCost !== null
                              ? `$${Number(ingredient.packCost).toFixed(2)}`
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-8">
              <CardContent className="pt-6 text-center">
                <div className="mb-4">
                  <UtensilsCrossedIcon className="h-12 w-12 mx-auto text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">No ingredients found</h3>
                <p className="text-gray-500 mb-4">
                  {searchIngredient
                    ? "No ingredients match your search criteria. Try a different search term."
                    : "You haven't added any ingredients yet. Add your first ingredient to get started."}
                </p>
                <Button onClick={() => setIsNewIngredientDialogOpen(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" /> New Ingredient
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* New Recipe Dialog */}
      <Dialog open={isNewRecipeDialogOpen} onOpenChange={setIsNewRecipeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Recipe</DialogTitle>
          </DialogHeader>
          <Form {...recipeForm}>
            <form onSubmit={recipeForm.handleSubmit(handleNewRecipeSubmit)} className="space-y-4">
              <FormField
                control={recipeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Vanilla Buttercream" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={recipeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A smooth, delicious vanilla frosting..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={recipeForm.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servings</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={recipeForm.control}
                  name="prepTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prep Time (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={recipeForm.control}
                  name="cookTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cook Time (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={recipeForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Frosting" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Ingredients</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ ingredientId: 0, quantity: 0, notes: "" })}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" /> Add Ingredient
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="mb-4 p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Ingredient {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={recipeForm.control}
                        name={`ingredients.${index}.ingredientId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ingredient</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an ingredient" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ingredients.map((ingredient) => (
                                  <SelectItem
                                    key={ingredient.id}
                                    value={ingredient.id.toString()}
                                  >
                                    {ingredient.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={recipeForm.control}
                        name={`ingredients.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={recipeForm.control}
                      name={`ingredients.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., sifted, room temperature" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              
              <FormField
                control={recipeForm.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="1. Mix butter until fluffy..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewRecipeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Recipe"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Ingredient Dialog */}
      <Dialog open={isNewIngredientDialogOpen} onOpenChange={setIsNewIngredientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Ingredient</DialogTitle>
          </DialogHeader>
          <Form {...ingredientForm}>
            <form onSubmit={ingredientForm.handleSubmit(handleNewIngredientSubmit)} className="space-y-4">
              <FormField
                control={ingredientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredient Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Butter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ingredientForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="g" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={ingredientForm.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.02"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={ingredientForm.control}
                  name="packSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pack Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="250"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={ingredientForm.control}
                  name="packCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pack Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="5.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewIngredientDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Ingredient"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Recipe Dialog */}
      {selectedRecipe && (
        <Dialog open={isViewRecipeDialogOpen} onOpenChange={setIsViewRecipeDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.name}</DialogTitle>
              {selectedRecipe.category && (
                <p className="text-gray-500">{selectedRecipe.category}</p>
              )}
            </DialogHeader>
            
            {selectedRecipe.description && (
              <div className="mb-4">
                <p className="text-gray-700">{selectedRecipe.description}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center">
                <UtensilsCrossedIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>{selectedRecipe.servings} servings</span>
              </div>
              {selectedRecipe.prepTime && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Prep: {selectedRecipe.prepTime} min</span>
                </div>
              )}
              {selectedRecipe.cookTime && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Cook: {selectedRecipe.cookTime} min</span>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients && selectedRecipe.ingredients.map((recipeIngredient) => {
                  const ingredient = ingredients.find(ing => ing.id === recipeIngredient.ingredientId);
                  return ingredient ? (
                    <li key={recipeIngredient.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{recipeIngredient.quantity} {ingredient.unit}</span>{" "}
                        <span>{ingredient.name}</span>
                        {recipeIngredient.notes && (
                          <span className="text-gray-500 text-sm"> ({recipeIngredient.notes})</span>
                        )}
                      </div>
                      {ingredient.unitCost && (
                        <span className="text-gray-500 text-sm">
                          ${(Number(ingredient.unitCost) * Number(recipeIngredient.quantity)).toFixed(2)}
                        </span>
                      )}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
            
            {selectedRecipe.instructions && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Instructions</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {selectedRecipe.instructions}
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Total Cost</p>
                <p className="text-xl font-medium">${calculateRecipeCost(selectedRecipe).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Cost per Serving</p>
                <p className="text-xl font-medium">
                  ${(calculateRecipeCost(selectedRecipe) / (selectedRecipe.servings || 1)).toFixed(2)}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewRecipeDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewRecipeDialogOpen(false);
                  toast({
                    title: "Edit Recipe",
                    description: "Recipe editing will be implemented soon.",
                  });
                }}
              >
                Edit Recipe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Recipes;
