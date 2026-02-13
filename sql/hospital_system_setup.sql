-- 0. Ensure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0.1 Ensure all base enum types exist (Handling idempotency)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('doctor', 'secretary', 'it', 'admin', 'user', 'hospital_admin');
    ELSE
        BEGIN
            ALTER TYPE user_role ADD VALUE 'hospital_admin';
        EXCEPTION WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'doctor_status') THEN
        CREATE TYPE doctor_status AS ENUM ('Available', 'Busy', 'Vacation');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_tier') THEN
        CREATE TYPE urgency_tier AS ENUM ('IMMEDIATE', 'NEXT HOUR', 'SCHEDULED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('PENDING_SECRETARY', 'ROUTED_TO_DOCTOR', 'COMPLETED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'log_level') THEN
        CREATE TYPE log_level AS ENUM ('INFO', 'ERROR', 'WARN');
    END IF;
END $$;

-- 1. Create Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email_domain TEXT,
    license_url TEXT,
    contact_phone TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_id UUID REFERENCES auth.users(id),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update Profiles for Multi-Tenancy and Verification
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES hospitals(id),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'APPROVED' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
ADD COLUMN IF NOT EXISTS license_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Note: Patients default to 'APPROVED' as they don't need professional verification.
-- Professionals will be set to 'PENDING' upon signup.

-- 3. Update doctors_meta for Ranking and Stats
ALTER TABLE doctors_meta
ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio_long TEXT;

-- 4. Enable RLS on Hospitals
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

-- Policies for Hospitals
DROP POLICY IF EXISTS "Public hospitals are visible to all" ON hospitals;
CREATE POLICY "Public hospitals are visible to all" 
ON hospitals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to create hospitals" ON hospitals;
CREATE POLICY "Allow authenticated users to create hospitals"
ON hospitals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = admin_id);

DROP POLICY IF EXISTS "Only authorized system admins or hospital owners can update" ON hospitals;
CREATE POLICY "Only authorized system admins or hospital owners can update" 
ON hospitals FOR UPDATE 
USING (auth.uid() = admin_id);

-- 5. Helper Function to get users hospital (Security Definer to avoid recursion)
CREATE OR REPLACE FUNCTION get_user_hospital() 
RETURNS UUID AS $$
    SELECT hospital_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Update existing profiles policies for multi-tenancy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
CREATE POLICY "Users can create their own profile"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can see colleagues in same hospital" ON profiles;
CREATE POLICY "Staff can see colleagues in same hospital"
ON profiles FOR SELECT
USING (hospital_id = get_user_hospital() OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
