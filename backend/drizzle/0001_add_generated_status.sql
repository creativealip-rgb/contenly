-- Add 'GENERATED' status to article_status enum
-- PostgreSQL doesn't support ALTER TYPE ... ADD VALUE directly, so we need to:
-- 1. Create a new enum type with all values
-- 2. Update the column to use the new enum
-- 3. Drop the old enum type

-- Step 1: Create new enum type with GENERATED value
CREATE TYPE "article_status_new" AS ENUM('GENERATED', 'DRAFT', 'PUBLISHED', 'SCHEDULED');

-- Step 2: Update the column to use the new enum
ALTER TABLE "article" ALTER COLUMN "status" TYPE "article_status_new" USING ("status"::text::"article_status_new");

-- Step 3: Drop the old enum type
DROP TYPE "article_status";

-- Step 4: Rename the new enum type to the original name
ALTER TYPE "article_status_new" RENAME TO "article_status";
