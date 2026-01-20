-- Phase 26: Medical Records & History Tracking
-- Adding explicit coordinator tracking for medical archives

ALTER TABLE appointment_requests 
ADD COLUMN IF NOT EXISTS handled_by_coordinator_id UUID REFERENCES auth.users(id);

-- Update RLS to ensure Hospital Admin can see completed cases
-- (Assuming they already can via hospital_id matching, but let's be explicit)

CREATE POLICY "Admins can view all completed cases for their hospital" 
ON appointment_requests FOR SELECT
USING (
  status = 'COMPLETED' 
  AND hospital_id IN (
    SELECT id FROM hospitals WHERE admin_id = auth.uid()
  )
);
