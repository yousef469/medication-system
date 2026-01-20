-- Phase 25: Allow System Logging

-- The 'system_logs' table is missing an INSERT policy, causing 403 errors when staff perform actions.

CREATE POLICY "Allow staff to insert logs" ON system_logs
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Optional: Allow reading own logs or all logs? 
-- Existing policy is "Logs are viewable by IT" (SELECT to authenticated).
-- That is sufficient for now.
