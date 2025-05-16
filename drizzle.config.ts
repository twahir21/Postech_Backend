import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './database/drizzle', // Where migrations will be generated
  schema: ['./database/schema/shop.ts'], // Your schema files
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.NODE_ENV === 'development'
        ? process.env.NEON_URL_DEV!
        : process.env.NEON_URL!,
  },
});