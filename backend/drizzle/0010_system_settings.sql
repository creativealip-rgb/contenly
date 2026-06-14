CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "system_settings" ("key", "value")
VALUES
  ('model_text_generation', 'cx/gpt-5.5'),
  ('model_image_generation', 'chenzk/gpt-image-2')
ON CONFLICT ("key") DO NOTHING;
