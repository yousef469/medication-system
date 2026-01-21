import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useClinical } from '../../context/ClinicalContext';
import ProfessionalProfile from '../shared/ProfessionalProfile';
import HumanoidVisualizer from '../shared/HumanoidVisualizer';
import BioAnatomyLab from './BioAnatomyLab';

const NurseDashboard = () => {
    const { user } = useAuth();
    const { requests, fetchRequests, doctors, updateVitals, confirmAdministration, fetchPatientHistory } = useClinical();
    const [activeTab, setActiveTab] = useState('care');
    const [selectedCase, setSelectedCase] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showFullLab, setShowFullLab] = useState(false);

    // Auto-fetch history when case is selected
    useEffect(() => {
        if (selectedCase?.patient_id) {
            handleViewHistory();
        } else {
            setPatientHistory([]);
        }
        setShowFullLab(false); // Reset lab when changing patients
    }, [selectedCase?.id]);
    const [vitals, setVitals] = useState({ bp: '', heartRate: '', temp: '', spo2: '' });

    // Initial Fetch for Nurse
    useEffect(() => {
        if (user?.hospital_id) {
            fetchRequests(user.hospital_id);
        }
    }, [user?.hospital_id]);

    // Multi-tenant filtering ensuring safe access
    const myAssignments = requests.filter(r => r.assigned_nurse_id === user?.id && r.status !== 'COMPLETED');
    const assistancePings = requests.filter(r => r.hospital_id === user?.hospital_id && r.nurse_requested && !r.assigned_nurse_id && r.status !== 'COMPLETED');
    const myColleagues = doctors.filter(d => d.hospital_id === user?.hospital_id && d.id !== user?.id && d.role === 'nurse');

    // Auto-Close Case if it disappears (e.g. Completed by Doctor)
    useEffect(() => {
        if (selectedCase) {
            const stillActive = requests.find(r => r.id === selectedCase.id && r.status !== 'COMPLETED');
            if (stillActive) {
                // Update local data with fresh data (e.g. new doctor orders)
                setSelectedCase(stillActive);
            } else {
                // Case is gone or completed
                setSelectedCase(null);
            }
        }
    }, [requests, selectedCase?.id]);

    const handleConfirmMed = async (medIndex) => {
        if (!selectedCase) return;
        const updatedMeds = [...(selectedCase.medication_schedule || [])];
        if (!updatedMeds[medIndex]) return;

        updatedMeds[medIndex].confirmed = true;
        updatedMeds[medIndex].confirmed_at = new Date().toISOString();
        await confirmAdministration(selectedCase.id, updatedMeds);
        alert('Medication administration logged.');
    };

    const handleLogVitals = async () => {
        if (!selectedCase) return;
        await updateVitals(selectedCase.id, vitals);
        alert('Vitals synchronized to medical record.');
        setVitals({ bp: '', heartRate: '', temp: '', spo2: '' });
    };

    const handleViewHistory = async () => {
        if (!selectedCase) return;
        setShowHistory(true);
        setIsLoadingHistory(true);
        const history = await fetchPatientHistory(selectedCase.patient_id);
        setPatientHistory(history);
        setIsLoadingHistory(false);
    };

    return (
        <div className="nurse-dashboard fade-in">
            <style>{`
                .nurse-dashboard { padding: 1rem; color: var(--text-primary); }
                .care-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
                .assignment-list { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 20px; padding: 1.5rem; height: calc(100vh - 150px); overflow-y: auto; }
                .assignment-card { padding: 1.2rem; border-radius: 14px; background: var(--glass-highlight); margin-bottom: 1rem; cursor: pointer; border: 1px solid transparent; }
                .assignment-card:hover { border-color: var(--secondary); }
                .assignment-card.active { background: var(--secondary); border-color: rgba(255,255,255,0.2); color: white; }
                .workspace { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 24px; padding: 2.5rem; min-height: 650px; }
                .med-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-app); border: 1px solid var(--glass-border); border-radius: 12px; margin-bottom: 0.8rem; border-left: 4px solid var(--secondary); }
                .med-item.confirmed { opacity: 0.5; border-left-color: #22c55e; }
                .vitals-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
                .vital-input { background: var(--bg-app); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.8rem; color: var(--text-primary); outline: none; }
                .instructions-panel { background: rgba(var(--primary-rgb), 0.1); border: 1px solid var(--primary-glow-low); padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; }
            `}</style>

            <header className="portal-header" style={{ marginBottom: '2rem' }}>
                <h1 className="text-gradient">Care Execution Center</h1>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button className={`btn-secondary btn-xs ${activeTab === 'care' ? 'active' : ''}`} onClick={() => setActiveTab('care')}>Assigned Care</button>
                    <button className={`btn-secondary btn-xs ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Colleagues ({myColleagues.length})</button>
                    <button className={`btn-secondary btn-xs ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Identity Profile</button>
                </div>
            </header>

            {activeTab === 'profile' ? (
                <ProfessionalProfile profile={user} isOwner={true} showFeed={true} />
            ) : activeTab === 'team' ? (
                <div className="fade-in glass-card" style={{ padding: '2rem' }}>
                    <h3>Nursing Roster</h3>
                    <p style={{ opacity: 0.5, marginBottom: '2rem' }}>Online colleagues at {user?.hospital_name || 'this facility'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        {myColleagues.map(n => (
                            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                    {n.avatar_url ? <img src={n.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (n.name?.charAt(0) || 'N')}
                                </div>
                                <div style={{ fontSize: '0.9rem' }}>
                                    <div style={{ fontWeight: 700 }}>{n.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#4ade80' }}>● ONLINE</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="care-grid">
                    <aside className="assignment-list">
                        <h3>My Patients ({myAssignments.length})</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1.5rem' }}>Hands-on execution queue</p>
                        {myAssignments.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.3, marginTop: '4rem' }}>
                                <p>No care tasks assigned to your terminal.</p>
                            </div>
                        ) : (
                            myAssignments.map(c => (
                                <div
                                    key={c.id}
                                    className={`assignment-card ${selectedCase?.id === c.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCase(c)}
                                >
                                    <strong>{c.patient_name}</strong>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.4rem' }}>{c.urgency} • Ward {user?.clinical_department || 'A'}</div>
                                </div>
                            ))
                        )}
                    </aside>

                    <main className="workspace">
                        {selectedCase ? (
                            <div className="fade-in">
                                <div className="instructions-panel">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '1.5rem', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Patient Intake & History</h3>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>"{selectedCase.service_requested}"</p>
                                            <div style={{ margin: '1rem 0' }}>
                                                {selectedCase.file_url && (
                                                    <a href={selectedCase.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-xs" style={{ display: 'inline-block', marginRight: '0.5rem' }}>
                                                        📎 View Medical File
                                                    </a>
                                                )}
                                                {selectedCase.voice_url && (
                                                    <a href={selectedCase.voice_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-xs" style={{ display: 'inline-block' }}>
                                                        🎤 Listen to Recording
                                                    </a>
                                                )}

                                                <button className="btn-secondary btn-xs" onClick={handleViewHistory} style={{ display: 'inline-block', marginLeft: '0.5rem' }}>
                                                    📂 View Contextual History
                                                </button>
                                                <button
                                                    className="btn-primary btn-xs"
                                                    style={{ display: 'inline-block', marginLeft: '0.5rem', background: 'linear-gradient(45deg, #7c44ed, #ef4444)', border: 'none' }}
                                                    onClick={() => setShowFullLab(!showFullLab)}
                                                >
                                                    {showFullLab ? '📊 Back to Chart' : '🚀 Full 3D Analysis'}
                                                </button>
                                            </div>

                                            {showFullLab && (
                                                <div className="fade-in" style={{ marginTop: '2rem', borderTop: '2px solid var(--secondary)', paddingTop: '2rem' }}>
                                                    <BioAnatomyLab
                                                        patientId={selectedCase.patient_id}
                                                        patientName={selectedCase.patient_name}
                                                    />
                                                </div>
                                            )}

                                            <div style={{ margin: '1.5rem 0', borderBottom: '1px solid var(--glass-border)' }}></div>

                                            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Doctor's Orders</h3>
                                            <p style={{ fontSize: '1rem', fontWeight: 500 }}>{selectedCase.nurse_instructions || 'No specific instructions. Monitor vitals.'}</p>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.8rem' }}>Diagnosis: {selectedCase.diagnosis || 'Pending Assessment'}</div>

                                            {selectedCase.ai_conclusion && (
                                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(var(--primary-rgb), 0.1)', borderRadius: '10px', borderLeft: '3px solid var(--primary)' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.4rem' }}>AI CLINICAL SYNTHESIS</div>
                                                    <div style={{ fontSize: '0.85rem', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>{selectedCase.ai_conclusion}</div>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '15px', padding: '1rem' }}>
                                            <HumanoidVisualizer markers={selectedCase.ai_humanoid_markers || []} />
                                        </div>
                                    </div>

                                    {showHistory && (
                                        <div className="fade-in" style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--secondary)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h4 style={{ fontSize: '0.8rem' }}>PREVIOUS SESSIONS</h4>
                                                <button className="btn-secondary btn-xs" onClick={() => setShowHistory(false)}>Close</button>
                                            </div>
                                            {isLoadingHistory ? (
                                                <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>Retrieving history...</p>
                                            ) : patientHistory.length === 0 ? (
                                                <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>No previous records found.</p>
                                            ) : (
                                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                                    {patientHistory.map(h => (
                                                        <div key={h.id} style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                                                            <div style={{ fontWeight: 800 }}>{new Date(h.created_at).toLocaleDateString()}</div>
                                                            <div>{h.diagnosis}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h3>Medication Checklist</h3>
                                    <div style={{ marginTop: '1rem' }}>
                                        {(!selectedCase.medication_schedule || selectedCase.medication_schedule.length === 0) ? (
                                            <p style={{ opacity: 0.4 }}>No medications prescribed yet.</p>
                                        ) : (
                                            selectedCase.medication_schedule.map((m, i) => (
                                                <div key={i} className={`med-item ${m.confirmed ? 'confirmed' : ''}`}>
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{m.name}</div>
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Dose: {m.dose}</div>
                                                    </div>
                                                    {m.confirmed ? (
                                                        <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 800 }}>✓ ADMINISTERED</span>
                                                    ) : (
                                                        <button className="btn-secondary btn-xs" onClick={() => handleConfirmMed(i)}>Confirm Action</button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <h3>Vitals Monitoring</h3>
                                    <div className="vitals-form">
                                        <div className="field">
                                            <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.4rem' }}>BLOOD PRESSURE</label>
                                            <input className="vital-input" placeholder="120/80" value={vitals.bp} onChange={(e) => setVitals({ ...vitals, bp: e.target.value })} />
                                        </div>
                                        <div className="field">
                                            <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.4rem' }}>HEART RATE (BPM)</label>
                                            <input className="vital-input" placeholder="72" value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} />
                                        </div>
                                        <div className="field">
                                            <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.4rem' }}>TEMPERATURE (°C)</label>
                                            <input className="vital-input" placeholder="36.6" value={vitals.temp} onChange={(e) => setVitals({ ...vitals, temp: e.target.value })} />
                                        </div>
                                        <div className="field">
                                            <label style={{ fontSize: '0.7rem', opacity: 0.5, display: 'block', marginBottom: '0.4rem' }}>SPO2 (%)</label>
                                            <input className="vital-input" placeholder="98" value={vitals.spo2} onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })} />
                                        </div>
                                    </div>
                                    <button className="btn-primary w-full mt-1" onClick={handleLogVitals} style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)' }}>Sync Vitals to Brain</button>
                                </section>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', opacity: 1, marginTop: '2rem' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💉</div>
                                <h3>Nursing Execution Terminal</h3>
                                <p style={{ opacity: 0.5 }}>Select a patient to begin clinical intervention.</p>
                                {assistancePings.length > 0 && (
                                    <div className="fade-in" style={{ marginTop: '3rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1.5rem' }}>🆘 URGENT ASSISTANCE REQUESTS</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {assistancePings.map(p => (
                                                <div key={p.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444', textAlign: 'left', background: 'rgba(239, 68, 68, 0.05)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <strong>{p.patient_name}</strong>
                                                        <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{p.urgency}</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>Note: {p.nurse_request_note || 'Immediate help needed at bedside.'}</p>
                                                    <div style={{ fontSize: '0.7rem', marginTop: '0.5rem', opacity: 0.4 }}>Awaiting Coordinator assignment...</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
};

export default NurseDashboard;
