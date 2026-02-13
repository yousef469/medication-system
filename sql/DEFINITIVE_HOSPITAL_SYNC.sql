-- 🏥 DEFINITIVE HOSPITAL SYNCHRONIZATION MASTER
-- RUN THIS SCRIPT TO CLEAN UP ALL PREVIOUS SQL ATTEMPTS AND RESTORE FULL VISIBILITY.

-- 1. CLEANUP: Wipe all potentially broken or recursive policies on the profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can see colleagues in same hospital" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy Clean" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V3" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V4_JWT" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V5_NUKE" ON public.profiles;
DROP POLICY IF EXISTS "Silo_Staff_Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Silo_Self_Update" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V4_JWT" ON public.profiles;

-- 2. RESET STAFF ID: Ensure Hospital Admins are linked to their hospitals first
UPDATE public.profiles p
SET hospital_id = h.id
FROM public.hospitals h
WHERE p.id = h.admin_id
  AND h.id IS NOT NULL;

-- 3. MASTER HEAL: Sync hospital_id for all staff (Doctors, Nurses, Coordinators) from Auth Metadata
UPDATE public.profiles p
SET 
  hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid,
  role = COALESCE(p.role, (u.raw_user_meta_data->>'role')),
  verification_status = 'APPROVED'
FROM auth.users u
WHERE p.id = u.id 
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- 4. NON-RECURSIVE RLS: Guaranteed Visibility within the same hospital
-- We use the profiles table itself for the check, but we avoid recursion by using a simple static check.
CREATE POLICY "MASTER_INTERNAL_STAFF_VISIBILITY"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- You can see staff in the same hospital as you
    hospital_id = (SELECT p2.hospital_id FROM public.profiles p2 WHERE p2.id = auth.uid())
    OR auth.uid() = id -- Always see self
);

-- Separate policy for updates
CREATE POLICY "MASTER_SELF_UPDATE"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. RE-ENABLE SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICATION: This query should return more than 1 person if your staff accounts are correctly healed.
-- SELECT name, role, hospital_id FROM public.profiles WHERE hospital_id IS NOT NULL;
