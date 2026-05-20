const postgres = require('postgres');

async function main() {
  const sql = postgres('postgresql://contenly:contenly123@localhost:5434/contenly');

  // Use Better Auth's exact hashing method
  const { scryptAsync } = require('@noble/hashes/scrypt');
  const { bytesToHex } = require('@noble/hashes/utils');
  
  // Better Auth config: N=16384, r=16, p=1, dkLen=64
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await scryptAsync('password123'.normalize('NFKC'), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  const hashedPassword = `${salt}:${bytesToHex(key)}`;

  console.log('Hash:', hashedPassword.substring(0, 50) + '...');

  // Check if user exists
  const existing = await sql`SELECT id FROM "user" WHERE email = 'adminalip@gmail.com'`;
  
  let userId;
  if (existing.length > 0) {
    userId = existing[0].id;
    await sql`UPDATE "user" SET role = 'super_admin' WHERE id = ${userId}`;
    const acct = await sql`SELECT id FROM account WHERE user_id = ${userId} AND provider_id = 'credential'`;
    if (acct.length > 0) {
      await sql`UPDATE account SET password = ${hashedPassword} WHERE id = ${acct[0].id}`;
    } else {
      await sql`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${userId + '-cred'}, ${userId}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())`;
    }
  } else {
    userId = 'admin-alip-' + Date.now();
    await sql`INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at) VALUES (${userId}, 'Admin Alip', 'adminalip@gmail.com', true, 'super_admin', NOW(), NOW())`;
    await sql`INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${userId + '-cred'}, ${userId}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())`;
  }

  await sql`INSERT INTO token_balance (user_id, balance, total_purchased) VALUES (${userId}, 100, 100) ON CONFLICT (user_id) DO UPDATE SET balance = 100`;

  console.log('✅ Done!');
  console.log('   Email: adminalip@gmail.com');
  console.log('   Password: password123');
  console.log('   Role: super_admin');
  await sql.end();
}

main().catch(console.error);
