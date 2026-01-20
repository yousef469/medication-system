-- 🔍 DATA DIAGNOSTIC & CORRECTION MASTER
-- Run this script to find out WHY the staff are still missing.

-- 1. HEALING: Ensure EVERY authenticated user has a row in public.profiles
INSERT INTO public.profiles (id, name, role, hospital_id, verification_status)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'name', email), 
    COALESCE(raw_user_meta_data->>'role', 'user'),
    (raw_user_meta_data->>'hospital_id')::uuid,
    'APPROVED'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    hospital_id = EXCLUDED.hospital_id,
    role = EXCLUDED.role;

-- 2. DISABLE RLS TEMPORARILY: This is for testing.
-- If you run this and the chat works, then the problem is definitely RLS.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. DIAGNOSTIC QUERY: Run this and look at the "Results" tab in Supabase.
-- It tells you who is in your database and what hospital they belong to.
SELECT 
    p.id, 
    p.name, 
    p.role, 
    p.hospital_id,
    h.name as matched_hospital_name
FROM public.profiles p
LEFT JOIN public.hospitals h ON p.hospital_id = h.id;

-- 4. CLEANUP: Optional - Drop all old broken policies again
DROP POLICY IF EXISTS "JWT_BASED_STAFF_VISIBILITY" ON public.profiles;
DROP POLICY IF EXISTS "JWT_BASED_SELF_UPDATE" ON public.profiles;
DROP POLICY IF EXISTS "Silo_Staff_Visibility" ON public.profiles;
DROP POLICY IF EXISTS "MASTER_INTERNAL_STAFF_VISIBILITY" ON public.profiles;
