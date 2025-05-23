import { Router } from "express";
import { db } from "../db";
import { recipes } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { insertRecipeSchema } from "@shared/schema";

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
    const userId = req.session.userId || 1; // Default to 1 for development
    const allRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.updatedAt));
    res.json(allRecipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

// Get a single recipe by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, userId)
        )
      );
    
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    res.json(recipe);
  } catch (error) {
    console.error("Error fetching recipe:", error);
    res.status(500).json({ error: "Failed to fetch recipe" });
  }
});

// Create a new recipe
router.post("/", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const recipeData = req.body;
    
    // Validate recipe data
    const parseResult = insertRecipeSchema.safeParse({
      ...recipeData,
      userId
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: "Invalid recipe data", 
        details: parseResult.error.format() 
      });
    }
    
    // Insert the new recipe
    const [newRecipe] = await db
      .insert(recipes)
      .values(parseResult.data)
      .returning();
      
    res.status(201).json(newRecipe);
  } catch (error) {
    console.error("Error creating recipe:", error);
    res.status(500).json({ error: "Failed to create recipe" });
  }
});

// Update an existing recipe
router.put("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const recipeId = parseInt(req.params.id);
    const recipeData = req.body;
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    
    // Ensure the recipe exists and belongs to the user
    const [existingRecipe] = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, userId)
        )
      );
    
    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    // Update the recipe
    const [updatedRecipe] = await db
      .update(recipes)
      .set({
        ...recipeData,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, userId)
        )
      )
      .returning();
      
    res.json(updatedRecipe);
  } catch (error) {
    console.error("Error updating recipe:", error);
    res.status(500).json({ error: "Failed to update recipe" });
  }
});

// Delete a recipe
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.session.userId || 1; // Default to 1 for development
    const recipeId = parseInt(req.params.id);
    
    if (isNaN(recipeId)) {
      return res.status(400).json({ error: "Invalid recipe ID" });
    }
    
    // Make sure this recipe belongs to the user
    const [existingRecipe] = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, userId)
        )
      );
    
    if (!existingRecipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    
    // Delete the recipe
    await db
      .delete(recipes)
      .where(
        and(
          eq(recipes.id, recipeId),
          eq(recipes.userId, userId)
        )
      );
      
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting recipe:", error);
    res.status(500).json({ error: "Failed to delete recipe" });
  }
});

// Direct SQL import route to bypass ORM issues
router.post('/direct-import', async (req, res) => {
  try {
    const userId = req.session.userId || 1;
    const { recipes: recipesData } = req.body;
    
    if (!Array.isArray(recipesData) || recipesData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request format. Recipe data array is required.' 
      });
    }
    
    console.log(`DIRECT IMPORT: Received ${recipesData.length} recipes for import`);
    console.log('First few items:', JSON.stringify(recipesData.slice(0, 2)));
    
    // Import each recipe item directly using SQL to avoid ORM issues
    let successCount = 0;
    let errorCount = 0;
    
    // Use a single transaction for all inserts
    try {
      // Start transaction
      await db.execute('BEGIN');
      
      for (const recipe of recipesData) {
        try {
          // Ensure proper data types and defaults
          const name = (recipe.name || '').replace(/"/g, '');
          const category = (recipe.category || '').replace(/"/g, '');
          const description = (recipe.description || '').replace(/"/g, '');
          const servings = typeof recipe.servings === 'number' ? recipe.servings : (parseInt(recipe.servings) || 1);
          const total_cost = typeof recipe.total_cost === 'number' ? recipe.total_cost : (parseFloat(recipe.total_cost) || 0);
          
          console.log(`Inserting recipe: ${name}, Category: ${category}, Servings: ${servings}, Cost: ${total_cost}`);
          
          // More direct database connection to ensure it works
          await db.execute(`
            INSERT INTO recipes (
              user_id, name, category, description, servings, total_cost, created_at, updated_at
            ) VALUES (
              ${userId}, 
              '${name.replace(/'/g, "''")}', 
              '${category.replace(/'/g, "''")}', 
              '${description.replace(/'/g, "''")}',
              ${servings},
              ${total_cost},
              NOW(), NOW()
            )
          `);
          
          console.log(`Successfully inserted recipe: ${name}`);
          successCount++;
        } catch (err) {
          console.error(`DIRECT IMPORT: Failed to insert recipe:`, err);
          errorCount++;
        }
      }
      
      // Commit transaction
      await db.execute('COMMIT');
      
    } catch (txnError) {
      // Rollback on error
      await db.execute('ROLLBACK');
      throw txnError;
    }
    
    const result = {
      success: true,
      message: `Successfully imported ${successCount} recipes. ${errorCount > 0 ? `Failed to import ${errorCount} recipes.` : ''}`,
      data: { imported: successCount, failed: errorCount }
    };
    
    console.log("Import complete with result:", result);
    
    // Respond with a plain text message to avoid JSON parsing issues
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(result));
  } catch (error) {
    console.error('DIRECT IMPORT: Error importing recipes:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to import recipes: ${error instanceof Error ? error.message : String(error)}` 
    });
  }
});

export default router;