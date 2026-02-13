-- Fix for missing file_url column in appointment_requests
-- This column is required for AI triage that includes medical scan uploads

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='appointment_requests' AND column_name='file_url') THEN
        ALTER TABLE appointment_requests ADD COLUMN file_url TEXT;
    END IF;

    -- Also ensure ai_humanoid_markers exists as it's often used alongside file uploads
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='appointment_requests' AND column_name='ai_humanoid_markers') THEN
        ALTER TABLE appointment_requests ADD COLUMN ai_humanoid_markers JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
