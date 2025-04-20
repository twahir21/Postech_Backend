import { drizzle } from "drizzle-orm/neon-http"
import "dotenv/config";
import { neon } from '@neondatabase/serverless';


const connect = neon(process.env.DATABASE_URL!)

export const mainDb = drizzle(connect)