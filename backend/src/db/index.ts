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

// Use SSL only if the hostname suggests a cloud provider or if explicitly requested
const useSSL = url.hostname.includes('supabase') || url.hostname.includes('aiven') || process.env.DB_SSL === 'true';

const queryClient = postgres({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: useSSL ? 'require' : false,
});
export const db = drizzle(queryClient, { schema });

// Export schema for use in other modules
export { schema };
export type Database = typeof db;
