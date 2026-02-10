
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function fix() {
    try {
        console.log('Creating enum type...');
        await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'view_boost_service_type') THEN
          CREATE TYPE "view_boost_service_type" AS ENUM ('standard', 'premium');
        END IF;
      END
      $$;
    `);

        console.log('Adding service_type column...');
        await db.execute(sql`
      ALTER TABLE view_boost_jobs 
      ADD COLUMN IF NOT EXISTS "service_type" "view_boost_service_type" DEFAULT 'standard';
    `);

        console.log('Database fixed successfully!');
    } catch (error) {
        console.error('Error fixing database:', error);
    } finally {
        await client.end();
    }
}

fix();
