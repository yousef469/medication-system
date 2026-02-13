-- Phase 23: Stability & Role Alignment

-- 1. Add 'nurse' to user_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'user_role'::regtype 
        AND enumlabel = 'nurse'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'nurse';
    END IF;
END $$;

-- 2. Ensure hospital_invites table is correctly registered for real-time (Optional but recommended)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hospital_invites'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hospital_invites;
    END IF;
END $$;
