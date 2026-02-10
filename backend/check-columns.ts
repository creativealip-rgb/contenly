
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function check() {
    try {
        const result = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'view_boost_jobs';
    `);
        console.log('--- COLUMNS START ---');
        result.forEach(row => console.log(row.column_name));
        console.log('--- COLUMNS END ---');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

check();
