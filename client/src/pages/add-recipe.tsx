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
import { InfoIcon, Plus } from "lucide-react";
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
  const [ingredients, setIngredients] = useState<{ qty: string; ingredient: string; cost: string }[]>([]);
  const [recipeImage, setRecipeImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { qty: "", ingredient: "", cost: "" }]);
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
      
      // Add ingredients
      formData.append('ingredients', JSON.stringify(ingredients));
      
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
                      onClick={handleAddIngredient}
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
                        <div className="col-span-8">Ingredient</div>
                        <div className="col-span-2">Cost</div>
                      </div>
                      {ingredients.map((ing, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2">
                          <div className="col-span-2">
                            <Input 
                              value={ing.qty} 
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].qty = e.target.value;
                                setIngredients(newIngredients);
                              }}
                            />
                          </div>
                          <div className="col-span-8">
                            <Input 
                              value={ing.ingredient} 
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].ingredient = e.target.value;
                                setIngredients(newIngredients);
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input 
                              value={ing.cost} 
                              onChange={(e) => {
                                const newIngredients = [...ingredients];
                                newIngredients[index].cost = e.target.value;
                                setIngredients(newIngredients);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                      <InfoIcon className="h-8 w-8 mb-2" />
                      <p>You have not added any ingredients to your order.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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