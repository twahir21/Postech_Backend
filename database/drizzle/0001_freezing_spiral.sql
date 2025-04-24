ALTER TABLE "analytics" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "analytics" CASCADE;--> statement-breakpoint
ALTER TABLE "asked_products" RENAME COLUMN "requested_by" TO "quantity_requested";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_name_unique";--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_contact_unique";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_name_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "returns" DROP CONSTRAINT "returns_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "stock" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "min_stock" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "total_cost" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "returns" ALTER COLUMN "quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_customer_name_per_shop" ON "customers" USING btree ("name","shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_customer_contact_per_shop" ON "customers" USING btree ("contact","shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_product_shop" ON "products" USING btree ("name","shop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_username_per_shop" ON "shop_users" USING btree ("shop_id","user_id");