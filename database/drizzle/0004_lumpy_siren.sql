ALTER TABLE "suppliers" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX "idx_purchases_product_shop" ON "purchases" USING btree ("product_id","shop_id");--> statement-breakpoint
CREATE INDEX "idx_sales_product_shop" ON "sales" USING btree ("product_id","shop_id");