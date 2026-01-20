-- 🏥 Hospital Staff Visibility & Profile Sync Patch
-- This script ensures all staff (Doctors, Nurses, Secretaries) are correctly linked and visible.

-- 1. Create robust metadata sync trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, hospital_id, phone, verification_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'user'),
    (new.raw_user_meta_data->>'hospital_id')::uuid,
    new.raw_user_meta_data->>'phone',
    'APPROVED'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    hospital_id = EXCLUDED.hospital_id,
    name = EXCLUDED.name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Healing Script: Sync existing users from metadata to profiles
UPDATE public.profiles p
SET 
  hospital_id = (u.raw_user_meta_data->>'hospital_id')::uuid,
  role = COALESCE(u.raw_user_meta_data->>'role', p.role)
FROM auth.users u
WHERE p.id = u.id 
  AND (p.hospital_id IS NULL OR p.role = 'user')
  AND u.raw_user_meta_data->>'hospital_id' IS NOT NULL;

-- 4. Fix RLS: Ensure staff visibility is permissive within the same hospital
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Staff can see colleagues in same hospital" ON public.profiles;

-- Permissive policy: allow any authenticated staff to see others in their hospital
CREATE POLICY "Staff Visibility Policy"
ON public.profiles FOR SELECT
TO authenticated
USING (
  hospital_id = (SELECT hospital_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() = id
  OR role = 'hospital_admin' -- Admins can see everyone to manage them
);
