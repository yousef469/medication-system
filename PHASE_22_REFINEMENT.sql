-- Phase 22: Clinical Flow Refinement & Direct Assistance

-- 1. Add Support for Doctor-to-Nurse Assistance Requests
ALTER TABLE appointment_requests
ADD COLUMN IF NOT EXISTS nurse_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nurse_request_note TEXT,
ADD COLUMN IF NOT EXISTS preferred_doctor_id UUID REFERENCES auth.users(id);

-- 2. Index for efficient coordinator triage
CREATE INDEX IF NOT EXISTS idx_requests_nurse_requested ON appointment_requests(nurse_requested) WHERE nurse_requested = true;
