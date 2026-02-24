import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function testConnection() {
    try {
        console.log('Testing database connection...');
        const result = await db.execute(sql`SELECT 1`);
        console.log('✅ Connection successful!', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:');
        console.error(error);
        process.exit(1);
    }
}

testConnection();
