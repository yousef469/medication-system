-- Production Clinical Operations Patch

-- 1. Enhance Hospitals for Discovery
ALTER TABLE hospitals
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS specialty_tags TEXT[];

-- 2. Enhance Profiles for Clinical Context
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS specialty TEXT,
ADD COLUMN IF NOT EXISTS shift TEXT DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Night', 'Off')),
ADD COLUMN IF NOT EXISTS clinical_status doctor_status DEFAULT 'Available',
ADD COLUMN IF NOT EXISTS bio_story TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- 3. Create Appointment Requests (Clinical Triage)
CREATE TABLE IF NOT EXISTS appointment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID REFERENCES hospitals(id) NOT NULL,
    patient_id UUID REFERENCES auth.users(id),
    patient_name TEXT, -- Fallback for external
    service_requested TEXT NOT NULL,
    urgency urgency_tier DEFAULT 'SCHEDULED',
    status request_status DEFAULT 'PENDING_SECRETARY',
    assigned_doctor_id UUID REFERENCES profiles(id),
    coordinator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RLS for Appointment Requests
ALTER TABLE appointment_requests ENABLE ROW LEVEL SECURITY;

-- Patients can see their own requests
CREATE POLICY "Patients view own requests" ON appointment_requests
    FOR SELECT USING (auth.uid() = patient_id);

-- Staff can see requests in their hospital
CREATE POLICY "Staff view hospital requests" ON appointment_requests
    FOR SELECT USING (hospital_id = get_user_hospital());

-- Coordinators/Admins can insert/update requests in their hospital
CREATE POLICY "Staff manage hospital requests" ON appointment_requests
    FOR ALL USING (hospital_id = get_user_hospital());

-- 5. Helper View for Discovery (Publicly accessible)
CREATE OR REPLACE VIEW public_hospital_discovery AS
SELECT id, name, specialty_tags, logo_url, cover_image_url, description, address
FROM hospitals
WHERE status = 'APPROVED';
