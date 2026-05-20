const postgres = require('postgres');
async function main() {
  const sql = postgres('postgresql://contenly:contenly123@localhost:5434/contenly');
  
  // Check what's in the DB
  const users = await sql`SELECT id, email, role FROM "user" WHERE email = 'adminalip@gmail.com'`;
  console.log('User:', users[0]);
  
  const accts = await sql`SELECT id, provider_id, password FROM account WHERE user_id = ${users[0]?.id}`;
  console.log('Account provider:', accts[0]?.provider_id);
  console.log('Password hash (first 80):', accts[0]?.password?.substring(0, 80));
  console.log('Password hash length:', accts[0]?.password?.length);
  
  await sql.end();
}
main().catch(console.error);
