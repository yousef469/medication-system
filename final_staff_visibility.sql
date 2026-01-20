-- 🏥 FINAL STAFF VISIBILITY & DATA HEALING PATCH
-- This script uses the most robust method (JWT Metadata) to ensure staff can see each other.

-- 1. AGGRESSIVE HEALING: Sync EVERY account's hospital_id from metadata
-- This fixes any users created before the triggers were active.
UPDATE public.profiles p
SET 
  hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid,
  role = COALESCE(u.raw_user_meta_data->>'role', p.role),
  name = COALESCE(u.raw_user_meta_data->>'name', p.name),
  verification_status = 'APPROVED'
FROM auth.users u
WHERE p.id = u.id 
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- 2. STAFF VISIBILITY V4 (JWT-BASED)
-- We pull the hospital_id directly from the user's login token (JWT).
-- This is non-recursive, fast, and extremely reliable.

DROP POLICY IF EXISTS "Staff Visibility Policy Clean" ON public.profiles;
DROP POLICY IF EXISTS "Staff Visibility Policy V3" ON public.profiles;

CREATE POLICY "Staff Visibility Policy V4_JWT"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Check if the row's hospital_id matches the hospital_id in YOUR login token
  hospital_id = (auth.jwt() -> 'user_metadata' ->> 'hospital_id')::uuid
  
  -- Or if it's your own profile
  OR auth.uid() = id
  
  -- Or if you are a Hospital Admin for this specific hospital
  OR EXISTS (
    SELECT 1 FROM public.hospitals 
    WHERE hospitals.admin_id = auth.uid() 
      AND hospitals.id = public.profiles.hospital_id
  )
);

-- 3. VERIFICATION QUERY (Run this to see your currently linked staff)
-- This will tell you exactly who is in your "Silo"
-- SELECT name, role, hospital_id FROM public.profiles 
-- WHERE hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid());
