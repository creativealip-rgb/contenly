DO $$ BEGIN
  CREATE TYPE "render_job_status" AS ENUM ('queued', 'processing', 'completed', 'failed', 'timeout');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "render_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" varchar(50) NOT NULL,
  "status" "render_job_status" NOT NULL DEFAULT 'queued',
  "input" jsonb NOT NULL,
  "output_path" text,
  "output_format" varchar(10),
  "error" text,
  "progress" integer DEFAULT 0,
  "tokens_cost" integer DEFAULT 0,
  "started_at" timestamp,
  "completed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "render_jobs_user_id_idx" ON "render_jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "render_jobs_status_idx" ON "render_jobs" ("status");
