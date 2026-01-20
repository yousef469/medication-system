-- Phase 25 Emergency: Fix Enum Missing Values

-- The 'request_status' enum is missing the 'EXECUTING_CARE' state needed for Nurse Assignment.
-- We must add it.

ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'EXECUTING_CARE';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'PENDING_NURSE';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'CANCELLED';

-- Grant permissions again just to be safe
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
