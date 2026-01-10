import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const ClinicalContext = createContext();

export const ClinicalProvider = ({ children }) => {
    const [requests, setRequests] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [systemLogs, setSystemLogs] = useState([]);

    // 1. Initial Data Fetch & Real-time Subscriptions
    useEffect(() => {
        fetchInitialData();

        // Subscribe to changes in requests
        const requestsChannel = supabase
            .channel('public:requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, payload => {
                handleRequestChange(payload);
            })
            .subscribe();

        // Subscribe to changes in doctor status
        const doctorsChannel = supabase
            .channel('public:doctors_meta')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors_meta' }, payload => {
                fetchDoctors(); // Refresh all to get joined data
            })
            .subscribe();

        // Subscribe to system logs
        const logsChannel = supabase
            .channel('public:system_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, payload => {
                setSystemLogs(prev => [payload.new, ...prev].slice(0, 50));
                if (payload.new.level === 'ERROR') {
                    window.dispatchEvent(new CustomEvent('IT_ALERT', { detail: payload.new }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(requestsChannel);
            supabase.removeChannel(doctorsChannel);
            supabase.removeChannel(logsChannel);
        };
    }, []);

    const fetchInitialData = async () => {
        await Promise.all([fetchRequests(), fetchDoctors(), fetchLogs()]);
    };

    const fetchRequests = async () => {
        const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
        if (data) setRequests(data);
    };

    const fetchDoctors = async () => {
        // Join profiles and doctors_meta
        const { data } = await supabase
            .from('doctors_meta')
            .select(`
        *,
        profiles (name)
      `);
        if (data) {
            const formattedDoctors = data.map(d => ({
                id: d.id,
                name: d.profiles?.name || 'Unknown Doctor',
                specialty: d.specialty,
                status: d.status,
                hospital: d.hospital_name,
                bio: d.bio
            }));
            setDoctors(formattedDoctors);
        }
    };

    const fetchLogs = async () => {
        const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setRequests(data);
    };

    const handleRequestChange = (payload) => {
        if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
            setRequests(prev => prev.map(req => req.id === payload.new.id ? payload.new : req));
        } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(req => req.id !== payload.old.id));
        }
    };

    const analyzeRequest = (content) => {
        let suggestedSection = "General";
        const lower = content.toLowerCase();
        if (lower.includes("brain") || lower.includes("head")) suggestedSection = "Neurology";
        if (lower.includes("heart") || lower.includes("chest")) suggestedSection = "Cardiology";
        if (lower.includes("cancer") || lower.includes("tumor")) suggestedSection = "Oncology";
        if (lower.includes("pet") || lower.includes("dog") || lower.includes("cat")) suggestedSection = "Veterinary";
        return suggestedSection;
    };

    const submitRequest = async (patientName, hospital, content, urgency, inputType = 'text') => {
        const suggestedSection = analyzeRequest(content);
        const { data, error } = await supabase.from('requests').insert([{
            patient_name: patientName,
            hospital: hospital,
            section: suggestedSection,
            diagnosis: content,
            urgency: urgency,
            status: 'PENDING_SECRETARY'
        }]).select();

        if (error) console.error('Error submitting request:', error);
        return data?.[0];
    };

    const routeToDoctor = async (requestId, doctorId) => {
        const { error } = await supabase
            .from('requests')
            .update({ status: 'ROUTED_TO_DOCTOR', assigned_doctor_id: doctorId })
            .eq('id', requestId);

        if (error) {
            console.error('Error routing to doctor:', error);
        } else {
            logEvent(`SECRETARY: Routed request ${requestId.slice(0, 8)} to doctor`, 'INFO');
        }
    };

    const logEvent = async (message, level = 'INFO') => {
        await supabase.from('system_logs').insert([{ message, level, analyzed_by_ai: true }]);
    };

    return (
        <ClinicalContext.Provider value={{
            requests,
            doctors,
            systemLogs,
            submitRequest,
            routeToDoctor,
            logEvent
        }}>
            {children}
        </ClinicalContext.Provider>
    );
};

export const useClinical = () => {
    const context = useContext(ClinicalContext);
    if (!context) throw new Error('useClinical must be used within ClinicalProvider');
    return context;
};
