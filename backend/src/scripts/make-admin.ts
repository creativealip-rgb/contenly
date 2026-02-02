import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

import postgres from 'postgres';

async function makeAdmin() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined');
    process.exit(1);
  }

  const url = new URL(connectionString);
  const email = process.argv[2] || 'adminalip@gmail.com';
  const tokens = parseInt(process.argv[3] || '100');

  console.log(`Making ${email} an admin with ${tokens} tokens...`);

  const useSSL =
    url.hostname.includes('supabase') ||
    url.hostname.includes('aiven') ||
    process.env.DB_SSL === 'true';

  const client = postgres({
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: useSSL ? 'require' : false,
    max: 1,
  });

  try {
    // Find user
    const users =
      await client`SELECT id, email, name, role FROM "user" WHERE email = ${email}`;

    if (users.length === 0) {
      console.error(`❌ User ${email} not found`);
      await client.end();
      process.exit(1);
    }

    const userId = users[0].id;
    const currentRole = users[0].role;
    console.log(`Found user: ${users[0].name} (${userId})`);
    console.log(`Current role: ${currentRole}`);

    // Update role to ADMIN
    await client`UPDATE "user" SET role = 'ADMIN' WHERE id = ${userId}`;
    console.log('✅ Role updated to ADMIN');

    // Check/create token balance
    const existingBalance =
      await client`SELECT balance FROM token_balance WHERE user_id = ${userId}`;
    if (existingBalance.length > 0) {
      await client`UPDATE token_balance SET balance = ${tokens}, total_purchased = ${tokens} WHERE user_id = ${userId}`;
      console.log(`✅ Token balance updated to ${tokens}`);
    } else {
      await client`INSERT INTO token_balance (user_id, balance, total_purchased) VALUES (${userId}, ${tokens}, ${tokens})`;
      console.log(`✅ Token balance created: ${tokens}`);
    }

    // Create transaction record
    const transactionId = crypto.randomUUID();
    await client`
            INSERT INTO transaction (id, user_id, type, amount, tokens, status, metadata, created_at)
            VALUES (${transactionId}, ${userId}, 'PURCHASE', 0, ${tokens}, 'COMPLETED', ${JSON.stringify({ source: 'admin_setup' })}, NOW())
        `;
    console.log('✅ Transaction record created');

    console.log('\n🎉 User is now an admin!');
    console.log(`  Email: ${email}`);
    console.log(`  Role: ADMIN`);
    console.log(`  Tokens: ${tokens}`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
    process.exit(1);
  }
}

makeAdmin();
