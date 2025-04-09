ALTER TABLE "shop_users" ADD COLUMN "is_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "shops" DROP COLUMN "is_paid";