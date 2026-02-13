-- 🚨 EMERGENCY STABILITY PATCH: RLS RECURSION FIX
-- This script resolves the 500 errors by fixing the infinite loop in staff visibility policies.

-- 1. Redefine the security function to ensure it explicitly bypasses RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_hospital_safe() 
RETURNS UUID AS $$
BEGIN
    -- This SELECT bypasses RLS because the function is SECURITY DEFINER
    RETURN (SELECT hospital_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Staff Visibility Policy" ON public.profiles;

-- 3. Implement the clean, non-recursive policy
-- Using the safe function prevents the RLS engine from calling itself
CREATE POLICY "Staff Visibility Policy Clean"
ON public.profiles FOR SELECT
TO authenticated
USING (
  hospital_id = public.get_user_hospital_safe() -- Uses the safe bypass function
  OR auth.uid() = id                            -- Always see your own profile
  OR role = 'hospital_admin'                    -- Admins have visibility for management
);

-- 4. Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
