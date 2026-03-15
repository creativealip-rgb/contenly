const { auth } = require('../backend/dist/auth/auth.config');

async function createSuperAdmin() {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: 'Super Admin',
        email: 'admin@contenly.web.id',
        password: 'Admin123!@#',
      },
    });

    console.log('User created:', result);

    // Update role to SUPER_ADMIN via database
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { user } = require('../backend/dist/db/schema');
    const { eq } = require('drizzle-orm');
    const postgres = require('postgres');

    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);

    await db.update(user)
      .set({ role: 'SUPER_ADMIN' })
      .where(eq(user.email, 'admin@contenly.web.id'));

    console.log('Role updated to SUPER_ADMIN');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createSuperAdmin();
