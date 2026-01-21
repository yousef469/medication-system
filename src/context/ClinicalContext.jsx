import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './useAuth';

const ClinicalContext = createContext();

export function useClinical() {
    const context = useContext(ClinicalContext);
    if (!context) throw new Error('useClinical must be used within ClinicalProvider');
    return context;
}

export const ClinicalProvider = ({ children }) => {
    const [requests, setRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const { user } = useAuth();

    // Hardened API Selection: Ensure APK/Vercel ALWAYS uses the tunnel
    const tunnelUrl = "https://medical-hub-brain.loca.lt";
    const API_URL = import.meta.env.PROD || window.location.hostname !== 'localhost'
        ? tunnelUrl
        : "";

    // Localtunnel bypass headers for production
    const fetchHeaders = { "Bypass-Tunnel-Reminder": "true" };

    const [isBackendOnline, setIsBackendOnline] = useState(false);
    const [lastHealthCheck, setLastHealthCheck] = useState(null);

    const checkBackendHealth = async () => {
        try {
            const res = await fetch(`${API_URL}/`, { headers: fetchHeaders });
            setIsBackendOnline(res.ok);
            setLastHealthCheck(new Date().toLocaleTimeString());
        } catch (err) {
            setIsBackendOnline(false);
            setLastHealthCheck(new Date().toLocaleTimeString());
        }
    };

    useEffect(() => {
        checkBackendHealth();
        const healthInterval = setInterval(checkBackendHealth, 30000);

        const loadOfflineData = () => {
            const cachedHospitals = localStorage.getItem('medi_offline_hospitals');
            const cachedRequests = localStorage.getItem('medi_offline_requests');
            if (cachedRequests) setRequests(JSON.parse(cachedRequests));
            if (cachedHospitals) setHospitals(JSON.parse(cachedHospitals));
        };
        loadOfflineData();
        fetchHospitals();

        const requestsChannel = supabase
            .channel('public:appointment_requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointment_requests' }, payload => {
                refreshGlobalData();
            })
            .subscribe();

        const profilesChannel = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
                fetchDoctors();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(requestsChannel);
            supabase.removeChannel(profilesChannel);
            clearInterval(healthInterval);
        };
    }, []);

    const refreshGlobalData = async () => {
        await Promise.all([fetchRequests(), fetchDoctors()]);
    };

    const fetchHospitals = async () => {
        const { data, error } = await supabase.from('hospitals').select('*').in('status', ['APPROVED', 'PENDING']);
        if (error) console.error('Error fetching hospitals:', error);
        else {
            setHospitals(data || []);
            localStorage.setItem('medi_offline_hospitals', JSON.stringify(data || []));
        }
    };

    const fetchRequests = async (hospitalId = null) => {
        let query = supabase.from('appointment_requests').select('*');
        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data } = await query.order('created_at', { ascending: false });
        if (data) {
            setRequests(data);
            localStorage.setItem('medi_offline_requests', JSON.stringify(data));
        }
    };

    const fetchPatientHistory = async (patientId) => {
        const { data, error } = await supabase
            .from('appointment_requests')
            .select('*')
            .eq('patient_id', patientId)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching patient history:', error);
        return data || [];
    };

    const fetchHospitalArchives = async (hospitalId) => {
        const { data, error } = await supabase
            .from('appointment_requests')
            .select('*')
            .eq('hospital_id', hospitalId)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching hospital archives:', error);
        return data || [];
    };

    const fetchDiagnoses = async (patientId) => {
        const { data, error } = await supabase
            .from('patient_diagnoses')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching personal diagnoses:', error);
        return data || [];
    };

    const uploadDiagnosis = async (file, title) => {
        try {
            let aiResult = {
                title: title || file.name,
                conclusion: "AI Analysis Offline. Record stored for manual physician review.",
                markers: [],
                suggested_layer: 'SYSTEMIC'
            };

            // 1. AI Analysis (Attempt)
            try {
                const formData = new FormData();
                formData.append('file', file);

                const aiRes = await fetch(`${API_URL}/api/analyze_report`, {
                    method: 'POST',
                    headers: fetchHeaders,
                    body: formData
                });

                if (aiRes.ok) {
                    const json = await aiRes.json();
                    if (!json.error) aiResult = json;
                }
            } catch (aiErr) {
                console.warn("[ClinicalContext] AI unreachable, proceeding with manual upload.");
            }

            console.log("[ClinicalContext] User ID:", user?.id);

            // 2. Upload to Supabase Storage
            const fileUrl = await uploadFileToSupabase(file);
            if (!fileUrl) throw new Error("Cloud Storage Upload Failed");

            // 3. Save to DB
            const { data, error } = await supabase.from('patient_diagnoses').insert([{
                patient_id: user?.id,
                file_url: fileUrl,
                title: aiResult.title,
                ai_conclusion: aiResult.conclusion,
                ai_markers: aiResult.markers,
                suggested_layer: aiResult.suggested_layer,
                ai_raw_analysis: aiResult
            }]).select();

            if (error) {
                console.error("[ClinicalContext] Supabase Error:", error);
                throw error;
            }
            return data?.[0];
        } catch (err) {
            console.error("Upload Diagnosis Error:", err);
            throw err;
        }
    };

    const fetchDoctors = async (hospitalId = null) => {
        let query = supabase.from('profiles').select('*').in('role', ['doctor', 'nurse']);
        if (hospitalId) {
            query = query.eq('hospital_id', hospitalId);
        }

        const { data } = await query;
        if (data) {
            setDoctors(data);
            localStorage.setItem('medi_offline_doctors', JSON.stringify(data));
        }
    };

    const analyzeRequest = (content) => {
        let suggestedSection = "General Medicine";
        const lower = content?.toLowerCase() || '';

        if (lower.includes("brain") || lower.includes("head") || lower.includes("مخ") || lower.includes("رأس")) suggestedSection = "Neurology";
        if (lower.includes("heart") || lower.includes("chest") || lower.includes("قلب") || lower.includes("صدر")) suggestedSection = "Cardiology";
        if (lower.includes("cancer") || lower.includes("tumor") || lower.includes("سرطان") || lower.includes("ورم")) suggestedSection = "Oncology";

        return suggestedSection;
    };

    // Hybrid AI Logic: Local Backend (FastAPI) -> Fallback to JS Rules
    const aiConsultation = async (query, inputType = 'text', fileData = null) => {
        try {
            // Always use the server as a Gemini proxy
            let response;
            if (inputType === 'image' && fileData) {
                const formData = new FormData();
                formData.append('file', fileData);
                formData.append('prompt', query || "Analyze this image.");
                formData.append('use_online', true); // Force Gemini

                const res = await fetch(`${API_URL}/api/analyze_image`, {
                    method: 'POST',
                    headers: fetchHeaders, // Added bypass
                    body: formData
                });
                if (!res.ok) throw new Error("Backend Error");
                const json = await res.json();
                response = {
                    type: 'GEMINI_CLOUD',
                    answer: json.response,
                    suggestion: 'MedicalHub'
                };
            } else {
                // Fetch user history for context
                const { data: history } = await supabase
                    .from('appointment_requests')
                    .select('*')
                    .eq('patient_id', user?.id)
                    .eq('status', 'COMPLETED')
                    .limit(5);

                const res = await fetch(`${API_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...fetchHeaders // Added bypass
                    },
                    body: JSON.stringify({
                        message: query,
                        history: history || [],
                        use_online: true // Force Gemini
                    })
                });

                if (!res.ok) throw new Error("Backend Error");
                const json = await res.json();

                response = {
                    type: 'GEMINI_CLOUD',
                    answer: json.response,
                    suggestion: json.action === 'search_hospital' ? 'Hospitals' : 'General'
                };
            }
            return response;
        } catch (err) {
            console.error("AI Error:", err);
            return {
                type: 'ERROR',
                answer: "I am unable to connect to the medical brain. Please ensure the server is running.",
                suggestion: 'General'
            };
        }
    };

    const analyzeClinicalRequest = async (requestText, history, file = null) => {
        try {
            const formData = new FormData();
            formData.append('request_text', requestText);
            formData.append('history_json', JSON.stringify(history));
            if (file) formData.append('file', file);

            const res = await fetch(`${API_URL}/api/analyze_clinical_request`, {
                method: 'POST',
                headers: fetchHeaders, // Added bypass
                body: formData
            });

            if (!res.ok) throw new Error("AI Synthesis Failed");
            return await res.json();
        } catch (err) {
            console.error("Clinical AI Error:", err);
            return {
                conclusion: "AI synthesis offline. Clinical logs available for manual triage.",
                markers: []
            };
        }
    };

    const uploadFileToSupabase = async (file) => {
        if (!file || !(file instanceof File)) return null;

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${user?.id || 'anonymous'}/${fileName}`;

            const { data, error: uploadError } = await supabase.storage
                .from('medical-records')
                .upload(filePath, file);

            if (uploadError) {
                console.error('[Storage] Upload failed:', uploadError);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('medical-records')
                .getPublicUrl(filePath);

            console.log('[Storage] Uploaded successfully:', publicUrl);
            return publicUrl;
        } catch (err) {
            console.error('[Storage] Unexpected error:', err);
            return null;
        }
    };

    const submitRequest = async (patientName, hospitalId, content, urgency = 'SCHEDULED', type = 'text', file = null, voiceUrl = null, preferredDoctorId = null, manualHighlights = []) => {
        setLoading(true);
        try {
            // 0. Upload file to Supabase if present
            let persistentFileUrl = null;
            if (file instanceof File) {
                persistentFileUrl = await uploadFileToSupabase(file);
            } else if (typeof file === 'string') {
                persistentFileUrl = file;
            }

            // 1. Fetch Patient History for Gemini Analysis
            const { data: pastHistory } = await supabase
                .from('appointment_requests')
                .select('*')
                .eq('patient_id', user?.id)
                .eq('status', 'COMPLETED');

            // 2. Perform AI Anatomical Analysis
            const aiResult = await analyzeClinicalRequest(content, pastHistory || [], file instanceof File ? file : null);

            // 3. Insert Request with AI Insights
            const { data, error } = await supabase.from('appointment_requests').insert([{
                patient_name: patientName,
                patient_id: user?.id,
                hospital_id: hospitalId,
                service_requested: content,
                urgency: urgency,
                status: 'PENDING_SECRETARY',
                preferred_doctor_id: preferredDoctorId,
                file_url: persistentFileUrl,
                voice_url: voiceUrl,
                ai_analysis: aiResult,
                ai_conclusion: aiResult.conclusion,
                ai_humanoid_markers: aiResult.markers,
                // Referral Hub fields
                is_referral: !!(aiResult.markers?.length || content.includes('[REFERRAL]')),
                manual_highlights: manualHighlights,
                clinical_snapshot: aiResult
            }]).select();

            if (error) console.error('Error submitting request:', error);
            return data?.[0];
        } catch (err) {
            console.error('Error submitting request:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const routeToDoctor = async (requestId, doctorId) => {
        const { error } = await supabase
            .from('appointment_requests')
            .update({
                status: 'ROUTED_TO_DOCTOR',
                assigned_doctor_id: doctorId,
                handled_by_coordinator_id: user?.id
            })
            .eq('id', requestId);

        if (error) {
            console.error('Error routing to doctor:', error);
        } else {
            logEvent(`SECRETARY: Routed request ${requestId.slice(0, 8)} to doctor`, 'INFO');
        }
    };

    const assignNurse = async (requestId, nurseId) => {
        console.log("DEBUG assignNurse:", { requestId, nurseId });
        const { error } = await supabase
            .from('appointment_requests')
            .update({ assigned_nurse_id: nurseId, status: 'EXECUTING_CARE' })
            .eq('id', requestId);
        if (error) console.error('Error assigning nurse:', JSON.stringify(error, null, 2));
        else logEvent(`SECRETARY: Assigned nurse to request ${requestId.slice(0, 8)}`, 'INFO');
    };

    const updateVitals = async (requestId, vitals) => {
        const { error } = await supabase
            .from('appointment_requests')
            .update({ vitals_data: vitals })
            .eq('id', requestId);
        if (error) console.error('Error updating vitals:', error);
    };

    const prescribeMedication = async (requestId, meds, diagnosis, instructions) => {
        const { error } = await supabase
            .from('appointment_requests')
            .update({
                medication_schedule: meds,
                diagnosis: diagnosis,
                nurse_instructions: instructions,
                status: 'EXECUTING_CARE'
            })
            .eq('id', requestId);
        if (error) console.error('Error prescribing:', error);
    };

    const confirmAdministration = async (requestId, meds) => {
        const { error } = await supabase
            .from('appointment_requests')
            .update({ medication_schedule: meds })
            .eq('id', requestId);
        if (error) console.error('Error confirming med:', error);
    };

    const requestNurseHelp = async (requestId, note) => {
        const { error } = await supabase
            .from('appointment_requests')
            .update({ nurse_requested: true, nurse_request_note: note })
            .eq('id', requestId);
        if (error) console.error('Error requesting nurse help:', error);
        else logEvent(`DOCTOR: Requested nurse assistance for case ${requestId.slice(0, 8)}`, 'WARNING');
    };

    const generateInvite = async (hospitalId, role) => {
        const { data, error } = await supabase
            .from('hospital_invites')
            .insert([{ hospital_id: hospitalId, role: role }])
            .select()
            .single();

        if (error) {
            console.error('Error generating invite:', error);
            throw error;
        }
        return data;
    };

    const completeCase = async (requestId, doctorId, nurseId) => {
        // 1. Mark Request as Completed
        const { error } = await supabase
            .from('appointment_requests')
            .update({ status: 'COMPLETED', nurse_requested: false })
            .eq('id', requestId);

        if (error) {
            console.error('Error completing case:', error);
            return;
        }

        // 2. Release Staff Availability (Set to 'Available')
        if (doctorId) {
            await supabase.from('doctors_meta').update({ status: 'Available' }).eq('id', doctorId);
        }
        // If nurses have meta status, update it too (assuming they reuse doctors_meta or profiles extension)
        // Currently nurses are in 'doctors_meta' technically? or just 'profiles'.
        // Let's check where 'status' is stored. doctors_meta has 'status'. Nurses might not have an entry there yet unless we created it.
        // For safety, we'll try updating doctors_meta if the nurse exists there.
        if (nurseId) {
            await supabase.from('doctors_meta').update({ status: 'Available' }).eq('id', nurseId);
        }

        logEvent(`CLINICAL: Completed case ${requestId.slice(0, 8)}`, 'INFO');
        await refreshGlobalData();
    };

    const logEvent = async (message, level = 'INFO') => {
        await supabase.from('system_logs').insert([{ message, level, analyzed_by_ai: true }]);
    };

    const deleteDiagnosis = async (diagnosisId) => {
        try {
            // 1. Get file path from URL
            const { data: diagnosis } = await supabase
                .from('patient_diagnoses')
                .select('file_url')
                .eq('id', diagnosisId)
                .single();

            if (diagnosis?.file_url) {
                const urlParts = diagnosis.file_url.split('/');
                const fileName = urlParts.pop();
                const folderName = urlParts.pop();
                const filePath = `${folderName}/${fileName}`;

                // 2. Delete from Storage
                await supabase.storage.from('medical-records').remove([filePath]);
            }

            // 3. Delete from DB
            const { error } = await supabase.from('patient_diagnoses').delete().eq('id', diagnosisId);
            if (error) throw error;

            console.log('[Storage] Deleted diagnosis and file successfully');
        } catch (err) {
            console.error('Error deleting diagnosis:', err);
        }
    };

    return (
        <ClinicalContext.Provider value={{
            requests,
            doctors,
            hospitals,
            systemLogs,
            submitRequest,
            routeToDoctor,
            logEvent,
            aiConsultation,
            fetchRequests,
            fetchDoctors,
            fetchPatientHistory,
            fetchHospitalArchives,
            fetchDiagnoses,
            uploadDiagnosis,
            deleteDiagnosis,
            assignNurse,
            updateVitals,
            prescribeMedication,
            confirmAdministration,
            requestNurseHelp,
            completeCase,
            generateInvite,
            isBackendOnline,
            lastHealthCheck,
            checkBackendHealth
        }}>
            {children}
        </ClinicalContext.Provider>
    );
};
