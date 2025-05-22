import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertRecipeSchema, Ingredient } from "@shared/schema";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  PlusIcon,
  Trash2Icon,
  SaveIcon,
  XIcon,
  MoveIcon,
} from "lucide-react";

// Extend the recipe schema with validation
const recipeFormSchema = insertRecipeSchema.extend({
  name: z.string().min(1, "Recipe name is required"),
  servings: z.coerce.number().min(1, "Servings must be at least 1"),
  ingredients: z.array(
    z.object({
      ingredientId: z.coerce.number().min(1, "Please select an ingredient"),
      quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one ingredient is required"),
});

// Define the form values type
type RecipeFormValues = z.infer<typeof recipeFormSchema>;

// List of categories
const categories = ["Cake", "Frosting", "Filling", "Cookies", "Other"];

const AddRecipePage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch ingredients
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useQuery<Ingredient[]>({
    queryKey: ['/api/ingredients'],
    refetchOnWindowFocus: false,
  });
  
  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (data: RecipeFormValues) => {
      // Calculate the total cost
      const calculatedTotalCost = calculateTotalCost();
      
      // Ensure all numbers are properly typed
      const processedData = {
        ...data,
        userId: 1,
        servings: Number(data.servings),
        prepTime: data.prepTime ? Number(data.prepTime) : null,
        cookTime: data.cookTime ? Number(data.cookTime) : null,
        // Always send totalCost as string for decimal column compatibility
        totalCost: calculatedTotalCost.toString(),
        ingredients: data.ingredients.map(ingredient => ({
          ...ingredient,
          ingredientId: Number(ingredient.ingredientId),
          quantity: Number(ingredient.quantity)
        }))
      };
      
      console.log("Submitting recipe:", processedData);
      
      return apiRequest('/api/recipes', {
        method: 'POST',
        body: processedData,
      });
    },
    onSuccess: (data) => {
      console.log("Recipe created successfully:", data);
      toast({
        title: "Recipe created",
        description: "Your recipe has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      navigate('/recipes/recipes-list');
    },
    onError: (error) => {
      console.error("Failed to create recipe:", error);
      toast({
        title: "Error",
        description: "Failed to create recipe. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Setup form
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      servings: 1,
      category: "Other",
      ingredients: [{ ingredientId: 0, quantity: 1, notes: "" }],
      instructions: "",
      totalCost: 0,
      prepTime: 0,
      cookTime: 0,
      userId: 1, // Default to user 1 for development
    },
    mode: "onChange"
  });
  
  // Ingredients field array for dynamic ingredients list
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });
  
  // Calculate total cost based on ingredients and quantities
  const calculateTotalCost = () => {
    const formValues = form.getValues();
    if (!formValues.ingredients || formValues.ingredients.length === 0) return 0;
    
    return formValues.ingredients.reduce((total, item) => {
      const ingredient = ingredients.find(ing => ing.id === Number(item.ingredientId));
      if (ingredient?.unitCost) {
        return total + (Number(ingredient.unitCost) * Number(item.quantity));
      }
      return total;
    }, 0);
  };
  
  // Direct submit handler - bypassing React Hook Form
  const handleManualSubmit = () => {
    // Get all form values
    const formValues = form.getValues();
    
    // Calculate total cost
    const calculatedCost = calculateTotalCost();
    
    // Prepare the data with explicit typing for better compatibility
    const submissionData = {
      ...formValues,
      userId: 1, // Set the user ID
      servings: Number(formValues.servings),
      totalCost: calculatedCost.toString(), // Always send as string for decimal compatibility
      prepTime: formValues.prepTime ? Number(formValues.prepTime) : null,
      cookTime: formValues.cookTime ? Number(formValues.cookTime) : null,
      ingredients: formValues.ingredients.map(ingredient => ({
        ingredientId: Number(ingredient.ingredientId),
        quantity: Number(ingredient.quantity)
        // Removed notes field as it doesn't exist in the database table
      }))
    };
    
    console.log("Manually submitting recipe with data:", submissionData);
    
    // Show a pending toast
    toast({
      title: "Saving recipe...",
      description: "Your recipe is being saved.",
    });
    
    // Directly use the mutation function
    createRecipeMutation.mutate(submissionData);
  };
  
  // Handle form submission (kept for compatibility)
  const onSubmit = async (data: any) => {
    // Use the same handler for both paths
    handleManualSubmit();
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Add Recipe" 
        backLink="/recipes/recipes-list" 
        backLabel="Back to Recipes"
      />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main recipe details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Details</CardTitle>
                  <CardDescription>
                    Basic information about your recipe
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter recipe name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <SelectValue placeholder="Select category" />
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
                          <FormLabel>Servings</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Number of servings"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.valueAsNumber;
                                field.onChange(isNaN(value) ? '' : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prepTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preparation Time (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.valueAsNumber;
                                field.onChange(isNaN(value) ? '' : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cookTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cooking Time (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={field.value || ''}
                              onChange={(e) => {
                                const value = e.target.valueAsNumber;
                                field.onChange(isNaN(value) ? '' : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe your recipe"
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                  <CardDescription>
                    Add ingredients for your recipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start space-x-3 mb-4">
                      <div className="grid grid-cols-12 gap-3 w-full">
                        <div className="col-span-5">
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.ingredientId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : ''}>
                                  Ingredient
                                </FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(Number(value))}
                                  value={field.value ? field.value.toString() : ''}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select ingredient" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {ingredients.map((ingredient) => (
                                      <SelectItem
                                        key={ingredient.id}
                                        value={ingredient.id.toString()}
                                      >
                                        {ingredient.name} ({ingredient.unit})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : ''}>
                                  Quantity
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Quantity"
                                    value={field.value || ''}
                                    onChange={(e) => {
                                      const value = e.target.valueAsNumber;
                                      field.onChange(isNaN(value) ? '' : value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-3">
                          <FormField
                            control={form.control}
                            name={`ingredients.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? 'sr-only' : ''}>
                                  Notes
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Notes (optional)"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="col-span-1 flex items-end">
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-10"
                              onClick={() => remove(index)}
                            >
                              <Trash2Icon className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ ingredientId: 0, quantity: 1, notes: "" })}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" /> Add Ingredient
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                  <CardDescription>
                    Step-by-step instructions for your recipe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed instructions for preparing this recipe..."
                            className="min-h-40"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide clear step-by-step instructions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Recipe summary and cost calculation */}
            <div className="md:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Recipe Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Ingredients</h3>
                      <p className="text-lg font-medium">{fields.length}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Estimated Cost</h3>
                      <p className="text-lg font-medium">${calculateTotalCost().toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cost Per Serving</h3>
                      <p className="text-lg font-medium">
                        ${(calculateTotalCost() / (form.getValues().servings || 1)).toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Time</h3>
                      <p className="text-lg font-medium">
                        {Number(form.getValues().prepTime || 0) + Number(form.getValues().cookTime || 0)} min
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  <Button 
                    type="button" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={createRecipeMutation.isPending}
                    onClick={handleManualSubmit}
                  >
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {createRecipeMutation.isPending ? 'Saving...' : 'Save Recipe'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/recipes/recipes-list')}
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddRecipePage;