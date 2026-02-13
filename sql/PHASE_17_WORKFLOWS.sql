-- 🏥 Phase 17: Profiles & Visibility Enhancements
-- This script enables profile editing for staff and allows patients to see hospital doctors.

-- 1. Allow patients to see doctors and staff linked to a hospital
-- This is needed for the patient "Explore" and "Discovery" features.
CREATE POLICY "PATIENT_VIEW_HOSPITAL_STAFF"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- If the profile has a hospital_id, it is publically visible to all authenticated users
    -- (Isolation is still maintained because patients only see clinical staff, not other patients)
    hospital_id IS NOT NULL
);

-- 2. Allow Doctors and Coordinators to update their own profiles
-- This enables the "Edit Profile" feature.
DROP POLICY IF EXISTS "TOTAL_SELF_UPDATE_SAFE" ON public.profiles;
CREATE POLICY "STAFF_SELF_UPDATE_V17"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Verify RLS is still enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. VERIFICATION:
-- Check if a patient can see staff (unrestricted by silo)
-- SELECT count(*) FROM public.profiles WHERE hospital_id IS NOT NULL;
