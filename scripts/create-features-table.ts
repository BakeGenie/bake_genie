import { db } from "../server/db";
import { featureSettings } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Create the feature_settings table and populate it with default features
 */
async function createFeaturesTable() {
  try {
    // Execute raw SQL to create the feature_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS feature_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        feature_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, feature_id)
      )
    `);
    
    console.log("✅ feature_settings table created successfully");
    
    // Insert default features for user with ID 1
    const defaultFeatures = [
      { featureId: "dashboard", name: "Dashboard", enabled: true },
      { featureId: "orders", name: "Orders & Quotes", enabled: true },
      { featureId: "contacts", name: "Contacts", enabled: true },
      { featureId: "enquiries", name: "Enquiries", enabled: true },
      { featureId: "tasks", name: "Tasks", enabled: true },
      { featureId: "calendar", name: "Calendar", enabled: true },
      { featureId: "recipes", name: "Recipes & Ingredients", enabled: true },
      { featureId: "products", name: "Products", enabled: true },
      { featureId: "reports", name: "Reports & Lists", enabled: true },
      { featureId: "expenses", name: "Business & Expenses", enabled: true },
      { featureId: "printables", name: "Printables", enabled: true },
      { featureId: "tax-rates", name: "Tax Rates", enabled: true },
      { featureId: "tools", name: "Tools", enabled: true },
      { featureId: "integrations", name: "Integrations", enabled: true },
      { featureId: "data", name: "Data Import/Export", enabled: true },
      { featureId: "settings", name: "Settings", enabled: true },
      { featureId: "account", name: "Account", enabled: true },
    ];
    
    // Insert default features for user ID 1
    for (const feature of defaultFeatures) {
      // Check if feature already exists for this user
      const existingFeature = await db.select().from(featureSettings)
        .where(sql`user_id = 1 AND feature_id = ${feature.featureId}`);
      
      if (existingFeature.length === 0) {
        await db.insert(featureSettings).values({
          userId: 1,
          featureId: feature.featureId,
          name: feature.name,
          enabled: feature.enabled
        });
        console.log(`✅ Added feature: ${feature.name}`);
      } else {
        console.log(`⏩ Feature already exists: ${feature.name}`);
      }
    }
    
    console.log("✅ Default features initialized successfully");
  } catch (error) {
    console.error("❌ Error creating feature_settings table:", error);
  } finally {
    process.exit(0);
  }
}

createFeaturesTable();