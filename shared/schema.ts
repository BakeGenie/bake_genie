import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define event types
export const eventTypes = ['Birthday', 'Wedding', 'Corporate', 'Anniversary', 'Baby Shower', 'Gender Reveal', 'Other'] as const;
export type EventType = typeof eventTypes[number];

// Define order status types
export const orderStatusTypes = ['Draft', 'Confirmed', 'Paid', 'Ready', 'Delivered', 'Cancelled'] as const;
export type OrderStatus = typeof orderStatusTypes[number];

// Define quote status types
export const quoteStatusTypes = ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired', 'Cancelled'] as const;
export type QuoteStatus = typeof quoteStatusTypes[number];

// Define delivery types
export const deliveryTypes = ['Pickup', 'Delivery'] as const;
export type DeliveryType = typeof deliveryTypes[number];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  businessName: text("business_name"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts table
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderNumber: text("order_number").notNull(),
  contactId: integer("contact_id").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: date("event_date").notNull(),
  status: text("status").notNull().default("Draft"),
  theme: text("theme"),
  deliveryType: text("delivery_type").notNull(),
  deliveryDetails: text("delivery_details"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  discountType: text("discount_type").default("%"),
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  jobSheetNotes: text("job_sheet_notes"),
  imageUrls: text("image_urls").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  quoteNumber: text("quote_number").notNull(),
  contactId: integer("contact_id").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: date("event_date").notNull(),
  status: text("status").notNull().default("Draft"),
  theme: text("theme"),
  deliveryType: text("delivery_type").notNull(),
  deliveryDetails: text("delivery_details"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  discountType: text("discount_type").default("%"),
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  imageUrls: text("image_urls").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiryDate: date("expiry_date"),
});

// Quote Items table
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull(),
  productId: integer("product_id"),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  completed: boolean("completed").default(false),
  priority: text("priority").default("Medium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Order Logs table
export const orderLogs = pgTable("order_logs", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }).default("0"),
  laborRate: decimal("labor_rate", { precision: 10, scale: 2 }).default("0"),
  overhead: decimal("overhead", { precision: 10, scale: 2 }).default("0"),
  imageUrl: text("image_url"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipes table
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  servings: integer("servings").notNull(),
  instructions: text("instructions"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  prepTime: integer("prep_time"),
  cookTime: integer("cook_time"),
  imageUrl: text("image_url"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  packSize: decimal("pack_size", { precision: 10, scale: 2 }),
  packCost: decimal("pack_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Recipe Ingredients table
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  ingredientId: integer("ingredient_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  notes: text("notes"),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
  receiptUrl: text("receipt_url"),
  taxDeductible: boolean("tax_deductible").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Income table
export const income = pgTable("income", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enquiries table
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  eventType: text("event_type"),
  eventDate: date("event_date"),
  message: text("message").notNull(),
  status: text("status").default("New").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currency: text("currency").default("USD"),
  defaultTaxRate: decimal("default_tax_rate", { precision: 5, scale: 2 }).default("0"),
  businessHours: jsonb("business_hours"),
  invoiceFooter: text("invoice_footer"),
  quoteFooter: text("quote_footer"),
  orderNumberPrefix: text("order_number_prefix").default(""),
  quoteNumberPrefix: text("quote_number_prefix").default(""),
  laborRate: decimal("labor_rate", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contacts).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteItemSchema = createInsertSchema(quoteItems).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertOrderLogSchema = createInsertSchema(orderLogs).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true, createdAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertIncomeSchema = createInsertSchema(income).omit({ id: true, createdAt: true });
export const insertEnquirySchema = createInsertSchema(enquiries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });

// Define types using z.infer
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertOrderLog = z.infer<typeof insertOrderLogSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// Define select types
export type User = typeof users.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type OrderLog = typeof orderLogs.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Settings = typeof settings.$inferSelect;
