-- 🏥 FINAL ALIGNMENT: CONNECTING THE ADMIN TO THE HUB
-- Run this script to make the Hospital Admin visible to the entire staff!

-- 1. THE BRIDGING ACT: Connect every Admin Profile to the Hospital they own
-- This fills the "null" gap that kept the admin invisible.
UPDATE public.profiles p
SET 
  hospital_id = h.id,
  role = 'hospital_admin',
  verification_status = 'APPROVED'
FROM public.hospitals h
WHERE p.id = h.admin_id
  AND h.id IS NOT NULL;

-- 2. STAFF VISIBILITY (Standardize for everyone)
-- Ensure RLS is active and the master visibility rule is in place.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MASTER_INTERNAL_STAFF_VISIBILITY" ON public.profiles;

CREATE POLICY "STAFF_SILO_VISIBILITY_V10"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- Strategy: If you share the same hospital_id, you are visible.
    hospital_id = (SELECT p2.hospital_id FROM public.profiles p2 WHERE p2.id = auth.uid())
    OR id = auth.uid() -- Always see your own profile
);

-- 3. VERIFICATION:
-- After running this, both of these should return the SAME hospital_id for all staff:
-- SELECT name, role, hospital_id FROM public.profiles;
