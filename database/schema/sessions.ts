import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at").notNull()
});
