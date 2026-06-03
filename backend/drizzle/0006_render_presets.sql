CREATE TABLE IF NOT EXISTS "render_presets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "template_id" varchar(100) NOT NULL,
  "name" varchar(255) NOT NULL,
  "props" jsonb NOT NULL,
  "format" varchar(10) DEFAULT 'mp4',
  "created_at" timestamp NOT NULL DEFAULT now()
);
