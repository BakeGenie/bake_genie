import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Define schema for the new ingredient form
const newIngredientSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  category: z.string().min(1, { message: "Category is required" }),
});

type NewIngredientFormValues = z.infer<typeof newIngredientSchema>;

// Define ingredient categories
export type IngredientCategory = 'cake-flavor' | 'icing-type' | 'filling-type';

// Maps category values to display names
const categoryDisplayNames: Record<IngredientCategory, string> = {
  'cake-flavor': 'Cake Flavor',
  'icing-type': 'Icing Type',
  'filling-type': 'Filling Type'
};

interface NewIngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: IngredientCategory;
  onSuccess?: (name: string) => void;
}

export function NewIngredientDialog({ 
  open, 
  onOpenChange,
  category,
  onSuccess
}: NewIngredientDialogProps) {
  // Set up form
  const form = useForm<NewIngredientFormValues>({
    resolver: zodResolver(newIngredientSchema),
    defaultValues: {
      name: "",
      description: "",
      category: category,
    },
  });

  // Set up mutation
  const mutation = useMutation({
    mutationFn: (data: NewIngredientFormValues) => 
      apiRequest('POST', '/api/ingredients', data),
    onSuccess: (response: Response) => {
      response.json().then(data => {
        toast({
          title: "Ingredient created",
          description: `${data.name} has been added to your ingredients.`,
        });
        form.reset();
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(data.name);
        }
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating ingredient",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: NewIngredientFormValues) {
    // For simplicity, we're using a temporary approach until the API is implemented
    // In a real implementation, this would submit to the server
    // mutation.mutate(data);
    
    // Temporary local implementation
    console.log("Creating new ingredient:", data);
    toast({
      title: "Ingredient created",
      description: `${data.name} has been added as a ${categoryDisplayNames[category]}.`,
    });
    form.reset();
    onOpenChange(false);
    if (onSuccess) {
      onSuccess(data.name);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New {categoryDisplayNames[category]}</DialogTitle>
          <DialogDescription>
            Create a new {categoryDisplayNames[category].toLowerCase()} to use in your cake.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={`Enter ${categoryDisplayNames[category].toLowerCase()} name`} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter a description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Add Ingredient"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}