import * as dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

const url = new URL(connectionString);

// Force SSL for Supabase connection (postgres-js defaults to non-SSL)
const queryClient = postgres({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: 'require',
});
export const db = drizzle(queryClient, { schema });

// Export schema for use in other modules
export { schema };
export type Database = typeof db;
