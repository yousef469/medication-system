-- Phase 25: Fix Nurse Visibility & RLS (Emergency Patch)

-- 1. Drop the restrictive "Nurse Access" policy
-- 1. Drop the restrictive "Nurse Access" policy
DROP POLICY IF EXISTS "Nurse Access" ON appointment_requests;

-- 2. Create comprehensive "Staff Access" policy
-- Allows staff to see ALL requests for their hospital, and Patients to see their own.
CREATE POLICY "Staff Access" ON appointment_requests
FOR ALL
USING (
    -- 1. User is the Patient (Access Own)
    (patient_id = auth.uid()) OR
    
    -- 2. User is Assigned Staff (Direct Access)
    (assigned_doctor_id = auth.uid()) OR 
    (assigned_nurse_id = auth.uid()) OR

    -- 3. User is Staff at the SAME Hospital (Hospital-Wide Visibility)
    -- This enables Nurses to see unassigned "Assistance Requests" and Coordinators to see Inflow
    (
        hospital_id = (
            SELECT hospital_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('secretary', 'doctor', 'nurse', 'hospital_admin')
        )
    )
);

-- 3. Grant basic permissions just in case
GRANT ALL ON appointment_requests TO authenticated;
