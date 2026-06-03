-- Migration: Add brand_kit table
-- Date: 2026-03-02

CREATE TABLE IF NOT EXISTS brand_kit (
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
);

CREATE INDEX IF NOT EXISTS idx_brand_kit_user_id ON brand_kit(user_id);
