import 'dotenv/config';
import postgres from 'postgres';

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const client = postgres(connectionString);

  const migrations = [
    `ALTER TABLE instagram_project ADD COLUMN IF NOT EXISTS template_id VARCHAR(100)`,
    `ALTER TABLE instagram_slide ADD COLUMN IF NOT EXISTS gradient_colors VARCHAR(100)`,
    `ALTER TABLE script_scene ADD COLUMN IF NOT EXISTS emoji VARCHAR(10)`,
    `CREATE TABLE IF NOT EXISTS social_account (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        account_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        username VARCHAR(255),
        profile_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_social_account_user_id ON social_account(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_social_account_platform ON social_account(platform)`,
    `CREATE TABLE IF NOT EXISTS brand_kit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        primary_color VARCHAR(20) DEFAULT '#000000',
        secondary_color VARCHAR(20) DEFAULT '#ffffff',
        accent_color VARCHAR(20) DEFAULT '#ff0000',
        font_title VARCHAR(100) DEFAULT 'Inter',
        font_body VARCHAR(100) DEFAULT 'Inter',
        logo_url TEXT,
        website VARCHAR(255),
        description TEXT,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_brand_kit_user_id ON brand_kit(user_id)`,
    `CREATE TABLE IF NOT EXISTS scheduled_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        content_type VARCHAR(50) NOT NULL,
        content_id UUID,
        title VARCHAR(255) NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        published_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT now() NOT NULL,
        updated_at TIMESTAMP DEFAULT now() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_content_user_id ON scheduled_content(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_scheduled_content_scheduled_at ON scheduled_content(scheduled_at)`
  ];

  console.log('Running migrations...\n');

  for (const sql of migrations) {
    try {
      await client.unsafe(sql);
      console.log('✓', sql.substring(0, 60) + '...');
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        console.log('✓ (skipped - already exists)', sql.substring(0, 40) + '...');
      } else {
        console.log('✗ Error:', error.message?.substring(0, 100));
      }
    }
  }

  console.log('\n✅ Migration completed!');
  await client.end();
}

migrate().catch(console.error);
