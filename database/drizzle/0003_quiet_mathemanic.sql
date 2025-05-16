CREATE TABLE "payment_saas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"token_clickpesa" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asked_products" DROP CONSTRAINT "asked_products_shop_id_shops_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_saas" ADD CONSTRAINT "payment_saas_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asked_products" ADD CONSTRAINT "asked_products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;