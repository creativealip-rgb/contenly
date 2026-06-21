ALTER TABLE instagram_project ADD COLUMN IF NOT EXISTS batch_progress_done integer DEFAULT 0;
ALTER TABLE instagram_project ADD COLUMN IF NOT EXISTS batch_progress_total integer DEFAULT 0;
