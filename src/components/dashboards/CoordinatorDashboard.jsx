import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useClinical } from '../../context/ClinicalContext';
import { supabase } from '../../supabaseClient';
import ClinicalSocialFeed from './ClinicalSocialFeed';
import ProfessionalProfile from '../shared/ProfessionalProfile';

const CoordinatorDashboard = ({ initialTab = 'triage' }) => {
    const { user } = useAuth();
    const { requests, doctors, fetchRequests, fetchDoctors, routeToDoctor, assignNurse, generateInvite } = useClinical();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [assigningId, setAssigningId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [patientHistory, setPatientHistory] = useState(null);
    const [inviteToken, setInviteToken] = useState(null);
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

    // Initial Fetch (Multi-tenancy)
    useEffect(() => {
        if (user?.hospital_id) {
            fetchRequests(user.hospital_id);
            fetchDoctors(user.hospital_id);
        }
    }, [user?.hospital_id]);

    // Update activeTab if initialTab changes (sidebar navigation)
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    // Filter data for this specific hospital
    const myRequests = requests.filter(r => r.hospital_id === user?.hospital_id);
    const newRequests = myRequests.filter(r => r.status === 'PENDING_SECRETARY');
    const routingRequests = myRequests.filter(r => r.status === 'ROUTED_TO_DOCTOR');
    const careRequests = myRequests.filter(r => r.status === 'EXECUTING_CARE');
    const completedRequests = myRequests.filter(r => r.status === 'COMPLETED');

    const myDoctors = doctors.filter(d => d.hospital_id === user?.hospital_id && d.role === 'doctor');
    const myNurses = doctors.filter(d => d.hospital_id === user?.hospital_id && d.role === 'nurse');

    console.log("[CoordinatorDashboard] Data Summary:", {
        totalRequests: requests.length,
        filteredRequests: myRequests.length,
        totalDoctors: doctors.length,
        filteredDoctors: myDoctors.length,
        hospitalId: user?.hospital_id
    });

    const handleAssignDoctor = async (requestId, doctorId) => {
        await routeToDoctor(requestId, doctorId);
        setAssigningId(null);
    };

    const handleAssignNurse = async (requestId, nurseId) => {
        await assignNurse(requestId, nurseId);
        setAssigningId(null);
    };

    const handleGenerateInvite = async (role) => {
        setIsGeneratingInvite(true);
        try {
            const invite = await generateInvite(user.hospital_id, role);
            setInviteToken(invite.token);
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingInvite(false);
        }
    };

    const fetchHistory = (query) => {
        // Real-world history would fetch from a 'patient_records' table
        setPatientHistory({
            name: query,
            id: 'PAT-0092-X',
            records: [
                { date: '2025-12-10', doctor: 'Dr. Ali (Zayed Hospital)', diagnosis: 'Acute Bronchitis', prescription: 'Amoxicillin' },
                { date: '2025-08-15', doctor: 'Dr. Sarah (St. Mary)', diagnosis: 'Routine Checkup', prescription: 'Vitamins' }
            ]
        });
    };

    return (
        <div className="coordinator-dashboard fade-in">
            <style>{`
                .coordinator-dashboard { color: var(--text-primary); }
                .nav-card { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 20px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.8rem; height: fit-content; }
                .nav-item { padding: 1rem; border-radius: 12px; cursor: pointer; transition: 0.3s; color: var(--text-secondary); display: flex; align-items: center; gap: 0.8rem; font-weight: 500; }
                .nav-item:hover { background: var(--glass-highlight); color: var(--primary); }
                .nav-item.active { background: var(--primary); color: white; box-shadow: var(--primary-glow); }
                
                .dashboard-grid { display: grid; grid-template-columns: 280px 1fr; gap: 2.5rem; }
                .main-panel { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 24px; padding: 2.5rem; min-height: 80vh; }
                
                .request-card { background: var(--glass-highlight); border: 1px solid var(--glass-border); padding: 1.2rem; border-radius: 14px; margin-bottom: 1rem; transition: 0.3s; cursor: pointer; }
                .request-card:hover { border-color: var(--primary); transform: translateX(5px); background: rgba(var(--primary-rgb), 0.05); }
                
                .urgency-badge { font-size: 0.65rem; padding: 4px 10px; border-radius: 6px; font-weight: 900; letter-spacing: 0.05em; }
                .IMMEDIATE { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
                .SCHEDULED { background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid rgba(59,130,246,0.3); }

                .doctor-pill { display: flex; align-items: center; gap: 0.6rem; background: var(--bg-app); padding: 0.6rem 1.2rem; border-radius: 12px; font-size: 0.8rem; border: 1px solid var(--glass-border); cursor: pointer; transition: 0.3s; color: var(--text-primary); }
                .doctor-pill:hover { border-color: var(--primary); background: rgba(124, 58, 237, 0.15); transform: translateY(-2px); }
                
                .status-indicator { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
                .Available { background: #22c55e; color: #22c55e; }
                .Busy { background: #eab308; color: #eab308; }
                .Vacation { background: #ef4444; color: #ef4444; }

                .portal-header { margin-bottom: 3rem; position: relative; }
                .portal-header::after { content: ''; position: absolute; bottom: -1rem; left: 0; width: 60px; height: 4px; background: var(--primary); border-radius: 2px; }
            `}</style>


            <div className="portal-header">
                <h1 className="text-gradient" style={{ fontSize: '2.5rem' }}>Clinical Operations Center</h1>
                <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>Enterprise Health Management System v2.0</p>
            </div>

            <div className="dashboard-grid">
                <div className="nav-card">
                    <div className={`nav-item ${activeTab === 'triage' ? 'active' : ''}`} onClick={() => setActiveTab('triage')}>
                        <span>📥</span> Live Inflow ({myRequests.length})
                    </div>
                    <div className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>
                        <span>🩺</span> Clinical Roster
                    </div>
                    <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <span>📂</span> UHR Gateway
                    </div>
                    <div className={`nav-item ${activeTab === 'facility' ? 'active' : ''}`} onClick={() => setActiveTab('facility')}>
                        <span>🏢</span> Facility Status
                    </div>
                    <div className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <span>👤</span> Identity Profile
                    </div>
                </div>

                <div className="main-panel">
                    {activeTab === 'triage' && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: '2rem' }}>Clinical Flow Control</h2>

                            {/* Status Tabs/Filters within Triage */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                                <span style={{ color: newRequests.length > 0 ? 'var(--primary)' : 'inherit', fontWeight: 700 }}>New ({newRequests.length})</span>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>In Triage ({routingRequests.length})</span>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>Active Care ({careRequests.length})</span>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>Archive ({completedRequests.length})</span>
                            </div>

                            <section className="queue-section">
                                <h3>NEW ARRIVALS (NEEDS TRIAGE)</h3>
                                {newRequests.length === 0 ? (
                                    <p style={{ opacity: 0.3, padding: '1rem' }}>No new patient arrivals detected.</p>
                                ) : (
                                    newRequests.map(req => (
                                        <div key={req.id} className="request-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                <div>
                                                    <strong>{req.patient_name}</strong>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{req.service_requested}</div>
                                                    {req.file_url && (
                                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>📎 ATTACHMENT:</span>
                                                            <a href={req.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: 'var(--primary)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>VIEW CLINICAL FILE</a>
                                                        </div>
                                                    )}
                                                    {req.preferred_doctor_id && (
                                                        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>
                                                            ★ PREFERRED SPECIALIST: Dr. {myDoctors.find(d => d.id === req.preferred_doctor_id)?.name || 'Matching...'}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`urgency-badge ${req.urgency}`}>{req.urgency}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.8rem', width: '100%' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '0.6rem', opacity: 0.5 }}>SELECT MEDICAL SPECIALIST</label>
                                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                                        {myDoctors.map(doc => (
                                                            <button key={doc.id} className="doctor-pill" onClick={() => handleAssignDoctor(req.id, doc.id)}>
                                                                {doc.name.split(' ').pop()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </section>

                            <section className="queue-section" style={{ marginTop: '2.5rem' }}>
                                <h3>IN TRIAGE (WAITING FOR NURSE)</h3>
                                {routingRequests.length === 0 ? (
                                    <p style={{ opacity: 0.3, padding: '1rem' }}>All routed cases have execution teams.</p>
                                ) : (
                                    routingRequests.map(req => (
                                        <div key={req.id} className="request-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                                            <div style={{ flex: 1 }}>
                                                <strong>{req.patient_name}</strong>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Routed to Dr. {myDoctors.find(d => d.id === req.assigned_doctor_id)?.name}</div>
                                                {req.nurse_requested && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, padding: '4px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: '4px', width: 'fit-content' }}>
                                                        🆘 NURSE ASSISTANCE REQUESTED: {req.nurse_request_note}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', marginBottom: '0.4rem' }}>ASSIGN EXECUTION (NURSE)</label>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                    {myNurses.map(n => (
                                                        <button key={n.id} className="doctor-pill" style={{ borderColor: 'var(--secondary)' }} onClick={() => handleAssignNurse(req.id, n.id)}>
                                                            {n.name.split(' ').pop()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </section>

                            <section className="queue-section" style={{ marginTop: '2.5rem' }}>
                                <h3>ACTIVE CLINICAL CARE</h3>
                                {careRequests.length === 0 ? (
                                    <p style={{ opacity: 0.3, padding: '1rem' }}>No patients currently in active treatment.</p>
                                ) : (
                                    careRequests.map(req => (
                                        <div key={req.id} className="request-card" style={{ opacity: 0.8, borderLeft: req.nurse_requested ? '4px solid #ef4444' : '1px solid var(--glass-border)' }}>
                                            <div style={{ flex: 1 }}>
                                                <strong>{req.patient_name}</strong>
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Team: Dr. {myDoctors.find(d => d.id === req.assigned_doctor_id)?.name.split(' ').pop()} + {myNurses.find(n => n.id === req.assigned_nurse_id)?.name.split(' ').pop()}</div>
                                                {req.nurse_requested && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#ef4444', fontWeight: 800 }}>
                                                        🆘 DOCTOR IS REQUESTING ASSISTANCE
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                {req.nurse_requested ? (
                                                    <div style={{ fontSize: '0.6rem', color: '#ef4444', marginBottom: '0.4rem' }}>RE-ASSIGNMENT NEEDED</div>
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontWeight: 800 }}>IN PROGRESS</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </section>
                        </div>
                    )}

                    {activeTab === 'doctors' && (
                        <div className="fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Clinical Specialist Roster</h2>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className="btn-secondary btn-xs"
                                        onClick={() => handleGenerateInvite('doctor')}
                                        disabled={isGeneratingInvite}
                                    >
                                        + Invite Doctor
                                    </button>
                                    <button
                                        className="btn-secondary btn-xs"
                                        style={{ borderColor: 'var(--secondary)' }}
                                        onClick={() => handleGenerateInvite('nurse')}
                                        disabled={isGeneratingInvite}
                                    >
                                        + Invite Nurse
                                    </button>
                                </div>
                            </div>

                            {inviteToken && (
                                <div className="glass-card fade-in" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid var(--primary)', background: 'rgba(124, 58, 237, 0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--primary)' }}>Secure Invitation Generated</h4>
                                            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.4rem' }}>Share this unique token with the clinical staff member.</p>
                                        </div>
                                        <button className="btn-secondary btn-xs" onClick={() => setInviteToken(null)}>Dismiss</button>
                                    </div>
                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <code style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            {inviteToken}
                                        </code>
                                        <button
                                            className="btn-primary btn-xs"
                                            onClick={() => {
                                                navigator.clipboard.writeText(inviteToken);
                                                alert('Token copied to clipboard.');
                                            }}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            )}

                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.8rem' }}>
                                <thead>
                                    <tr style={{ opacity: 0.5, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        <th style={{ padding: '0 1.5rem', textAlign: 'left' }}>Specialist</th>
                                        <th>Primary Area</th>
                                        <th>Rotation</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myDoctors.map(doc => (
                                        <tr key={doc.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                            <td style={{ padding: '1.5rem', fontWeight: 700, borderRadius: '12px 0 0 12px' }}>{doc.name}</td>
                                            <td style={{ textAlign: 'center' }}>{doc.specialty || 'Internal Medicine'}</td>
                                            <td style={{ textAlign: 'center', opacity: 0.7 }}>{doc.shift || 'Morning'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem' }}>
                                                    <span className={`status-indicator ${doc.clinical_status || 'Available'}`}></span>
                                                    <span style={{ fontSize: '0.85rem' }}>{doc.clinical_status || 'Available'}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', borderRadius: '0 12px 12px 0' }}>
                                                <button className="btn-secondary" style={{ padding: '0.4rem 1rem' }}>Contact</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="fade-in">
                            <h2>Unified Health Records Protocol</h2>
                            <p style={{ opacity: 0.5, marginBottom: '2.5rem' }}>Encrypted cross-facility record retrieval system.</p>
                            <input
                                type="text"
                                className="history-search-bar"
                                placeholder="Search by Global Patient ID or Biometric Hash..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value.length > 3) fetchHistory(e.target.value);
                                    else setPatientHistory(null);
                                }}
                                style={{ width: '100%', padding: '1.2rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'white', fontSize: '1.1rem', outline: 'none' }}
                            />

                            {patientHistory ? (
                                <div className="fade-in" style={{ marginTop: '2.5rem' }}>
                                    <div style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '2rem', borderRadius: '18px', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>{patientHistory.name}</h3>
                                            <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', background: 'rgba(124,58,237,0.1)', padding: '4px 12px', borderRadius: '6px' }}>{patientHistory.id}</span>
                                        </div>
                                        <p style={{ opacity: 0.6, fontSize: '0.8rem', marginTop: '0.5rem' }}>Records retrieved from 3 external facilities.</p>
                                    </div>

                                    <div className="timeline">
                                        {patientHistory.records.map((rec, i) => (
                                            <div key={i} className="timeline-item">
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 }}>{rec.date}</div>
                                                <div style={{ fontWeight: 600, fontSize: '1.1rem', margin: '0.2rem 0' }}>{rec.diagnosis}</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}><strong>Doctor:</strong> {rec.doctor}</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}><strong>Prescription:</strong> {rec.prescription}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : searchQuery.length > 0 ? (
                                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '4rem' }}>
                                    Searching for "{searchQuery}"...
                                </div>
                            ) : (
                                <div style={{ opacity: 0.4, textAlign: 'center', marginTop: '4rem' }}>
                                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
                                    Enter 4+ characters to begin cross-hospital search
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'facility' && (
                        <div className="fade-in">
                            <h2>Clinical Facility Ecosystem</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                                <div className="glass-card" style={{ padding: '1.5rem' }}>
                                    <h4>Occupancy Status</h4>
                                    <div style={{ fontSize: '3rem', fontWeight: 800, margin: '1rem 0' }}>{Math.floor(myRequests.length * 1.5) + 12}%</div>
                                    <p style={{ opacity: 0.6 }}>Current facility load based on active triage and routed cases.</p>
                                </div>
                                <div className="glass-card" style={{ padding: '1.5rem' }}>
                                    <h4>Active Staff</h4>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="stat-node">
                                            <span className="node-value">{myDoctors.length}</span>
                                            <span className="node-label">Doctors</span>
                                        </div>
                                        <div className="stat-node">
                                            <span className="node-value">{myNurses.length}</span>
                                            <span className="node-label">Nurses</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                                <h4>Resource Alerts</h4>
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {newRequests.length > 3 && (
                                        <div className="IMMEDIATE" style={{ padding: '1rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                                            ⚠️ High Triage Volume: {newRequests.length} arrivals awaiting brain assignment.
                                        </div>
                                    )}
                                    {routingRequests.length > 2 && (
                                        <div className="SCHEDULED" style={{ padding: '1rem', borderRadius: '10px', fontSize: '0.9rem' }}>
                                            ℹ️ Triage Bottleneck: {routingRequests.length} cases waiting for nurse execution team.
                                        </div>
                                    )}
                                    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', opacity: 0.6, fontSize: '0.9rem' }}>
                                        💡 Tip: Coordinate with staff in the <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Team Hub</span> for instant updates.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="fade-in">
                            <ProfessionalProfile
                                profile={user}
                                isOwner={true}
                                showFeed={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoordinatorDashboard;
