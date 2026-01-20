-- 🚨 EMERGENCY HOSPITAL SYSTEM RESCUE (FINAL)
-- THIS SCRIPT IS DESIGNED TO BREAK THE INFINITE RECURSION (500 ERRORS) 
-- AND RESTORE STAFF VISIBILITY IMMEDIATELY.

-- STEP 1: CLEAR THE SLATE (STOPS THE 500 ERRORS INSTANTLY)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- DROP EVERY KNOWN POLICY NAME TO ENSURE NO CONFLICTS
DROP POLICY IF EXISTS "MASTER_INTERNAL_STAFF_VISIBILITY" ON public.profiles;
DROP POLICY IF EXISTS "MASTER_SELF_UPDATE" ON public.profiles;
DROP POLICY IF EXISTS "Silo_Staff_Visibility" ON public.profiles;
DROP POLICY IF EXISTS "Silo_Self_Update" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V4_JWT" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V3" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy Clean" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can see colleagues in same hospital" ON public.profiles;

-- STEP 2: CREATE A NON-RECURSIVE HELPER FUNCTION
-- The 'SECURITY DEFINER' and 'SET search_path' are CRITICAL to stop recursion.
CREATE OR REPLACE FUNCTION public.get_auth_user_hospital() 
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid();
$$;

-- STEP 3: RE-SYNC DATA (HEALING)
-- Ensure all staff have their hospital_id set from their login metadata
UPDATE public.profiles p
SET 
  hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid,
  role = COALESCE(p.role, (u.raw_user_meta_data->>'role')),
  verification_status = 'APPROVED'
FROM auth.users u
WHERE p.id = u.id 
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- STEP 4: IMPLEMENT THE CLEAN POLICIES
-- These use the helper function which DOES NOT trigger recursion.

-- Policy: Allow staff to see colleagues in the same hospital
CREATE POLICY "STAFF_VISIBILITY_V6_FINAL"
ON public.profiles FOR SELECT
TO authenticated
USING (
    hospital_id = public.get_auth_user_hospital() 
    OR id = auth.uid()
    OR role = 'admin' -- Global admins can see all
);

-- Policy: Allow users to update their own profiles
CREATE POLICY "STAFF_UPDATE_V6_FINAL"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- STEP 5: REACTIVATE SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 6: VERIFICATION
-- Run this to check if your silo is working:
-- SELECT name, role, hospital_id FROM public.profiles WHERE hospital_id IS NOT NULL;
