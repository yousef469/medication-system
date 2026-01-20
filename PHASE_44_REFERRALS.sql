-- PHASE 44: Hospital Referral System
-- This table stores snapshots of patient diagnostic history and 3D anatomical states for specific hospital review.

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    hospital_id UUID REFERENCES hospitals(id),
    
    -- Clinical Snapshot: Contains the history, 3D mesh highlights, and AI reports at time of sending
    clinical_snapshot JSONB NOT NULL,
    
    status TEXT DEFAULT 'PENDING', -- PENDING, REVIEWED, ACCEPTED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by doctors at a specific hospital
CREATE INDEX idx_referrals_hospital ON referrals(hospital_id);
CREATE INDEX idx_referrals_patient ON referrals(patient_id);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Patients can view and create their own referrals
CREATE POLICY "Patients own referrals" ON referrals
    FOR ALL USING (auth.uid() = patient_id);

-- Doctors/Nurses at the target hospital can view the referral
-- (Assuming staff table links auth.uid to hospital_id)
-- CREATE POLICY "Hospital staff access" ON referrals
--    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM staff WHERE hospital_id = referrals.hospital_id));
