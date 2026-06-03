const postgres = require('postgres');
async function main() {
  const sql = postgres('postgresql://contenly:contenly123@localhost:5434/contenly');
  await sql`DELETE FROM token_balance WHERE user_id = 'admin-alip-001'`;
  await sql`DELETE FROM account WHERE user_id = 'admin-alip-001'`;
  await sql`DELETE FROM "user" WHERE id = 'admin-alip-001'`;
  console.log('Cleaned up old user');
  await sql.end();
}
main();
