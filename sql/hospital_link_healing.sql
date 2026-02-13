-- 🏥 Hospital Admin & Staff Visibility Healing Patch
-- This script ensures admins are linked to their hospitals and visibility is restored for all staff.

-- 1. HEALING: Link Hospital Admins to their Hospital IDs in the profiles table
-- Many admins may have 'hospital_id' as NULL even if they own a hospital.
UPDATE public.profiles p
SET hospital_id = h.id
FROM public.hospitals h
WHERE p.id = h.admin_id
  AND (p.hospital_id IS NULL OR p.hospital_id <> h.id);

-- 2. HEALING: Ensure all users with raw_user_meta_data have their hospital_id mirrored
UPDATE public.profiles p
SET hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid
FROM auth.users u
WHERE p.id = u.id 
  AND p.hospital_id IS NULL 
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- 3. UPDATED POLICY: Staff Visibility (Non-Recursive)
-- This ensures that if you HAVE a hospital_id, you can see EVERYONE with that same hospital_id.
-- Also allows admins to manage their silo.

DROP POLICY IF EXISTS "Staff Visibility Policy Clean" ON public.profiles;

CREATE POLICY "Staff Visibility Policy V3"
ON public.profiles FOR SELECT
TO authenticated
USING (
  -- Clause 1: Same hospital visibility
  -- We use the safe function created in the previous patch
  hospital_id = public.get_user_hospital_safe()
  
  -- Clause 2: Own profile visibility
  OR auth.uid() = id
  
  -- Clause 3: Hospital Admins can see everyone in their hospital 
  -- (This is redundant if Clause 1 works, but adds a layer of safety)
  OR EXISTS (
    SELECT 1 FROM public.hospitals 
    WHERE hospitals.admin_id = auth.uid() 
      AND hospitals.id = public.profiles.hospital_id
  )
);

-- 4. VERIFICATION QUERY (Run this in SQL Editor to see counts)
-- SELECT role, count(*) FROM public.profiles WHERE hospital_id IS NOT NULL GROUP BY role;
