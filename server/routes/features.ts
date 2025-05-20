import { Router, Request, Response } from 'express';
import { db } from '../db';
import { featureSettings, insertFeatureSettingSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

interface AuthRequest extends Request {
  session: {
    userId: number;
    [key: string]: any;
  };
}

export const router = Router();

// Define the default feature list - this will be used if no custom settings are found
const defaultFeatures = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'orders', name: 'Orders & Quotes' },
  { id: 'contacts', name: 'Contacts' },
  { id: 'enquiries', name: 'Enquiries' },
  { id: 'tasks', name: 'Task List' },
  { id: 'calendar', name: 'Calendar' },
  { id: 'recipes', name: 'Recipes & Ingredients' },
  { id: 'products', name: 'Products' },
  { id: 'reports', name: 'Reports & Lists' },
  { id: 'expenses', name: 'Expenses & Mileage' },
  { id: 'tools', name: 'Tools' },
  { id: 'integrations', name: 'Integrations' },
  { id: 'settings', name: 'Settings' }
];

/**
 * Get all feature settings for the current user
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fallback for authentication during development
    const userId = req.session?.userId || 1;

    // Get user's feature settings from database
    const userFeatureSettings = await db
      .select()
      .from(featureSettings)
      .where(eq(featureSettings.userId, userId));

    // If the user has no feature settings yet, initialize with defaults
    if (userFeatureSettings.length === 0) {
      const featuresToInsert = defaultFeatures.map(feature => ({
        userId,
        featureId: feature.id,
        name: feature.name,
        enabled: true
      }));

      await db.insert(featureSettings).values(featuresToInsert);
      
      return res.json(defaultFeatures.map(feature => ({
        id: feature.id,
        name: feature.name,
        enabled: true
      })));
    }

    // Return the user's feature settings
    return res.json(userFeatureSettings.map(setting => ({
      id: setting.featureId,
      name: setting.name,
      enabled: setting.enabled
    })));
  } catch (error) {
    console.error('Error fetching feature settings:', error);
    return res.status(500).json({ error: 'Failed to fetch feature settings' });
  }
});

/**
 * Update a specific feature setting
 */
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Fallback for authentication during development
    const userId = req.session?.userId || 1;
    const featureId = req.params.id;

    // Validate request body
    const schema = z.object({
      enabled: z.boolean()
    });
    
    const { enabled } = schema.parse(req.body);

    // Check if the feature setting exists
    const existingFeature = await db
      .select()
      .from(featureSettings)
      .where(
        and(
          eq(featureSettings.userId, userId),
          eq(featureSettings.featureId, featureId)
        )
      )
      .limit(1);

    if (existingFeature.length === 0) {
      // If setting doesn't exist yet, find the default name
      const defaultFeature = defaultFeatures.find(f => f.id === featureId);
      
      if (!defaultFeature) {
        return res.status(404).json({ error: 'Feature not found' });
      }
      
      // Insert a new feature setting
      await db.insert(featureSettings).values({
        userId,
        featureId,
        name: defaultFeature.name,
        enabled
      });
    } else {
      // Update existing feature setting
      await db
        .update(featureSettings)
        .set({ 
          enabled,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(featureSettings.userId, userId),
            eq(featureSettings.featureId, featureId)
          )
        );
    }

    return res.json({ success: true, featureId, enabled });
  } catch (error) {
    console.error('Error updating feature setting:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors });
    }
    
    return res.status(500).json({ error: 'Failed to update feature setting' });
  }
});

// Reset all feature settings to defaults
router.post('/reset', async (req: AuthRequest, res: Response) => {
  try {
    // Fallback for authentication during development
    const userId = req.session?.userId || 1;

    // Delete all existing feature settings for this user
    await db
      .delete(featureSettings)
      .where(eq(featureSettings.userId, userId));

    // Insert default settings
    const featuresToInsert = defaultFeatures.map(feature => ({
      userId,
      featureId: feature.id,
      name: feature.name,
      enabled: true
    }));

    await db.insert(featureSettings).values(featuresToInsert);

    return res.json({ 
      success: true, 
      message: 'Feature settings reset to defaults',
      features: defaultFeatures.map(feature => ({
        id: feature.id,
        name: feature.name,
        enabled: true
      }))
    });
  } catch (error) {
    console.error('Error resetting feature settings:', error);
    return res.status(500).json({ error: 'Failed to reset feature settings' });
  }
});