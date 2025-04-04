ALTER TABLE "supplier_price_history" DROP CONSTRAINT "supplier_price_history_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "supplier_price_history" ADD CONSTRAINT "supplier_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;