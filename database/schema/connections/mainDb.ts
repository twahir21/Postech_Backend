import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config"

const connect = postgres(process.env.DATABASE_URL!)

export const mainDb = drizzle(connect)