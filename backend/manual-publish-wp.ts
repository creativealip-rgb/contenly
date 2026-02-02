import postgres from 'postgres';
import fs from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import axios from 'axios';

const envContent = fs.readFileSync(join(process.cwd(), '.env'), 'utf-8');
const DATABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.trim();

const ENCRYPTION_KEY = envContent
  .split('\n')
  .find(line => line.startsWith('ENCRYPTION_KEY='))
  ?.split('=')[1]
  ?.trim() || '78d49797c9ab0df1a6b4283a7c63ca53ae8c592857a035e716b16c825f52218f';

const sql = postgres(DATABASE_URL);

// Decrypt function matching WordPressService
function decryptPassword(encrypted: string): string {
  try {
    const [ivHex, encryptedHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY.substring(0, 32)),
      iv,
    );
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    return encrypted;
  }
}

async function publishToWordPress() {
  const articleId = '7d227a4a-7dfd-4f48-9939-c7bc8c87db0b';

  try {
    // Get article
    const articles = await sql`SELECT * FROM article WHERE id = ${articleId}`;

    if (articles.length === 0) {
      console.log('❌ Article not found');
      process.exit(1);
    }

    const article = articles[0];
    console.log('📝 Article:', article.title);
    console.log('📊 Current status:', article.status);

    if (article.status === 'PUBLISHED') {
      console.log('⚠️ Article already published!');
      process.exit(0);
    }

    // Get WordPress site
    const sites = await sql`SELECT * FROM wp_site WHERE user_id = ${article.user_id} LIMIT 1`;

    if (sites.length === 0) {
      console.log('❌ No WordPress site found for user');
      process.exit(1);
    }

    const site = sites[0];
    const appPassword = decryptPassword(site.app_password_encrypted);
    const auth = Buffer.from(`${site.username}:${appPassword}`).toString('base64');

    // Post to WordPress
    const postData = {
      title: article.title,
      content: article.generated_content,
      status: 'publish',
    };

    console.log('🚀 Publishing to WordPress...');

    const response = await axios.post(
      `${site.url}/wp-json/wp/v2/posts`,
      postData,
      {
        headers: { Authorization: `Basic ${auth}` },
        timeout: 30000,
      },
    );

    // Update article
    await sql`
      UPDATE article
      SET status = 'PUBLISHED',
        wp_post_id = ${String(response.data.id)},
        wp_post_url = ${response.data.link},
        published_at = ${new Date()},
        updated_at = ${new Date()}
      WHERE id = ${articleId}
    `;

    console.log('✅ SUCCESS! Article published to WordPress');
    console.log('📄 WordPress Post ID:', response.data.id);
    console.log('🔗 Post URL:', response.data.link);
    console.log('📊 Article status updated to PUBLISHED');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error publishing to WordPress:', error.message);
    if (error.response) {
      console.error('WordPress Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

publishToWordPress();
