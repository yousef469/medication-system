-- Phase 37 Fix: Enable Deletion for Patient Diagnoses
-- The previous vault implementation forgot the DELETE policy

CREATE POLICY "Patients can delete own diagnoses"
    ON public.patient_diagnoses
    FOR DELETE
    USING (auth.uid() = patient_id);

-- Also ensure UPDATE is possible for potential future renaming
CREATE POLICY "Patients can update own diagnoses"
    ON public.patient_diagnoses
    FOR UPDATE
    USING (auth.uid() = patient_id);
