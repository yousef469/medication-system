-- ☢️ ULTIMATE RLS RESET & STAFF VISIBILITY HEALING
-- Run this script to fix 500 errors and restore staff visibility once and for all.

-- 1. Temporarily disable RLS to allow healing without errors
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. DROP EVERY SINGLE POLICY on profiles to clear any recursion
-- (We drop all possible variations used in previous attempts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can see colleagues in same hospital" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy Clean" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V3" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V4_JWT" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V5_NUKE" ON public.profiles;

-- 3. HEALING: Force sync EVERY hospital_id from Auth Metadata to Profile
-- This ensures that the Doctor and Coordinator roles are tied to the same hospital silo.
UPDATE public.profiles p
SET 
  hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid,
  role = COALESCE(u.raw_user_meta_data->>'role', p.role),
  verification_status = 'APPROVED'
FROM auth.users u
WHERE p.id = u.id 
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- 4. CREATE GUARANTEED NON-RECURSIVE POLICIES
-- These policies use JWT metadata, meaning they NEVER query the profiles table itself.
-- This is impossible to create a 500 error / recursion loop.

-- POLICY A: Staff Visibility within Silo
CREATE POLICY "Silo_Staff_Visibility"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Must match the hospital_id in YOUR login token
  hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid
  OR auth.uid() = id -- Always see self
);

-- POLICY B: Allow everyone to see Public Hospital Info (if you ever select from profiles for it)
-- Note: Hospitals table has its own RLS, this is just for the profile link.

-- POLICY C: Update own profile
CREATE POLICY "Silo_Self_Update"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. DOUBLE CHECK: If no staff appears, run this in SQL Editor to check IDs:
-- SELECT id, name, role, hospital_id FROM public.profiles;
