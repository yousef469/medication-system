import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import QRCode from 'react-qr-code';

const DoctorConsultation = ({ request, onBack }) => {
    const { saveDoctorAssessment, generatePrescription, loading } = useClinical(); // ADDED generatePrescription
    const [activeSection, setActiveSection] = useState('Vital Sign');
    const [showAnatomy, setShowAnatomy] = useState(false);

    // QR Modal State
    const [showRxModal, setShowRxModal] = useState(false);
    const [prescriptionToken, setPrescriptionToken] = useState(null);

    // Initialize assessment with nurse data if available
    const [assessment, setAssessment] = useState({
        vitals: request.vitals_data || {},
        allergies: request.allergies_data || [],
        medications: '',
        complaint: request.complaint || '',
        history: '',
        diagnosis: '',
        investigations: '',
        progressNote: '',
        advice: { followUpDate: '', referrals: [] },
        certificate: { template: '', content: '' },
        referral: { specialty: '', doctor: '', remarks: '' },
        prescriptions: []
    });

    const [newDrug, setNewDrug] = useState({ name: '', dosage: '', frequency: '', duration: '', route: '' });

    const addDrug = () => {
        if (!newDrug.name) return;
        setAssessment({
            ...assessment,
            prescriptions: [...assessment.prescriptions, { ...newDrug }]
        });
        setNewDrug({ name: '', dosage: '', frequency: '', duration: '', route: '' });
    };

    const removeDrug = (indexToRemove) => {
        setAssessment({
            ...assessment,
            prescriptions: assessment.prescriptions.filter((_, index) => index !== indexToRemove)
        });
    };

    const sections = [
        // ... (rest of the component will be updated via multi-replace if needed, but I'll do a focused replace first)

        { id: 'nurse_assessment', label: 'NURSE ASSESSMENT', icon: '📋' },
        { id: 'vitals', label: 'VITAL SIGN', icon: '🌡️' },
        { id: 'allergies', label: 'ALLERGIES', icon: '🤧' },
        { id: 'medication', label: 'CURRENT MEDICATION', icon: '💊' },
        { id: 'complaint', label: 'PRESENTING COMPLAINT', icon: '🗣️' },
        { id: 'history', label: 'HISTORY AND EXAMINATION', icon: '🩺' },
        { id: 'diagnosis', label: 'DIAGNOSIS', icon: '🧠' },
        { id: 'investigation', label: 'INVESTIGATION/PROCEDURE', icon: '🔬' },
        { id: 'prescription', label: 'PRESCRIPTION MEDICINE', icon: '📝' },
        { id: 'advice', label: 'ADVICE', icon: '💡' },
        { id: 'certificate', label: 'MEDICAL CERTIFICATE', icon: '📜' },
        { id: 'anatomy', label: '3D ANATOMY REVIEW', icon: '👤', special: true }
    ];

    const handleSave = async () => {
        try {
            await saveDoctorAssessment(request.id, assessment);
            alert("Consultation Draft Saved!");
        } catch (err) {
            alert("Save Failed: " + err.message);
        }
    };

    const handleCompleteCase = async () => {
        try {
            // Updated: Generate Prescription Token first
            setShowRxModal(true);

            // Combine specific prescriptions and the general medication text
            const combinedMeds = [
                ...assessment.prescriptions,
                ...(assessment.medications ? [{ name: `NOTE: ${assessment.medications}`, dosage: '-', frequency: '-' }] : [])
            ];

            const rxData = {
                request_id: request.id, // CRITICAL: Link to the appointment
                doctor_id: "DOC-CURRENT", // Ideally from auth context
                hospital_id: "HOSP-001",
                patient_id: request.patient_id || request.id,
                patient_name: request.patient_name,
                medications: combinedMeds,
                diagnosis_context: assessment.diagnosis,
                insurance_data: { provider: "MainInsure", id: "123", status: "active", copay: 15.00 } // Mock Data
            };

            const result = await generatePrescription(rxData);
            setPrescriptionToken(result.token);

            // Background save with the full assessment
            await saveDoctorAssessment(request.id, { ...assessment, status: 'completed' });

        } catch (err) {
            alert("Error generating prescription: " + err.message);
            setShowRxModal(false);
        }
    };

    if (showAnatomy) {
        return <PatientAnatomyReview request={request} diagnosis={assessment.diagnosis} onBack={() => setShowAnatomy(false)} />;
    }

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'NURSE ASSESSMENT':
                return (
                    <div className="section-card">
                        <h3>Nurse Assessment Details</h3>
                        <div className="vitals-grid">
                            <div className="vital-item">
                                <span className="vital-label">TRIAGE:</span>
                                <span className={`triage-badge triage-${request.vitals_data?.triageColor?.toLowerCase() || 'gray'}`}>
                                    {request.vitals_data?.triageColor || 'NONE'}
                                </span>
                            </div>
                            <div className="vital-item">
                                <span className="vital-label">NURSE SEEN AT:</span>
                                <span className="vital-val">{new Date(request.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'VITAL SIGN':
                const vitalFields = [
                    { label: 'Systolic B.P.', key: 'systolicBP' },
                    { label: 'Diastolic B.P.', key: 'diastolicBP' },
                    { label: 'Temperature (oC)', key: 'temp' },
                    { label: 'Weight (Kg)', key: 'weight' },
                    { label: 'Height (cm)', key: 'height' },
                    { label: 'BMI (Kg/m2)', key: 'bmi' },
                    { label: 'Respiratory Rate (/Min)', key: 'respiratoryRate' },
                    { label: 'Heart Rate (BPM)', key: 'heartRate' },
                    { label: 'Urine Output', key: 'urineOutput' },
                    { label: 'SPO2', key: 'spo2' }
                ];
                return (
                    <div className="section-card">
                        <div className="grid-form">
                            {vitalFields.map(f => (
                                <div key={f.key} className="form-group">
                                    <label>{f.label}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={assessment.vitals[f.key] || ''}
                                        onChange={e => setAssessment({ ...assessment, vitals: { ...assessment.vitals, [f.key]: e.target.value } })}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '2rem' }}>
                            <h3>Current Vitals History</h3>
                            <table className="mini-table">
                                <thead>
                                    <tr><th>Date/Time</th><th>SBP</th><th>DBP</th><th>Temp</th><th>RR</th><th>HR</th><th>SPO2</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{new Date(request.created_at).toLocaleDateString()}</td>
                                        <td>{request.vitals_data?.systolicBP}</td>
                                        <td>{request.vitals_data?.diastolicBP}</td>
                                        <td>{request.vitals_data?.temp}</td>
                                        <td>{request.vitals_data?.respiratoryRate}</td>
                                        <td>{request.vitals_data?.heartRate}</td>
                                        <td>{request.vitals_data?.spo2}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'ALLERGIES':
                return (
                    <div className="section-card">
                        <h3>Drug & Food Allergies</h3>
                        <div className="allergy-editor">
                            {assessment.allergies.map((a, i) => (
                                <div key={i} className="allergy-row">
                                    <input value={a.allergen} readOnly className="form-input" />
                                    <input value={a.reaction} readOnly className="form-input" />
                                    <button onClick={() => {
                                        const newAllergies = assessment.allergies.filter((_, idx) => idx !== i);
                                        setAssessment({ ...assessment, allergies: newAllergies });
                                    }}>🗑️</button>
                                </div>
                            ))}
                            <button className="btn-secondary" onClick={() => setActiveSection('ALLERGIES')}>+ Add Allergy</button>
                        </div>
                    </div>
                );
            case 'DIAGNOSIS':
                return (
                    <div className="section-card">
                        <h3>Clinical Diagnosis</h3>
                        <textarea
                            className="editor-area"
                            placeholder="Type diagnostic conclusions here..."
                            value={assessment.diagnosis}
                            onChange={e => setAssessment({ ...assessment, diagnosis: e.target.value })}
                        />
                    </div>
                );
            case 'PRESENTING COMPLAINT':
                return (
                    <div className="section-card">
                        <h3>Chief Complaint</h3>
                        <textarea
                            className="editor-area"
                            placeholder="Patient's primary concern..."
                            value={assessment.complaint}
                            onChange={e => setAssessment({ ...assessment, complaint: e.target.value })}
                        />
                    </div>
                );
            case 'PRESCRIPTION MEDICINE':
                return (
                    <div className="section-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h3>Medication Prescriptions</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <input placeholder="Drug" className="form-input" style={{ width: '120px' }} value={newDrug.name} onChange={e => setNewDrug({ ...newDrug, name: e.target.value })} />
                                <input placeholder="Dose" className="form-input" style={{ width: '80px' }} value={newDrug.dosage} onChange={e => setNewDrug({ ...newDrug, dosage: e.target.value })} />
                                <input placeholder="Freq" className="form-input" style={{ width: '80px' }} value={newDrug.frequency} onChange={e => setNewDrug({ ...newDrug, frequency: e.target.value })} />
                                <button className="btn-primary btn-xs" onClick={addDrug}>+ Add</button>
                            </div>
                        </div>
                        <table className="mini-table">
                            <thead>
                                <tr><th>Drug Name</th><th>Dosage</th><th>Freq</th><th>Route/Dur</th><th></th></tr>
                            </thead>
                            <tbody>
                                {assessment.prescriptions.length === 0 ? (
                                    <tr><td colSpan="5" align="center">No specific drugs added to RX list yet.</td></tr>
                                ) : (
                                    assessment.prescriptions.map((p, idx) => (
                                        <tr key={idx}>
                                            <td>{p.name}</td>
                                            <td>{p.dosage}</td>
                                            <td>{p.frequency}</td>
                                            <td>{p.route || p.duration || '-'}</td>
                                            <td>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => {
                                                    const filtered = assessment.prescriptions.filter((_, i) => i !== idx);
                                                    setAssessment({ ...assessment, prescriptions: filtered });
                                                }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                );
            case 'ADVICE':
                return (
                    <div className="section-card">
                        <h3>Follow-up Advice</h3>
                        <textarea
                            className="editor-area"
                            value={assessment.advice.notes}
                            onChange={e => setAssessment({ ...assessment, advice: { ...assessment.advice, notes: e.target.value } })}
                        />
                    </div>
                );
            default:
                return (
                    <div className="section-card">
                        <h3>{activeSection}</h3>
                        <textarea
                            className="editor-area"
                            placeholder={`Record ${activeSection.toLowerCase()} details...`}
                        />
                    </div>
                );
        }
    };

    return (
        <div className="consultation-suite fade-in">
            <style>{`
                .consultation-suite { background: #f8fafc; border-radius: 12px; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
                .consultation-header { background: #0c4a6e; color: white; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0ea5e9; }
                .patient-info-strip { display: flex; gap: 2rem; font-size: 0.75rem; font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 0.5rem 1.5rem; }
                
                .consultation-body { display: flex; flex: 1; overflow: hidden; }
                .consultation-sidebar { width: 280px; background: white; border-right: 1px solid #e2e8f0; overflow-y: auto; }
                .sidebar-item { 
                    padding: 0.8rem 1.25rem; 
                    border-bottom: 1px solid #f1f5f9; 
                    cursor: pointer; 
                    display: flex; 
                    align-items: center; 
                    gap: 0.75rem; 
                    color: #475569; 
                    font-weight: 700; 
                    font-size: 0.7rem; 
                    transition: 0.2s;
                }
                .sidebar-item:hover { background: #f8fafc; color: #0c4a6e; padding-left: 1.5rem; }
                .sidebar-item.active { background: #0ea5e9; color: white; }
                .sidebar-item.special-btn { background: #fef3c7; color: #92400e; border-top: 2px solid #fbbf24; }

                .consultation-main { flex: 1; padding: 2rem; background: white; overflow-y: auto; }
                .section-card h3 { font-size: 0.9rem; color: #0c4a6e; margin-bottom: 1.25rem; border-left: 4px solid #0ea5e9; padding-left: 0.75rem; }

                .grid-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .form-group label { display: block; font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.25rem; }
                .form-input { width: 100%; border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; }
                .editor-area { width: 100%; min-height: 300px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1rem; font-size: 0.9rem; }

                .mini-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
                .mini-table th { background: #f1f5f9; padding: 0.5rem; text-align: left; }
                .mini-table td { padding: 0.5rem; border-bottom: 1px solid #f1f5f9; }

                .footer-controls { background: white; border-top: 2px solid #e2e8f0; padding: 1rem 2rem; display: flex; justify-content: flex-end; gap: 1rem; }
                .triage-badge { padding: 0.1rem 0.6rem; border-radius: 4px; color: white; font-size: 0.6rem; font-weight: 900; }
                .triage-red { background: #ef4444; }
                .triage-orange { background: #f97316; }
                .triage-yellow { background: #eab308; }
                .triage-green { background: #22c55e; }
                .triage-gray { background: #94a3b8; }

                .btn-save-pill { background: white; border: 1px solid #cbd5e1; color: #64748b; font-weight: 700; padding: 0.4rem 1rem; border-radius: 99px; transition: 0.2s; }
                .btn-save-pill:hover { background: #f1f5f9; color: #0f172a; }
                
                .btn-complete-pill { background: #0ea5e9; border: none; color: white; font-weight: 800; padding: 0.4rem 1.2rem; border-radius: 99px; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(14, 165, 233, 0.3); }
                .btn-complete-pill:hover { background: #0284c7; }

                /* MODAL STYLES */
                .wx-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 9999; animation: fademodal 0.2s ease-out; }
                .wx-modal { background: white; border-radius: 12px; width: 400px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
                .rx-header { background: #0c4a6e; color: white; padding: 1.5rem; text-align: center; }
                .rx-header h2 { margin: 0; font-size: 1.25rem; }
                .rx-header p { margin: 0.5rem 0 0; font-size: 0.8rem; opacity: 0.8; }
                .rx-body { padding: 2rem; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
                .qr-container { background: white; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; }
                .token-text { font-family: monospace; font-size: 1.2rem; font-weight: 700; color: #334155; margin-top: 1rem; letter-spacing: 2px; }
                .rx-footer { padding: 1.5rem; border-top: 1px solid #f1f5f9; display: flex; justify-content: center; background: #f8fafc; }
                
                @keyframes fademodal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
            `}</style>

            <header className="consultation-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'white', color: '#0c4a6e', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 900 }}>eClinic</div>
                    <span style={{ fontWeight: 800 }}>Patient Visits</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-view-pill" onClick={onBack}>Cancel</button>
                    <button className="btn-save-pill" onClick={handleSave}>Save Draft</button>
                    <button className="btn-complete-pill" onClick={handleCompleteCase}>Complete Case</button>
                </div>
            </header>

            {showRxModal && (
                <div className="wx-modal-overlay">
                    <div className="wx-modal rx-modal">
                        <div className="rx-header">
                            <h2>Rx Sent to Patient App</h2>
                            <p>Prescription Token Generated</p>
                        </div>
                        <div className="rx-body">
                            <div style={{ fontSize: '4rem' }}>📲</div>
                            <p>The secure QR code has been sent directly to the patient's mobile app.</p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Token: {prescriptionToken}</p>
                        </div>
                        <div className="rx-footer">
                            <button className="btn-primary" onClick={() => { setShowRxModal(false); onBack(); }}>Done & Close Case</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="patient-info-strip">
                <span>Reg No: {request.id.slice(-4)}</span>
                <span>Name: {request.patient_name}</span>
                <span>Age/Gender: 34Y/M</span>
                <span>Visit: {request.id.slice(-6).toUpperCase()}</span>
            </div>

            <div className="consultation-body">
                <nav className="consultation-sidebar">
                    {sections.map(s => (
                        <div
                            key={s.id}
                            className={`sidebar-item ${activeSection === s.label ? 'active' : ''} ${s.special ? 'special-btn' : ''}`}
                            onClick={() => s.id === 'anatomy' ? setShowAnatomy(true) : setActiveSection(s.label)}
                        >
                            <span>{s.icon}</span> {s.label}
                        </div>
                    ))}
                </nav>
                <main className="consultation-main">
                    {renderSectionContent()}
                </main>
            </div>
        </div>
    );
};

export default DoctorConsultation;
