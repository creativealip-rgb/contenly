-- Migration: Add social_account table and new columns
-- Date: 2026-03-02

-- 1. Add template_id to instagram_project
ALTER TABLE instagram_project ADD COLUMN IF NOT EXISTS template_id VARCHAR(100);

-- 2. Add gradient_colors to instagram_slide  
ALTER TABLE instagram_slide ADD COLUMN IF NOT EXISTS gradient_colors VARCHAR(100);

-- 3. Add emoji to script_scene
ALTER TABLE script_scene ADD COLUMN IF NOT EXISTS emoji VARCHAR(10);

-- 4. Create social_account table
CREATE TABLE IF NOT EXISTS social_account (
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
);

-- 5. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_social_account_user_id ON social_account(user_id);
CREATE INDEX IF NOT EXISTS idx_social_account_platform ON social_account(platform);
