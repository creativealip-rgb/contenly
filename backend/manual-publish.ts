import postgres from 'postgres';
import fs from 'fs';
import { join } from 'path';
import axios from 'axios';
import * as crypto from 'crypto';

const envContent = fs.readFileSync(join(process.cwd(), '.env'), 'utf-8');
const DATABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.trim();

const sql = postgres(DATABASE_URL);

async function publishArticle() {
  const articleId = '7d227a4a-7dfd-4f48-9939-c7bc8c87db0b';

  try {
    // Get article details
    const articles = await sql`SELECT * FROM article WHERE id = ${articleId}`;

    if (articles.length === 0) {
      console.log('❌ Article not found');
      process.exit(1);
    }

    const article = articles[0];
    console.log('Article found:', article.title);
    console.log('Current status:', article.status);

    // Get WordPress site credentials
    const sites = await sql`SELECT * FROM wp_site WHERE user_id = ${article.user_id} LIMIT 1`;

    if (sites.length === 0) {
      console.log('❌ No WordPress site found');
      process.exit(1);
    }

    const site = sites[0];

    // Decrypt app password (simple base64 decode for now - should match backend)
    const appPassword = site.app_password_encrypted;

    const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

    // Publish to WordPress
    const postData = {
      title: article.title,
      content: article.generated_content,
      status: 'publish',
    };

    console.log('Publishing to WordPress...');
    const response = await axios.post(
      `${site.url}/wp-json/wp/v2/posts`,
      postData,
      {
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    // Update article status
    await sql`UPDATE article SET status = 'PUBLISHED', wp_post_id = ${String(response.data.id)}, wp_post_url = ${response.data.link}, published_at = ${new Date()} WHERE id = ${articleId}`;

    console.log('✅ Article published successfully!');
    console.log('WordPress Post ID:', response.data.id);
    console.log('Post URL:', response.data.link);
    console.log('Updated article status to PUBLISHED');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error publishing article:', error.message);
    if (error.response) {
      console.error('WordPress Response:', error.response.data);
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

publishArticle();
