import { pgTable, uuid, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(), 
  name: text("name").notNull(),
  company: text("company").notNull(),
  type: text("type").notNull(),
  priceBought: numeric("price_bought", { precision: 10, scale: 2 }).notNull(),
  priceSell: numeric("price_sell", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  qrCode: text("qr_code").unique()
});
