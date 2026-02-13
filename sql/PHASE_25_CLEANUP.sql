-- Phase 25 Cleanup: Reset Board State
-- Use this script to "Unstick" any frozen requests or inconsistent staff statuses.

-- 1. Force Complete all active requests (clears Doctor/Nurse views)
UPDATE appointment_requests 
SET status = 'COMPLETED', nurse_requested = false 
WHERE status != 'COMPLETED';

-- 2. Reset All Staff Availability (Fixes "Busy" doctors who are actually free)
UPDATE doctors_meta 
SET status = 'Available';

-- 3. Reset System Logs (Optional, keeps log clean for new tests)
-- DELETE FROM system_logs; -- Uncomment if you want a blank log

-- 4. Verify the fix
SELECT id, patient_name, status FROM appointment_requests;
SELECT id, status FROM doctors_meta;
