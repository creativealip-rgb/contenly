import * as dotenv from 'dotenv';
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { verification } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const url = new URL(connectionString);

  const client = postgres({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: 'require',
  });

  const db = drizzle(client);

  try {
    console.log('Fetching latest verification token...');
    const result = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, 'success.user@example.com'))
      .orderBy(desc(verification.createdAt))
      .limit(1);

    if (result.length > 0) {
      console.log('Token:', result[0].value);
      console.log('Expires At:', result[0].expiresAt);
    } else {
      console.log('No token found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  await client.end();
  process.exit(0);
}

main();
