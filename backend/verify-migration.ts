import postgres from 'postgres';
import fs from 'fs';
import { join } from 'path';

const envContent = fs.readFileSync(join(process.cwd(), '.env'), 'utf-8');
const DATABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.trim();

const sql = postgres(DATABASE_URL);

(async () => {
  try {
    const result = await sql`SELECT unnest(enum_range(NULL::article_status))::text as status`;
    console.log('Article status enum values:', result);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
