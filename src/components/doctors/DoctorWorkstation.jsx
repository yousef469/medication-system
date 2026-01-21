import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useClinical } from '../../context/ClinicalContext';
import ProfessionalProfile from '../shared/ProfessionalProfile';
import HumanoidVisualizer from '../shared/HumanoidVisualizer';
import BioAnatomyLab from '../dashboards/BioAnatomyLab';

const DoctorWorkstation = () => {
    const { user } = useAuth();
    const { requests, fetchRequests, prescribeMedication, requestNurseHelp, completeCase, fetchPatientHistory } = useClinical();
    const [activeTab, setActiveTab] = useState('cases');
    const [selectedCase, setSelectedCase] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showFullLab, setShowFullLab] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [nurseNotes, setNurseNotes] = useState('');
    const [requestNote, setRequestNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showAssistanceUI, setShowAssistanceUI] = useState(false);

    // Initial Fetch for Doctor
    useEffect(() => {
        if (user?.hospital_id) {
            fetchRequests(user.hospital_id);
        }
    }, [user?.hospital_id]);

    // Only show active cases
    const myCases = requests.filter(r => r.assigned_doctor_id === user?.id && r.status !== 'COMPLETED');

    // Auto-fetch history when case is selected
    useEffect(() => {
        if (selectedCase?.patient_id) {
            handleViewHistory();
        } else {
            setPatientHistory([]);
        }
        setShowFullLab(false); // Reset lab when changing patients
    }, [selectedCase?.id]);

    const handlePrescribe = async () => {
        if (!selectedCase) return;
        setIsSaving(true);
        try {
            // Medication schedule format: [{ name: '', dose: '', time: '', confirmed: false }]
            const meds = prescription.split('\n').filter(p => p.trim()).map(p => ({
                name: p.split(':')[0] || p,
                dose: p.split(':')[1] || 'As directed',
                time: 'Scheduled',
                confirmed: false
            }));

            await prescribeMedication(selectedCase.id, meds, diagnosis, nurseNotes);
            alert('Prescription synchronized to Nurse station.');
            setSelectedCase(null);
            setDiagnosis('');
            setPrescription('');
            setNurseNotes('');
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCallNurse = async () => {
        if (!selectedCase) return;
        await requestNurseHelp(selectedCase.id, requestNote);
        alert('Assistance request broadcast to Coordinator.');
        setShowAssistanceUI(false);
        setRequestNote('');
    };

    const handleViewHistory = async () => {
        if (!selectedCase) return;
        setShowHistory(true);
        setIsLoadingHistory(true);
        const history = await fetchPatientHistory(selectedCase.patient_id);
        setPatientHistory(history);
        setIsLoadingHistory(false);
    };

    const handleCompleteCase = async () => {
        if (!selectedCase || !window.confirm('Mark this clinical case as COMPLETED?')) return;
        await completeCase(selectedCase.id, selectedCase.assigned_doctor_id, selectedCase.assigned_nurse_id);
        setSelectedCase(null);
    };

    return (
        <div className="doctor-workstation fade-in">
            <style>{`
                .doctor-workstation { padding: 1rem; color: var(--text-primary); }
                .work-layout { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
                
                .case-list { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 20px; padding: 1.5rem; height: calc(100vh - 150px); overflow-y: auto; }
                .case-item { padding: 1.2rem; border-radius: 14px; background: var(--glass-highlight); margin-bottom: 1rem; cursor: pointer; border: 1px solid transparent; transition: 0.3s; }
                .case-item:hover { background: rgba(var(--primary-rgb), 0.1); border-color: var(--primary); }
                .case-item.active { background: var(--primary); border-color: rgba(255,255,255,0.2); color: white; }
                
                .main-workspace { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 24px; padding: 2.5rem; min-height: 650px; }
                
                .detail-section { margin-bottom: 2.5rem; }
                .detail-section h3 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 1rem; }
                
                .input-field { width: 100%; background: var(--bg-app); border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem; color: var(--text-primary); margin-bottom: 1rem; outline: none; transition: 0.3s; }
                .input-field:focus { border-color: var(--primary); background: var(--bg-surface); }
                
                .ai-summary-card { background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; position: relative; }
                .ai-badge { position: absolute; top: 1rem; right: 1rem; font-size: 0.6rem; background: var(--primary); padding: 2px 8px; border-radius: 4px; font-weight: 800; }
            `}</style>

            <header className="portal-header" style={{ marginBottom: '2rem' }}>
                <h1 className="text-gradient">Medical Decision Workspace</h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className={`btn-secondary btn-xs ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>Clinical Cases</button>
                    <button className={`btn-secondary btn-xs ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Public Identity</button>
                </div>
            </header>

            {activeTab === 'profile' ? (
                <ProfessionalProfile profile={user} isOwner={true} showFeed={true} />
            ) : (
                <div className="work-layout">
                    <aside className="case-list">
                        <h3>Assigned Patients ({myCases.length})</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1.5rem' }}>Depth-first clinical navigation</p>

                        {myCases.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '4rem' }}>
                                <p>No patients currently assigned to your terminal.</p>
                            </div>
                        ) : (
                            myCases.map(c => (
                                <div
                                    key={c.id}
                                    className={`case-item ${selectedCase?.id === c.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCase(c)}
                                >
                                    <strong>{c.patient_name}</strong>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.4rem' }}>{c.urgency} • {c.status}</div>
                                </div>
                            ))
                        )}
                    </aside>

                    <main className="main-workspace">
                        {selectedCase ? (
                            <div className="fade-in">
                                <section className="ai-summary-card">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                                        <div>
                                            <div className="ai-badge">AI ANALYZED</div>
                                            <h3>Clinical Summary: {selectedCase.patient_name}</h3>
                                            <p style={{ lineHeight: 1.6, opacity: 0.9, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                                {selectedCase.ai_conclusion || `Patient presents with ${selectedCase.service_requested}.`}
                                            </p>
                                            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                                <strong>AI Reasoning:</strong> Analyzing current symptoms against {patientHistory.length} previous clinical sessions for diagnostic continuity.
                                            </p>

                                            {selectedCase.file_url && (
                                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>ATTACHED CLINICAL MEDIA</div>
                                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                        {selectedCase.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                            <img src={selectedCase.file_url} alt="Clinical Attachment" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--primary)' }} />
                                                        ) : (
                                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '1.5rem', border: '1px solid var(--glass-border)' }}>📋</div>
                                                        )}
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Medical File Attachment</div>
                                                            <a href={selectedCase.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>🔓 OPEN FULL RESOLUTION</a>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="humanoid-container" style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
                                            <HumanoidVisualizer
                                                markers={selectedCase.ai_humanoid_markers || []}
                                                highlightedParts={selectedCase.manual_highlights || []}
                                                role="DOCTOR"
                                            />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <button
                                            className="btn-secondary btn-xs"
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                            onClick={() => setShowAssistanceUI(!showAssistanceUI)}
                                        >
                                            🆘 {selectedCase.nurse_requested ? 'Assistance Requested' : 'Call for Nurse'}
                                        </button>
                                        <button
                                            className="btn-secondary btn-xs"
                                            onClick={handleViewHistory}
                                        >
                                            📂 View Health Records
                                        </button>
                                        <button
                                            className="btn-secondary btn-xs"
                                            style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderColor: 'rgba(34, 197, 94, 0.2)' }}
                                            onClick={handleCompleteCase}
                                        >
                                            🏁 Complete Case
                                        </button>
                                        <button
                                            className="btn-primary btn-xs"
                                            onClick={() => setShowFullLab(!showFullLab)}
                                            style={{ background: 'linear-gradient(45deg, #7c44ed, #ef4444)', border: 'none' }}
                                        >
                                            {showFullLab ? '📊 Back to Chart' : '🚀 Full 3D Clinical Analysis'}
                                        </button>
                                    </div>

                                    {showFullLab && (
                                        <div className="fade-in" style={{ marginTop: '2rem', borderTop: '2px solid var(--primary)', paddingTop: '2rem' }}>
                                            <BioAnatomyLab
                                                patientId={selectedCase.patient_id}
                                                patientName={selectedCase.patient_name}
                                            />
                                        </div>
                                    )}

                                    {showAssistanceUI && (
                                        <div className="fade-in" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                            <label style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block', marginBottom: '0.5rem' }}>ASSISTANCE NOTE (WHY DO YOU NEED A NURSE?)</label>
                                            <input
                                                className="input-field"
                                                style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}
                                                placeholder="e.g. Needs immediate IV placement..."
                                                value={requestNote}
                                                onChange={(e) => setRequestNote(e.target.value)}
                                            />
                                            <button className="btn-primary btn-xs w-full" onClick={handleCallNurse}>Transmit Request</button>
                                        </div>
                                    )}

                                    {showHistory && (
                                        <div className="fade-in" style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--primary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h4>PATIENT CLINICAL HISTORY</h4>
                                                <button className="btn-secondary btn-xs" onClick={() => setShowHistory(false)}>Close</button>
                                            </div>
                                            {isLoadingHistory ? (
                                                <p style={{ opacity: 0.5 }}>Retrieving vault records...</p>
                                            ) : patientHistory.length === 0 ? (
                                                <p style={{ opacity: 0.5 }}>No previous history found for this hospital facility.</p>
                                            ) : (
                                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                    {patientHistory.map(h => (
                                                        <div key={h.id} style={{ padding: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                                                            <div style={{ color: 'var(--primary)', fontWeight: 700 }}>{new Date(h.created_at).toLocaleDateString()}</div>
                                                            <div style={{ fontWeight: 600 }}>Diagnosis: {h.diagnosis}</div>
                                                            <div style={{ opacity: 0.7 }}>Medication: {h.medication_schedule}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </section>

                                {selectedCase.is_referral && (
                                    <section className="glass-card fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: '4px solid #a78bfa', background: 'rgba(124, 68, 237, 0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#a78bfa' }}>Specialized 3D Referral</h3>
                                                <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>This patient has shared a high-fidelity anatomical model. Review the AI-mapped red highlights below before authorization.</p>
                                            </div>
                                            <div style={{ background: '#a78bfa', color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '900' }}>PRECISION ANATOMY</div>
                                        </div>
                                    </section>
                                )}

                                {selectedCase.vitals_data && Object.keys(selectedCase.vitals_data).length > 0 && (
                                    <section className="glass-card fade-in" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: '4px solid var(--secondary)' }}>
                                        <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--secondary)' }}>Live Vitals (Nurse Logged)</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>BP</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedCase.vitals_data.bp || '--'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>HR</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedCase.vitals_data.heartRate || '--'} <span style={{ fontSize: '0.6rem' }}>BPM</span></div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>TEMP</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedCase.vitals_data.temp || '--'} <span style={{ fontSize: '0.6rem' }}>°C</span></div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>SPO2</div>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedCase.vitals_data.spo2 || '--'} <span style={{ fontSize: '0.6rem' }}>%</span></div>
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div className="detail-section">
                                        <h3>Clinical Diagnosis</h3>
                                        <textarea
                                            className="input-field"
                                            placeholder="Enter medical diagnosis..."
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                            style={{ height: '120px' }}
                                        ></textarea>

                                        <h3>Medical Instructions (For Nurse)</h3>
                                        <textarea
                                            className="input-field"
                                            placeholder="Specific care instructions..."
                                            value={nurseNotes}
                                            onChange={(e) => setNurseNotes(e.target.value)}
                                            style={{ height: '120px' }}
                                        ></textarea>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Medication Prescription</h3>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.5rem' }}>Format: MedName : Dosage (One per line)</p>
                                        <textarea
                                            className="input-field"
                                            placeholder="Example: Amoxicillin : 500mg BID"
                                            value={prescription}
                                            onChange={(e) => setPrescription(e.target.value)}
                                            style={{ height: '280px', fontFamily: 'monospace' }}
                                        ></textarea>
                                    </div>
                                </div>

                                <button
                                    className="btn-primary w-full"
                                    style={{ padding: '1.2rem' }}
                                    onClick={handlePrescribe}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Synchronizing Medical Orders...' : 'Authorize Clinical Orders'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '10rem' }}>
                                <div style={{ fontSize: '4rem' }}>🧠</div>
                                <h3>Select a patient to enter the Medical Brain space.</h3>
                            </div>
                        )}
                    </main>
                </div >
            )}
        </div >
    );
};

export default DoctorWorkstation;
