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
