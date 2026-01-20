-- Add suggested_layer column to patient_diagnoses
ALTER TABLE public.patient_diagnoses 
ADD COLUMN IF NOT EXISTS suggested_layer TEXT DEFAULT 'SYSTEMIC';

-- Update RLS if necessary (usually not needed for just a column addition)
COMMENT ON COLUMN public.patient_diagnoses.suggested_layer IS 'The anatomical system to visualize (SKELETAL, MUSCULAR, SYSTEMIC)';
