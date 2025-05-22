import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { type InferSelectModel, relations } from "drizzle-orm";

// Define event types
export const eventTypes = ['Birthday', 'Wedding', 'Anniversary', 'Baby Shower', 'Christening / Baptism', 'Hen/Bux/Stag', 'Corporate', 'Other'] as const;
export type EventType = typeof eventTypes[number];

// Define event type colors for calendar display
export const eventTypeColors: Record<EventType, string> = {
  'Birthday': '#FF5252', // red
  'Wedding': '#4CAF50', // green
  'Anniversary': '#FFAB91', // peach
  'Baby Shower': '#FFF176', // yellow
  'Christening / Baptism': '#81D4FA', // light blue
  'Hen/Bux/Stag': '#9C27B0', // purple
  'Corporate': '#9E9E9E', // grey
  'Other': '#607D8B', // blue grey
};

// Define order status types
export const orderStatusTypes = ['Quote', 'Confirmed', 'Paid', 'Ready', 'Delivered', 'Cancelled'] as const;
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
  businessName: text("business_name"),
  address: text("address"),
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
  dueDate: date("due_date"), // Payment due date for invoice reminders
  status: text("status").notNull().default("Draft"),
  theme: text("theme"),
  deliveryType: text("delivery_type").notNull(),
  deliveryDetails: text("delivery_details"),
  deliveryTime: text("delivery_time"),
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
  deliveryTime: text("delivery_time"),
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
  relatedOrderId: integer("related_order_id"),
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
  price: text("price").notNull(),
  cost: text("cost"),
  taxRate: text("tax_rate").default("0"),
  laborHours: text("labor_hours").default("0"),
  laborRate: text("labor_rate").default("0"),
  overhead: text("overhead").default("0"),
  imageUrl: text("image_url"),
  bundleId: integer("bundle_id"),
  active: boolean("active").default(true),
  sku: text("sku"),
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
  supplier: text("supplier"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Supplies table
export const supplies = pgTable("supplies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  supplier: text("supplier"),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }),
  description: text("description"),
  quantity: integer("quantity").default(0),
  reorder_level: integer("reorder_level").default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Recipe Ingredients table
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  ingredientId: integer("ingredient_id").notNull(),
  quantity: text("quantity").notNull(),
  unit: text("unit").notNull(), 
  cost: text("cost").notNull(),
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

// Mileage table
export const mileage = pgTable("mileage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  startLocation: text("start_location").notNull(),
  endLocation: text("end_location").notNull(),
  purpose: text("purpose").notNull(),
  miles: decimal("miles", { precision: 10, scale: 2 }).notNull(),
  round_trip: boolean("round_trip").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enquiries table
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contactId: integer("contact_id").references(() => contacts.id),
  date: date("date").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: date("event_date"),
  details: text("details").notNull(),
  status: text("status").notNull(),
  followUpDate: date("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  currency: text("currency").default("USD"),
  weekStartDay: text("week_start_day").default("Monday"),
  languageCode: text("language_code").default("en"),
  defaultTaxRate: decimal("default_tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxEnabled: boolean("tax_enabled").default(true),
  useGst: boolean("use_gst").default(false), // Use GST instead of VAT terminology
  useTaxInvoice: boolean("use_tax_invoice").default(false), // Use "Tax Invoice" as title instead of "Invoice"
  taxTerminology: text("tax_terminology").default("Tax"),
  taxInvoiceTitle: text("tax_invoice_title").default("Tax Invoice"),
  businessHours: jsonb("business_hours"),
  // Email notification settings
  emailAddress: text("email_address"),
  secondaryEmailAddress: text("secondary_email_address"),
  receiveUpcomingOrders: boolean("receive_upcoming_orders").default(false),
  upcomingOrdersFrequency: text("upcoming_orders_frequency").default("weekly"), // daily, weekly, monthly
  receivePaymentReminders: boolean("receive_payment_reminders").default(false),
  receiveMarketingEmails: boolean("receive_marketing_emails").default(false),
  receiveProductUpdates: boolean("receive_product_updates").default(false),
  // Email templates
  quoteEmailTemplate: text("quote_email_template"),
  invoiceEmailTemplate: text("invoice_email_template"),
  paymentReminderTemplate: text("payment_reminder_template"),
  paymentReceiptTemplate: text("payment_receipt_template"),
  enquiryMessageTemplate: text("enquiry_message_template"),
  // Business details for invoices
  businessName: text("business_name"),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessAddress: text("business_address"),
  businessLogoUrl: text("business_logo_url"),
  // Footer text for invoices and quotes
  invoiceFooter: text("invoice_footer"),
  quoteFooter: text("quote_footer"),
  // Number prefixes
  orderNumberPrefix: text("order_number_prefix").default(""),
  quoteNumberPrefix: text("quote_number_prefix").default(""),
  // Invoice template settings
  invoiceTemplate: text("invoice_template").default("default"),
  invoiceColors: jsonb("invoice_colors"),
  // Order settings
  nextOrderNumber: integer("next_order_number").default(1),
  // Labor settings
  laborRate: decimal("labor_rate", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tax Rates table
export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(), // e.g., "Standard Rate", "Reduced Rate"
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  active: boolean("active").default(true),
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
export const insertSupplySchema = createInsertSchema(supplies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertIncomeSchema = createInsertSchema(income).omit({ id: true, createdAt: true });
export const insertMileageSchema = createInsertSchema(mileage).omit({ id: true, createdAt: true });
export const insertEnquirySchema = createInsertSchema(enquiries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaxRateSchema = createInsertSchema(taxRates).omit({ id: true, createdAt: true, updatedAt: true });

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
export type InsertSupply = z.infer<typeof insertSupplySchema>;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;
export type InsertMileage = z.infer<typeof insertMileageSchema>;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;

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
export type Supply = typeof supplies.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Income = typeof income.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
// Feature settings table
export const featureSettings = pgTable("feature_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  featureId: text("feature_id").notNull(),
  name: text("name").notNull(),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeatureSettingSchema = createInsertSchema(featureSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFeatureSetting = z.infer<typeof insertFeatureSettingSchema>;
export type FeatureSetting = typeof featureSettings.$inferSelect;

export type Settings = typeof settings.$inferSelect;
export type TaxRate = typeof taxRates.$inferSelect;

// Add integrations table
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // 'square', 'stripe', etc.
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  merchantId: text("merchant_id"),
  locationId: text("location_id"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  provider: text("provider").notNull(), // 'square', 'stripe', 'manual', etc.
  paymentId: text("payment_id"), // External payment ID
  status: text("status").notNull(), // 'pending', 'completed', 'failed', 'refunded'
  paymentMethod: text("payment_method"), // 'card', 'cash', 'bank_transfer', etc.
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Bundles table
export const productBundles = pgTable("product_bundles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bundle Items table - links products to bundles
export const bundleItems = pgTable("bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id").notNull().references(() => productBundles.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1).notNull(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProductBundleSchema = createInsertSchema(productBundles).omit({ id: true, createdAt: true });
export const insertBundleItemSchema = createInsertSchema(bundleItems).omit({ id: true });

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type InsertProductBundle = z.infer<typeof insertProductBundleSchema>;
export type InsertBundleItem = z.infer<typeof insertBundleItemSchema>;

// Payment Reminder Templates
export const reminderTemplates = pgTable("reminder_templates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment Reminder Schedules
export const reminderSchedules = pgTable("reminder_schedules", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  userId: integer("user_id").notNull().references(() => users.id),
  templateId: integer("template_id").references(() => reminderTemplates.id),
  daysBefore: integer("days_before"), // Days before due date (null for "overdue")
  isOverdue: boolean("is_overdue").default(false), // True for overdue reminders
  customSubject: text("custom_subject"), // Optional custom subject, otherwise use template
  customBody: text("custom_body"), // Optional custom body, otherwise use template
  isEnabled: boolean("is_enabled").default(true),
  lastSent: timestamp("last_sent"),
  nextSend: timestamp("next_send"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment Reminder History - track when reminders were sent
export const reminderHistory = pgTable("reminder_history", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => reminderSchedules.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  sentTo: text("sent_to").notNull(), // Email address
  subject: text("subject").notNull(), 
  body: text("body").notNull(),
  status: text("status").notNull(), // 'sent', 'failed', etc.
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

// Define table relations
export const productBundlesRelations = relations(productBundles, ({ many }) => ({
  items: many(bundleItems)
}));

export const bundleItemsRelations = relations(bundleItems, ({ one }) => ({
  bundle: one(productBundles, {
    fields: [bundleItems.bundleId],
    references: [productBundles.id]
  }),
  product: one(products, {
    fields: [bundleItems.productId],
    references: [products.id]
  })
}));

export const productsRelations = relations(products, ({ one }) => ({
  bundle: one(productBundles, {
    fields: [products.bundleId],
    references: [productBundles.id],
    relationName: "productBundle"
  })
}));

export const insertReminderTemplateSchema = createInsertSchema(reminderTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderScheduleSchema = createInsertSchema(reminderSchedules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReminderHistorySchema = createInsertSchema(reminderHistory).omit({ id: true });

export type InsertReminderTemplate = z.infer<typeof insertReminderTemplateSchema>;
export type InsertReminderSchedule = z.infer<typeof insertReminderScheduleSchema>;
export type InsertReminderHistory = z.infer<typeof insertReminderHistorySchema>;

export type Integration = typeof integrations.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type ProductBundle = typeof productBundles.$inferSelect;
export type BundleItem = typeof bundleItems.$inferSelect;
export type ReminderTemplate = typeof reminderTemplates.$inferSelect;
export type ReminderSchedule = typeof reminderSchedules.$inferSelect;
export type ReminderHistory = typeof reminderHistory.$inferSelect;
