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

    // Check current status
    const article = await sql`SELECT id, status, wp_post_id FROM article WHERE id = ${articleId}`;

    if (article.length === 0) {
      console.log('❌ Article not found:', articleId);
      process.exit(1);
    }

    console.log('Current article status:', article[0].status);
    console.log('WordPress Post ID:', article[0].wp_post_id);

    // If status is DRAFT and has no WordPress post ID, update to GENERATED
    if (article[0].status === 'DRAFT' && !article[0].wp_post_id) {
      await sql`UPDATE article SET status = 'GENERATED' WHERE id = ${articleId}`;
      console.log('✅ Updated article status to GENERATED');
    } else if (article[0].status === 'DRAFT') {
      console.log('ℹ️ Article has DRAFT status but already has WordPress post ID - keeping as DRAFT');
    } else {
      console.log('ℹ️ Article already has status:', article[0].status);
    }

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
