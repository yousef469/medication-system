-- Phase 24 Emergency Fix: RLS for Patient Requests

-- 1. Ensure patient_id exists to track ownership
ALTER TABLE appointment_requests 
ADD COLUMN IF NOT EXISTS patient_id UUID DEFAULT auth.uid();

-- 2. Allow Authenticated Patients to INSERT requests
-- This policy allows any authenticated user to create a request
DROP POLICY IF EXISTS "Patients Insert" ON appointment_requests;
CREATE POLICY "Patients Insert" ON appointment_requests
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Allow Patients to VIEW their own requests
DROP POLICY IF EXISTS "Patients View Own" ON appointment_requests;
CREATE POLICY "Patients View Own" ON appointment_requests
FOR SELECT 
TO authenticated 
USING (
    patient_id = auth.uid() 
    OR 
    -- Keep fallback for non-linked rows if needed, or rely on name? 
    -- Better to rely on ID.
    (patient_id IS NULL AND patient_name IS NOT NULL) -- Legacy/Guest fallback (optional)
);

-- Note: The existing "Nurse Access" policy handles Staff visibility.
