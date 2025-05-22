import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusIcon, 
  XIcon,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertRecipeSchema } from "@shared/schema";

// Type for ingredients
interface Ingredient {
  id: number;
  name: string;
  unit: string;
  costPerUnit: string | null;
  packSize: string | null;
  packCost: string | null;
  supplier: string | null;
}

// Type for a recipe with ingredients
interface RecipeWithIngredients {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  servings: number;
  servingSize: string | null;
  instructions: string | null;
  prepTime: number | null;
  cookTime: number | null;
  category: string | null;
  ingredients?: {
    id: number;
    recipeId: number;
    ingredientId: number;
    quantity: string;
    unit: string;
    cost: string;
    notes?: string;
  }[];
}

// Extended schema with validation rules for recipe
const recipeFormSchema = insertRecipeSchema.extend({
  name: z.string().min(1, "Name is required"),
  servings: z.coerce.number().int().positive("Servings must be a positive number"),
  prepTime: z.coerce.number().int().nonnegative().nullable(),
  cookTime: z.coerce.number().int().nonnegative().nullable(),
  ingredients: z.array(
    z.object({
      ingredientId: z.number().int().positive("Ingredient is required"),
      quantity: z.coerce.number().positive("Quantity must be a positive number"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one ingredient is required"),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const EditRecipePage = () => {
  const params = useParams();
  const recipeId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query to fetch recipe details
  const { data: recipe, isLoading: isLoadingRecipe } = useQuery<RecipeWithIngredients>({
    queryKey: [`/api/recipes/${recipeId}`],
    enabled: !!recipeId,
  });

  // Query to fetch all ingredients
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  // Setup form with validation
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      userId: 1,
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

  // Handle recipe ingredient fields
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients"
  });

  // Populate form with recipe data when loaded
  useEffect(() => {
    if (recipe) {
      form.reset({
        userId: recipe.userId,
        name: recipe.name,
        description: recipe.description || "",
        servings: recipe.servings,
        instructions: recipe.instructions || "",
        prepTime: recipe.prepTime || 0,
        cookTime: recipe.cookTime || 0,
        category: recipe.category || "",
        ingredients: recipe.ingredients?.map(ingredient => ({
          ingredientId: Number(ingredient.ingredientId),
          quantity: Number(ingredient.quantity),
          notes: ingredient.notes || "",
        })) || [],
      });
      
      // If there are no ingredients, add an empty one
      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        append({ ingredientId: 0, quantity: 0, notes: "" });
      }
    }
  }, [recipe, form, append]);

  // Handle form submission
  const handleSubmit = async (data: RecipeFormValues) => {
    if (!recipeId) return;
    
    setIsSubmitting(true);
    
    try {
      // Format data to match server expectation
      const formattedData = {
        ...data,
        // Convert fields to match server expectations
        servings: Number(data.servings),
        prepTime: data.prepTime != null ? Number(data.prepTime) : null,
        cookTime: data.cookTime != null ? Number(data.cookTime) : null,
        // Format ingredients to match server expectation
        ingredients: data.ingredients.map(ingredient => ({
          ingredientId: Number(ingredient.ingredientId),
          quantity: String(ingredient.quantity),
          unit: "", // Required by server
          cost: "0", // Required by server
          notes: ingredient.notes || ""
        }))
      };
      
      console.log("Submitting data:", formattedData);
      
      await apiRequest("PUT", `/api/recipes/${recipeId}`, formattedData);
      
      // Invalidate recipes query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/recipes/${recipeId}`] });
      
      toast({
        title: "Recipe Updated",
        description: `${data.name} has been updated successfully.`,
      });
      
      // Navigate back to recipes list
      navigate("/recipes/recipes-list");
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast({
        title: "Error",
        description: "There was an error updating the recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingRecipe || isLoadingIngredients) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader 
          title="Edit Recipe" 
          backLink="/recipes/recipes-list" 
          backLabel="Back to Recipes"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading recipe...</span>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageHeader 
          title="Recipe Not Found" 
          backLink="/recipes/recipes-list" 
          backLabel="Back to Recipes"
        />
        <div className="bg-white rounded-md shadow-sm p-12 text-center mt-6">
          <p className="text-gray-500 mb-4">The recipe you're looking for could not be found.</p>
          <Button onClick={() => navigate("/recipes/recipes-list")}>
            Back to Recipes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Edit Recipe" 
        backLink="/recipes/recipes-list" 
        backLabel="Back to Recipes"
      />
      
      <div className="bg-white rounded-md shadow-sm border p-6 mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Vanilla Frosting" {...field} />
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
              control={form.control}
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
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. Mix butter and sugar..."
                      className="min-h-[100px]"
                      {...field}
                    />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.ingredientId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ingredient</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an ingredient" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ingredients.map((ingredient) => (
                                <SelectItem key={ingredient.id} value={String(ingredient.id)}>
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
                      control={form.control}
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
                    
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional notes" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/recipes/recipes-list")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditRecipePage;