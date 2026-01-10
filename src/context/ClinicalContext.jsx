import React, { createContext, useContext, useState, useEffect } from 'react';

const ClinicalContext = createContext();

export const ClinicalProvider = ({ children }) => {
    const [requests, setRequests] = useState([
        {
            id: 'req-1',
            patient: "John Doe",
            hospital: "Central City General",
            section: "Neurology",
            diagnosis: "Persistent Migraines",
            urgency: "NEXT HOUR",
            status: "PENDING_SECRETARY",
            inputType: "text",
            timestamp: new Date().toISOString()
        }
    ]);

    const [doctors, setDoctors] = useState([
        { id: 'doc-1', name: "Alexander Vance", specialty: "Neurology", status: "Available", hospital: "Central City General" },
        { id: 'doc-2', name: "Sarah Miller", specialty: "Cardiology", status: "Busy", hospital: "Central City General" },
        { id: 'doc-3', name: "Robert Chen", specialty: "General Medicine", status: "Vacation", hospital: "District Medical" },
    ]);

    const [systemLogs, setSystemLogs] = useState([]);

    // Mock AI Analysis logic (to be expanded later)
    const analyzeRequest = (requestData) => {
        // Basic keyword-based routing for now
        let suggestedSection = "General";
        if (requestData.content.toLowerCase().includes("brain") || requestData.content.toLowerCase().includes("head")) suggestedSection = "Neurology";
        if (requestData.content.toLowerCase().includes("heart") || requestData.content.toLowerCase().includes("chest")) suggestedSection = "Cardiology";
        if (requestData.content.toLowerCase().includes("cancer") || requestData.content.toLowerCase().includes("tumor")) suggestedSection = "Oncology";
        if (requestData.content.toLowerCase().includes("pet") || requestData.content.toLowerCase().includes("dog") || requestData.content.toLowerCase().includes("cat")) suggestedSection = "Veterinary";

        return { suggestedSection };
    };

    const submitRequest = (patientName, hospital, content, urgency, inputType = 'text', file = null) => {
        const analysis = analyzeRequest({ content });
        const newRequest = {
            id: `req-${Date.now()}`,
            patient: patientName,
            hospital,
            section: analysis.suggestedSection,
            diagnosis: content,
            urgency,
            status: "PENDING_SECRETARY",
            inputType,
            timestamp: new Date().toISOString(),
            file: file ? file.name : null
        };

        setRequests(prev => [...prev, newRequest]);
        return newRequest;
    };

    const routeToDoctor = (requestId, doctorId) => {
        setRequests(prev => prev.map(req =>
            req.id === requestId
                ? { ...req, status: "ROUTED_TO_DOCTOR", assignedDoctorId: doctorId }
                : req
        ));

        const doctor = doctors.find(d => d.id === doctorId);
        logEvent(`SECRETARY: Routed ${requestId} to ${doctor.name}`, 'INFO');
    };

    const logEvent = (message, level = 'INFO') => {
        const newLog = {
            id: `log-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            message,
            level,
            analyzedByAI: true
        };
        setSystemLogs(prev => [newLog, ...prev]);

        // Simulate immediate IT alert for critical errors
        if (level === 'ERROR' || level === 'SECURITY') {
            window.dispatchEvent(new CustomEvent('IT_ALERT', { detail: newLog }));
        }
    };

    return (
        <ClinicalContext.Provider value={{
            requests,
            doctors,
            systemLogs,
            submitRequest,
            routeToDoctor,
            logEvent,
            setDoctors
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
