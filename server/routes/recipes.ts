import { Router } from "express";
import { db } from "../db";
import { recipes, recipeIngredients, ingredients } from "@shared/schema";
import { and, desc, eq } from "drizzle-orm";
import { insertRecipeSchema, insertRecipeIngredientSchema } from "@shared/schema";

const router = Router();

// For TypeScript type safety
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Get all recipes for the user
router.get("/", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to user 1 for development
    
    // Get all recipes for this user
    const userRecipes = await db.select().from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.id));
    
    // Get recipe ingredients for all recipes
    const recipeIds = userRecipes.map(recipe => recipe.id);
    
    // If there are no recipes, return empty array
    if (recipeIds.length === 0) {
      return res.json([]);
    }
    
    // Get all recipe ingredients for these recipes
    const recipeIngredientsData = await db.select()
      .from(recipeIngredients)
      .where(
        recipeIds.length > 0 
          ? eq(recipeIngredients.recipeId, recipeIds[0]) 
          : eq(recipeIngredients.recipeId, -1)  // Return nothing if no recipes
      );
    
    // Get all ingredient IDs from recipe ingredients
    const ingredientIds = recipeIngredientsData.map(ri => ri.ingredientId);
    
    // Get all ingredients for these recipe ingredients
    let ingredientsData = [];
    
    // We need to fetch each ingredient individually since we can't use .in()
    if (ingredientIds.length > 0) {
      // Create an array of promises for each ingredient fetch
      const ingredientPromises = ingredientIds.map(id => 
        db.select().from(ingredients).where(eq(ingredients.id, id))
      );
      
      // Execute all promises and flatten the resulting array
      const results = await Promise.all(ingredientPromises);
      ingredientsData = results.flat();
    }
    
    // Create lookup maps
    const ingredientsMap = ingredientsData.reduce((acc, ingredient) => {
      acc[ingredient.id] = ingredient;
      return acc;
    }, {} as Record<number, typeof ingredientsData[0]>);
    
    // Group recipe ingredients by recipe ID
    const ingredientsByRecipe = recipeIngredientsData.reduce((acc, item) => {
      if (!acc[item.recipeId]) {
        acc[item.recipeId] = [];
      }
      acc[item.recipeId].push({
        ...item,
        ingredient: ingredientsMap[item.ingredientId] || null
      });
      return acc;
    }, {} as Record<number, any[]>);
    
    // Attach recipe ingredients to recipes
    const recipesWithIngredients = userRecipes.map(recipe => ({
      ...recipe,
      ingredients: ingredientsByRecipe[recipe.id] || []
    }));
    
    res.json(recipesWithIngredients);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Get a single recipe by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to user 1 for development
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    
    // Get the recipe
    const [recipe] = await db.select().from(recipes)
      .where(and(
        eq(recipes.id, recipeId),
        eq(recipes.userId, userId)
      ));
    
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    // Get recipe ingredients
    const recipeIngredientsData = await db.select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, recipeId));
    
    // Get all ingredient IDs from recipe ingredients
    const ingredientIds = recipeIngredientsData.map(ri => ri.ingredientId);
    
    // Get all ingredients for these recipe ingredients
    let ingredientsData = [];
    
    // We need to fetch each ingredient individually since we can't use .in()
    if (ingredientIds.length > 0) {
      // Create an array of promises for each ingredient fetch
      const ingredientPromises = ingredientIds.map(id => 
        db.select().from(ingredients).where(eq(ingredients.id, id))
      );
      
      // Execute all promises and flatten the resulting array
      const results = await Promise.all(ingredientPromises);
      ingredientsData = results.flat();
    }
    
    // Create lookup map for ingredients
    const ingredientsMap = ingredientsData.reduce((acc, ingredient) => {
      acc[ingredient.id] = ingredient;
      return acc;
    }, {} as Record<number, typeof ingredientsData[0]>);
    
    // Attach ingredient details to recipe ingredients
    const recipeIngredientsWithDetails = recipeIngredientsData.map(item => ({
      ...item,
      ingredient: ingredientsMap[item.ingredientId] || null
    }));
    
    // Attach recipe ingredients to recipe
    const recipeWithIngredients = {
      ...recipe,
      ingredients: recipeIngredientsWithDetails
    };
    
    res.json(recipeWithIngredients);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

// Create a new recipe
router.post("/", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to user 1 for development
    
    // Validate recipe data
    const recipeData = insertRecipeSchema.parse({
      ...req.body,
      userId
    });
    
    // Extract ingredients from request (not part of recipe schema)
    const ingredientsList = req.body.ingredients || [];
    
    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Insert recipe
      const [recipe] = await tx.insert(recipes).values(recipeData).returning();
      
      // Insert recipe ingredients
      if (ingredientsList.length > 0) {
        const recipeIngredientValues = ingredientsList.map((item: any) => ({
          recipeId: recipe.id,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          notes: item.notes || null
        }));
        
        await tx.insert(recipeIngredients).values(recipeIngredientValues);
      }
      
      return recipe;
    });
    
    res.status(201).json({ success: true, id: result.id, message: "Recipe created successfully" });
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

// Update a recipe
router.put("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to user 1 for development
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    
    // Check if recipe exists and belongs to user
    const [existingRecipe] = await db.select().from(recipes)
      .where(and(
        eq(recipes.id, recipeId),
        eq(recipes.userId, userId)
      ));
    
    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    // Update recipe data (excluding id, userId, createdAt)
    const recipeData = {
      name: req.body.name,
      description: req.body.description,
      servings: req.body.servings,
      instructions: req.body.instructions,
      totalCost: req.body.totalCost,
      prepTime: req.body.prepTime,
      cookTime: req.body.cookTime,
      imageUrl: req.body.imageUrl,
      category: req.body.category,
      updatedAt: new Date()
    };
    
    // Extract ingredients from request
    const ingredientsList = req.body.ingredients || [];
    
    // Start a transaction
    await db.transaction(async (tx) => {
      // Update recipe
      await tx.update(recipes)
        .set(recipeData)
        .where(eq(recipes.id, recipeId));
      
      // Delete existing recipe ingredients
      await tx.delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));
      
      // Insert new recipe ingredients
      if (ingredientsList.length > 0) {
        const recipeIngredientValues = ingredientsList.map((item: any) => ({
          recipeId: recipeId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          notes: item.notes || null
        }));
        
        await tx.insert(recipeIngredients).values(recipeIngredientValues);
      }
    });
    
    res.json({ success: true, message: "Recipe updated successfully" });
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// Delete a recipe
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to user 1 for development
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    
    // Check if recipe exists and belongs to user
    const [existingRecipe] = await db.select().from(recipes)
      .where(and(
        eq(recipes.id, recipeId),
        eq(recipes.userId, userId)
      ));
    
    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete recipe ingredients first (foreign key constraint)
      await tx.delete(recipeIngredients)
        .where(eq(recipeIngredients.recipeId, recipeId));
      
      // Delete recipe
      await tx.delete(recipes)
        .where(and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, userId)
        ));
    });
    
    res.json({ success: true, message: "Recipe deleted successfully" });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

export default router;