CREATE TABLE "bundle_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"business_name" text,
	"address" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"contact_id" integer,
	"date" date NOT NULL,
	"event_type" text NOT NULL,
	"event_date" date,
	"details" text NOT NULL,
	"status" text NOT NULL,
	"follow_up_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"receipt_url" text,
	"tax_deductible" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feature_id" text NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"unit_cost" numeric(10, 2),
	"pack_size" numeric(10, 2),
	"pack_cost" numeric(10, 2),
	"supplier" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"merchant_id" text,
	"location_id" text,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mileage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"start_location" text NOT NULL,
	"end_location" text NOT NULL,
	"purpose" text NOT NULL,
	"miles" numeric(10, 2) NOT NULL,
	"round_trip" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "order_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"order_number" text NOT NULL,
	"contact_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"event_date" date NOT NULL,
	"due_date" date,
	"status" text DEFAULT 'Draft' NOT NULL,
	"theme" text,
	"delivery_type" text NOT NULL,
	"delivery_details" text,
	"delivery_time" text,
	"discount" numeric(10, 2) DEFAULT '0',
	"discount_type" text DEFAULT '%',
	"setup_fee" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"job_sheet_notes" text,
	"image_urls" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"provider" text NOT NULL,
	"payment_id" text,
	"status" text NOT NULL,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_bundles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"servings" integer,
	"price" text NOT NULL,
	"cost" text,
	"tax_rate" text DEFAULT '0',
	"labor_hours" text DEFAULT '0',
	"labor_rate" text DEFAULT '0',
	"overhead" text DEFAULT '0',
	"image_url" text,
	"bundle_id" integer,
	"active" boolean DEFAULT true,
	"sku" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"product_id" integer,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"quote_number" text NOT NULL,
	"contact_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"event_date" date NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"theme" text,
	"delivery_type" text NOT NULL,
	"delivery_details" text,
	"delivery_time" text,
	"discount" numeric(10, 2) DEFAULT '0',
	"discount_type" text DEFAULT '%',
	"setup_fee" numeric(10, 2) DEFAULT '0',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"notes" text,
	"image_urls" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expiry_date" date
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"servings" integer NOT NULL,
	"instructions" text,
	"total_cost" numeric(10, 2),
	"prep_time" integer,
	"cook_time" integer,
	"image_url" text,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"sent_to" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"status" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"template_id" integer,
	"days_before" integer,
	"is_overdue" boolean DEFAULT false,
	"custom_subject" text,
	"custom_body" text,
	"is_enabled" boolean DEFAULT true,
	"last_sent" timestamp,
	"next_send" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"currency" text DEFAULT 'USD',
	"week_start_day" text DEFAULT 'Monday',
	"language_code" text DEFAULT 'en',
	"default_tax_rate" numeric(5, 2) DEFAULT '0',
	"tax_enabled" boolean DEFAULT true,
	"use_gst" boolean DEFAULT false,
	"use_tax_invoice" boolean DEFAULT false,
	"tax_terminology" text DEFAULT 'Tax',
	"tax_invoice_title" text DEFAULT 'Tax Invoice',
	"business_hours" jsonb,
	"email_address" text,
	"secondary_email_address" text,
	"receive_upcoming_orders" boolean DEFAULT false,
	"upcoming_orders_frequency" text DEFAULT 'weekly',
	"receive_payment_reminders" boolean DEFAULT false,
	"receive_marketing_emails" boolean DEFAULT false,
	"receive_product_updates" boolean DEFAULT false,
	"quote_email_template" text,
	"invoice_email_template" text,
	"payment_reminder_template" text,
	"payment_receipt_template" text,
	"enquiry_message_template" text,
	"business_name" text,
	"business_email" text,
	"business_phone" text,
	"business_address" text,
	"business_logo_url" text,
	"invoice_footer" text,
	"quote_footer" text,
	"order_number_prefix" text DEFAULT '',
	"quote_number_prefix" text DEFAULT '',
	"invoice_template" text DEFAULT 'default',
	"invoice_colors" jsonb,
	"next_order_number" integer DEFAULT 1,
	"labor_rate" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "supplies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"supplier" text,
	"category" text,
	"price" numeric(10, 2),
	"description" text,
	"quantity" integer DEFAULT 0,
	"reorder_level" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"related_order_id" integer,
	"title" text NOT NULL,
	"description" text,
	"due_date" date,
	"completed" boolean DEFAULT false,
	"priority" text DEFAULT 'Medium',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"business_name" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_history" ADD CONSTRAINT "reminder_history_schedule_id_reminder_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."reminder_schedules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_history" ADD CONSTRAINT "reminder_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_template_id_reminder_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."reminder_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_templates" ADD CONSTRAINT "reminder_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;