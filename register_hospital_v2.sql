-- 🏥 Hospital Registration Atomic RPC (V2)
-- This function ensures that creating a hospital and linking the admin happens in one transaction.

CREATE OR REPLACE FUNCTION public.register_hospital_v2(
    p_name TEXT,
    p_email_domain TEXT,
    p_license_url TEXT,
    p_contact_phone TEXT,
    p_address TEXT
)
RETURNS public.hospitals AS $$
DECLARE
    new_hosp public.hospitals;
    v_admin_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Ensure user is authenticated
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to register a facility.';
    END IF;

    -- 2. Create the Hospital Record
    INSERT INTO public.hospitals (
        name,
        email_domain,
        license_url,
        contact_phone,
        address,
        admin_id,
        status,
        registration_phase
    )
    VALUES (
        p_name,
        p_email_domain,
        p_license_url,
        p_contact_phone,
        p_address,
        v_admin_id,
        'PENDING_VERIFICATION',
        1
    )
    RETURNING * INTO new_hosp;

    -- 3. Update the Admin's Profile
    UPDATE public.profiles
    SET 
        hospital_id = new_hosp.id,
        role = 'hospital_admin',
        verification_status = 'APPROVED' -- Admins are approved by default for their own facility setup
    WHERE id = v_admin_id;

    -- 4. Set Hospital ID in auth.users metadata (for fallback)
    -- Note: This is done via a trigger in some setups, but we do it explicitly here via SQL if allowed,
    -- though usually it's easier from the client. However, since we are in PG, we can't easily update auth.users 
    -- unless we have specific permissions or functions. 
    -- We will rely on the profiles update which is the primary source of truth.

    RETURN new_hosp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.register_hospital_v2 TO authenticated;

-- Ensure status check allows 'PENDING_VERIFICATION'
ALTER TABLE public.hospitals DROP CONSTRAINT IF EXISTS hospitals_status_check;
ALTER TABLE public.hospitals ADD CONSTRAINT hospitals_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PENDING_VERIFICATION'));

-- Ensure registration_phase column exists (compatibility check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospitals' AND column_name='registration_phase') THEN
        ALTER TABLE public.hospitals ADD COLUMN registration_phase INTEGER DEFAULT 0;
    END IF;
END $$;
