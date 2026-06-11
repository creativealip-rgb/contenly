ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_code" varchar(100);
ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_message" text;
ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_at" timestamp;
ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_operation" varchar(100);
