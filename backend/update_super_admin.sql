-- Add SUPER_ADMIN to user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'user_role' 
        AND e.enumlabel = 'SUPER_ADMIN'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'SUPER_ADMIN';
    END IF;
END $$;

-- Update user role to SUPER_ADMIN
UPDATE "user" 
SET role = 'SUPER_ADMIN' 
WHERE email = 'adminalip@gmail.com';

-- Show result
SELECT id, name, email, role, "createdAt"
FROM "user" 
WHERE email = 'adminalip@gmail.com';
