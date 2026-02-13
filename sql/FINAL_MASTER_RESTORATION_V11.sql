-- 🏥 FINAL MASTER RESTORATION (VERSION 11)
-- THIS IS THE DEFINITIVE FIX FOR STAFF VISIBILITY AND 500 ERRORS.

-- 1. CLEANUP: Disable RLS and clear ALL previous conflicting policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "STAFF_SILO_VISIBILITY_V10" ON public.profiles;
DROP POLICY IF EXISTS "JWT_BASED_STAFF_VISIBILITY" ON public.profiles;
DROP POLICY IF EXISTS "JWT_BASED_SELF_UPDATE" ON public.profiles;
DROP POLICY IF EXISTS "Silo_Staff_Visibility" ON public.profiles;
DROP POLICY IF EXISTS "MASTER_INTERNAL_STAFF_VISIBILITY" ON public.profiles;
DROP POLICY IF EXISTS "MASTER_SELF_UPDATE" ON public.profiles;

-- 2. THE SECRET WEAPON: Non-Recursive Security Definer Function
-- This function runs as a 'System Admin' (Bypassing RLS)
-- This is the ONLY 100% stable way to look up your own hospital_id.
CREATE OR REPLACE FUNCTION public.get_my_hospital_id_safe()
RETURNS uuid 
LANGUAGE sql 
STABLE 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT hospital_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. ALIGNMENT: Link Admin and fix any missing hospital_ids
UPDATE public.profiles p
SET 
    hospital_id = h.id,
    role = 'hospital_admin',
    verification_status = 'APPROVED'
FROM public.hospitals h
WHERE p.id = h.admin_id
  AND h.id IS NOT NULL;

-- 4. THE ULTIMATE POLICY: Guaranteed Visibility
-- This policy uses the safe function to prevent ANY and ALL recursion.
CREATE POLICY "TOTAL_HOSPITAL_VISIBILITY_SAFE"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- You can see people who have the same hospital_id as you
    hospital_id = public.get_my_hospital_id_safe()
    OR id = auth.uid()
);

CREATE POLICY "TOTAL_SELF_UPDATE_SAFE"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 5. RE-ENABLE SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICATION:
-- Check your silo contents:
-- SELECT name, role, hospital_id FROM public.profiles;
