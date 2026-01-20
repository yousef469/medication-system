-- Phase 29: Patient Diagnosis Vault & Persistent Anatomy
-- Allows patients to upload reports/scans independent of physician requests

CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    title TEXT DEFAULT 'Untitled Report',
    ai_conclusion TEXT,
    ai_markers JSONB DEFAULT '[]'::jsonb,
    ai_raw_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE patient_diagnoses ENABLE ROW LEVEL SECURITY;

-- Policies: Patients can see/edit their own vault
CREATE POLICY "Patients can view own diagnoses"
    ON patient_diagnoses FOR SELECT
    USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert own diagnoses"
    ON patient_diagnoses FOR INSERT
    WITH CHECK (auth.uid() = patient_id);

-- Nurses and Doctors can see a patient's vault if there's an active request (Optional enhancement)
-- For now, keep it personal as per user request ("my diagnoses history")
