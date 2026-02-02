import postgres from 'postgres';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read DATABASE_URL from .env
const envContent = fs.readFileSync(join(__dirname, '.env'), 'utf-8');
const DATABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]
  ?.trim();

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env file');
  process.exit(1);
}

async function runMigration() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log('Running migration: Add GENERATED status to article_status enum');

    // Start a transaction
    await sql.begin(async sql => {
      // Step 1: Create new enum type with GENERATED value
      await sql`CREATE TYPE article_status_new AS ENUM('GENERATED', 'DRAFT', 'PUBLISHED', 'SCHEDULED')`;
      console.log('✓ Created new enum type article_status_new');

      // Step 2: Drop the default value from the column
      await sql`ALTER TABLE article ALTER COLUMN status DROP DEFAULT`;
      console.log('✓ Dropped default value from article.status column');

      // Step 3: Update the column to use the new enum
      await sql`ALTER TABLE article ALTER COLUMN status TYPE article_status_new USING (status::text::article_status_new)`;
      console.log('✓ Updated article.status column to use new enum');

      // Step 4: Drop the old enum type
      await sql`DROP TYPE article_status`;
      console.log('✓ Dropped old enum type article_status');

      // Step 5: Rename the new enum type to the original name
      await sql`ALTER TYPE article_status_new RENAME TO article_status`;
      console.log('✓ Renamed article_status_new to article_status');

      // Step 6: Restore the default value (now as GENERATED)
      await sql`ALTER TABLE article ALTER COLUMN status SET DEFAULT 'GENERATED'`;
      console.log('✓ Set default value of article.status to GENERATED');
    });

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
