-- PHASE 45: Comprehensive Database Schema Sync
-- This script ensures ALL columns used by the Referral & Clinical system exist.

ALTER TABLE appointment_requests 
ADD COLUMN IF NOT EXISTS voice_url TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS clinical_snapshot JSONB,
ADD COLUMN IF NOT EXISTS is_referral BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS ai_conclusion TEXT,
ADD COLUMN IF NOT EXISTS ai_humanoid_markers JSONB,
ADD COLUMN IF NOT EXISTS manual_highlights JSONB,
ADD COLUMN IF NOT EXISTS vitals_data JSONB,
ADD COLUMN IF NOT EXISTS nurse_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nurse_request_note TEXT;

-- Update existing records
UPDATE appointment_requests SET is_referral = FALSE WHERE is_referral IS NULL;

-- Log the comprehensive update
INSERT INTO system_logs (message, level, analyzed_by_ai) 
VALUES ('CRITICAL SCHEMA REPAIR: Synced appointment_requests with Referral Hub requirements', 'WARNING', true);
