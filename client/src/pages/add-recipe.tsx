import React from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
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

// Define recipe form schema
const recipeFormSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  category: z.string().optional(),
  servings: z.number().optional(),
  servingSize: z.string().optional(),
  ingredients: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  customPrice: z.string().optional(),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

const categories = ["Cake", "Filling", "Cookies", "Icing", "Frosting", "Other"];

const AddRecipe = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "",
      category: "Cake",
      servings: undefined,
      servingSize: "",
      ingredients: "",
      instructions: "",
      notes: "",
      customPrice: "",
    },
  });

  const onSubmit = async (data: RecipeFormValues) => {
    try {
      // In a real implementation, this would send data to your API
      console.log("Recipe form data:", data);
      
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
      
      <div className="max-w-3xl mx-auto mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipe Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recipe name" {...field} />
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servings</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Number of servings" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="servingSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serving Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1 slice, 1 cookie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter ingredients (one per line)" 
                      className="min-h-32" 
                      {...field} 
                    />
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
                      placeholder="Enter preparation instructions" 
                      className="min-h-32" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes" 
                      {...field} 
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
                  <FormLabel>Custom Price</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="$0.00" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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