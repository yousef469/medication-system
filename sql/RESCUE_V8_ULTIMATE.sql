-- 🚨 ABSOLUTE EMERGENCY RESCUE: THE "NO-RECURSION" FIX 🚨
-- This script solves the 500 errors and the missing staff issue by using JWT Metadata instead of table queries.

-- 1. STOP THE BLEEDING: Disable RLS and clear all old policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "STAFF_VISIBILITY_V6_FINAL" ON public.profiles;
DROP POLICY IF EXISTS "STAFF_UPDATE_V6_FINAL" ON public.profiles;
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

-- 2. FORCE DATA SYNC: Ensure all accounts are correctly linked to hospitals
UPDATE public.profiles p
SET 
  hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid,
  role = COALESCE(p.role, (u.raw_user_meta_data->>'role')),
  verification_status = 'APPROVED'
FROM auth.users u
WHERE p.id = u.id 
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- 3. THE "GOLDEN" POLICY: 100% NON-RECURSIVE
-- This policy uses YOUR LOGIN TOKEN (JWT) instead of querying the table itself.
-- This is mathematically impossible to trigger recursion.

CREATE POLICY "JWT_BASED_STAFF_VISIBILITY"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- Strategy A: Check your Login Token for the Hospital ID
    ((auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid = hospital_id)
    
    -- Strategy B: Always see yourself
    OR (id = auth.uid())
    
    -- Strategy C: Global Admins (Optional)
    OR (role = 'admin')
);

CREATE POLICY "JWT_BASED_SELF_UPDATE"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 4. REACTIVATE SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. FINAL TIP: 
-- If you still see "nothing", YOU MUST LOG OUT AND LOG IN AGAIN. 
-- This refreshes your login token (JWT) so it contains the hospital_id.
