-- Phase 21: Clinical Role Architecture (AT-Control / Brain / Execution)

-- 1. Enhance Appointment Requests for Clinical Workflow
ALTER TABLE appointment_requests
ADD COLUMN IF NOT EXISTS assigned_nurse_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS nurse_instructions TEXT,
ADD COLUMN IF NOT EXISTS vitals_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS medication_schedule JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS diagnosis TEXT,
ADD COLUMN IF NOT EXISTS prescription TEXT,
ADD COLUMN IF NOT EXISTS clinical_notes TEXT,
ADD COLUMN IF NOT EXISTS discharge_summary TEXT;

-- 2. Enhance Profiles with Departmental context
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS clinical_department TEXT DEFAULT 'General Medicine',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- 3. Update Request Statuses (Handled via Enum or TEXT check in app)
-- Possible statuses: PENDING_SECRETARY, ROUTED_TO_DOCTOR, PENDING_NURSE, EXECUTING_CARE, COMPLETED

-- 4. RLS for Nurse Assignments
-- Nurses can see requests assigned to them or their hospital
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Nurse Access' AND tablename = 'appointment_requests') THEN
        CREATE POLICY "Nurse Access" ON appointment_requests
        FOR ALL
        USING (
            auth.uid() = assigned_nurse_id OR 
            (SELECT role FROM profiles WHERE id = auth.uid()) IN ('secretary', 'doctor', 'hospital_admin')
        );
    END IF;
END $$;

-- 5. Enable Real-time for status updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'appointment_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE appointment_requests;
    END IF;
END $$;
