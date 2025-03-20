import { pgTable, text, uuid, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    email: text("email").unique().notNull(),
    password: text("password").notNull(),
    shopName: text("shop_name").unique().notNull(),
}, (table) => ({
    emailIndex: index("idx_email").on(table.email), // Adding index for email to improve search user by email optimization.
}));
