import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    shopName: text("shop_name").unique().notNull(),
    username: text("username").notNull(),
    email: text("email").unique().notNull(),
    password: text("password").notNull(),
});
