ALTER TABLE "analytics" ALTER COLUMN "total_gross_profit" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "debt_payments" ALTER COLUMN "amount_paid" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "total_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "debts" ALTER COLUMN "remaining_amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price_sold" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "price_bought" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "total_cost" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "price_sold" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "total_sales" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "discount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "supplier_price_history" ALTER COLUMN "price" SET DATA TYPE integer;