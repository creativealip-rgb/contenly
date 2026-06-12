ALTER TABLE "instagram_project" ADD COLUMN IF NOT EXISTS "batch_job_id" varchar(100);
ALTER TABLE "instagram_project" ADD COLUMN IF NOT EXISTS "batch_status" varchar(50) DEFAULT 'idle';
ALTER TABLE "instagram_slide" ADD COLUMN IF NOT EXISTS "gradient_colors" varchar(100);
