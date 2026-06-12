CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL UNIQUE,
  "value" text,
  "encrypted" boolean DEFAULT false,
  "category" varchar(50) DEFAULT 'general',
  "description" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "content_template" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
  "name" varchar(100) NOT NULL,
  "description" text,
  "config" jsonb NOT NULL,
  "is_favorite" boolean DEFAULT false,
  "usage_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "video_clip_preset" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
  "name" varchar(100) NOT NULL,
  "description" text,
  "config" jsonb NOT NULL,
  "is_favorite" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_code" varchar(100);
ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_message" text;
ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_at" timestamp;
ALTER TABLE "wp_site" ADD COLUMN IF NOT EXISTS "last_error_operation" varchar(100);

ALTER TABLE "article" ADD COLUMN IF NOT EXISTS "versions" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "video_clip_projects" ADD COLUMN IF NOT EXISTS "thumbnail_path" text;
ALTER TABLE "video_clip_projects" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
ALTER TABLE "video_clip_projects" ADD COLUMN IF NOT EXISTS "waveform" jsonb;
ALTER TABLE "video_clip_projects" ADD COLUMN IF NOT EXISTS "broll_plan" jsonb DEFAULT '[]'::jsonb;
