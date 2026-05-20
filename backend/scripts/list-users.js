const postgres = require('postgres');
const sql = postgres('postgresql://contenly:contenly123@localhost:5434/contenly');
sql`SELECT id, name, email, role FROM "user" LIMIT 10`.then(r => {
  console.log(JSON.stringify(r, null, 2));
  sql.end();
});
