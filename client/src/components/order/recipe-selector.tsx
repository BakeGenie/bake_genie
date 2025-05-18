import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, CakeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeSelectorProps {
  value?: number;
  onSelect: (recipe: Recipe) => void;
}

const RecipeSelector: React.FC<RecipeSelectorProps> = ({ value, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch recipes data
  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Find the selected recipe in the recipe list
  const selectedRecipe = recipes.find(recipe => recipe.id === value);

  // Filter recipes based on search query
  const filteredRecipes = searchQuery 
    ? recipes.filter(recipe => 
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : recipes;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedRecipe ? (
            <div className="flex items-center gap-2 truncate">
              {selectedRecipe.imageUrl && (
                <div className="w-6 h-6 rounded border overflow-hidden flex items-center justify-center">
                  <img 
                    src={selectedRecipe.imageUrl} 
                    alt={selectedRecipe.name} 
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = ""; 
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              {!selectedRecipe.imageUrl && (
                <CakeIcon className="h-4 w-4 opacity-50" />
              )}
              <span className="truncate">{selectedRecipe.name}</span>
            </div>
          ) : (
            "Select recipe..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput 
            placeholder="Search recipes..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No recipes found.</CommandEmpty>
            <CommandGroup heading="Recipes">
              {filteredRecipes.map((recipe) => (
                <CommandItem
                  key={recipe.id}
                  value={recipe.name}
                  onSelect={() => {
                    onSelect(recipe);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full truncate">
                    {recipe.imageUrl && (
                      <div className="w-6 h-6 rounded border overflow-hidden flex items-center justify-center">
                        <img 
                          src={recipe.imageUrl} 
                          alt={recipe.name} 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = ""; 
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    {!recipe.imageUrl && (
                      <CakeIcon className="h-4 w-4 opacity-50" />
                    )}
                    <span className="truncate">
                      {recipe.name} 
                      {recipe.totalCost && ` - $${parseFloat(String(recipe.totalCost)).toFixed(2)}`}
                      {recipe.servings && ` (${recipe.servings} servings)`}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === recipe.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default RecipeSelector;