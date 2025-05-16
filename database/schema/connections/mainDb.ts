import { drizzle } from "drizzle-orm/neon-http"
import "dotenv/config";
import { neon } from '@neondatabase/serverless';

// LOAD CORRECT DB
const connect = process.env.NODE_ENV === 'development'
  ? neon(process.env.NEON_URL_DEV!)
  : neon(process.env.NEON_URL!);

export const mainDb = drizzle({ client: connect })