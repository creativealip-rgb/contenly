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
    const articleId = '7d227a4a-7dfd-4f48-9939-c7bc8c87db0b';

    const articles = await sql`SELECT id, title, status FROM article WHERE id = ${articleId}`;

    if (articles.length === 0) {
      console.log('❌ Article not found');
      process.exit(1);
    }

    console.log('Article:', articles[0].title);
    console.log('Status:', articles[0].status);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
