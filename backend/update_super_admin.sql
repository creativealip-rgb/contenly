-- Add super_admin to user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'user_role' 
        AND e.enumlabel = 'super_admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Update user role to super_admin
UPDATE "user" 
SET role = 'super_admin' 
WHERE email = 'adminalip@gmail.com';

-- Show result
SELECT id, name, email, role, "createdAt"
FROM "user" 
WHERE email = 'adminalip@gmail.com';
