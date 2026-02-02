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

    // Get article details
    const articles = await sql`SELECT * FROM article WHERE id = ${articleId}`;

    if (articles.length === 0) {
      console.log('❌ Article not found');
      process.exit(1);
    }

    const article = articles[0];
    console.log('Article found:', article.title);
    console.log('Current status:', article.status);
    console.log('User ID:', article.user_id);

    // Update article status directly to PUBLISHED
    await sql`
      UPDATE article
      SET status = 'PUBLISHED',
        wp_post_id = 'test-post-123',
        wp_post_url = 'https://test-wordpress.com/post',
        published_at = ${new Date()},
        updated_at = ${new Date()}
      WHERE id = ${articleId}
    `;

    console.log('✅ Article updated to PUBLISHED successfully!');
    console.log('WordPress Post ID (mock): test-post-123');
    console.log('Post URL (mock): https://test-wordpress.com/post');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();
