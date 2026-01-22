import React, { useState, useMemo } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';

const NurseVisitDashboard = () => {
    const { requests, savePatientIntake, fetchPatientHistory, loading } = useClinical();
    const { user } = useAuth();
    const [activeStatus, setActiveStatus] = useState('PENDING_SECRETARY');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [intakeTab, setIntakeTab] = useState('vital');
    const [showTriageList, setShowTriageList] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [intakeData, setIntakeData] = useState({
        vitals: {
            weight: '', height: '', systolic: '', diastolic: '', temp: '',
            respRate: '', heartRate: '', spo2: '', bloodSugarF: '', bloodSugarR: '',
            urineOutput: '', oxygenSupp: '', intake: '', output: '',
            avpu: '', trauma: '', mobility: '', comment: '',
            triageColor: '', // NEW
            takenTime: new Date().toISOString()
        },
        allergies: []
    });

    const filteredRequests = useMemo(() => {
        return requests.filter(r => r.hospital_id === user?.hospital_id && r.status === activeStatus);
    }, [requests, user?.hospital_id, activeStatus]);

    const handleOpenIntake = async (req) => {
        setSelectedRequest(req);
        setIntakeData({
            vitals: req.vitals_data || { ...intakeData.vitals, takenTime: new Date().toISOString() },
            allergies: req.allergies_data || []
        });

        if (req.patient_id) {
            const history = await fetchPatientHistory(req.patient_id);
            setPatientHistory(history || []);
        }
    };

    const handleSaveIntake = async () => {
        try {
            await savePatientIntake(selectedRequest.id, intakeData);
            if (selectedRequest.patient_id) {
                const history = await fetchPatientHistory(selectedRequest.patient_id);
                setPatientHistory(history || []);
            }
            setSelectedRequest(null);
        } catch (err) {
            alert("Error saving: " + err.message);
        }
    };

    const handleAddAllergy = () => {
        setIntakeData(prev => ({
            ...prev,
            allergies: [...prev.allergies, { type: '', allergen: '', reaction: '' }]
        }));
    };

    return (
        <div className="visit-dashboard fade-in">
            <style>{`
                .visit-filter-bar { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 8px; padding: 1rem; display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: flex-end; }
                .filter-item { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
                .filter-item label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); }
                
                .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
                .status-tab { padding: 0.6rem 1.25rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; border: 1px solid var(--glass-border); background: var(--bg-surface); transition: 0.2s; position: relative; }
                .status-tab.active { border-color: transparent; color: white; }
                .status-tab.active.new { background: #0ea5e9; }
                .status-tab.active.nurse { background: #f97316; }
                .status-tab.active.doctor { background: #10b981; }
                .tab-count { margin-left: 0.5rem; opacity: 0.8; font-weight: 400; }

                .visit-table-container { background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden; }
                .visit-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
                .visit-table th { background: #f1f5f9; padding: 0.75rem; text-align: left; color: var(--text-muted); border-bottom: 1px solid var(--glass-border); }
                .visit-table td { padding: 0.75rem; border-bottom: 1px solid var(--glass-border); color: var(--text-primary); }
                .visit-table tr:hover { background: rgba(0,0,0,0.02); }

                .action-icon { cursor: pointer; color: var(--primary); font-size: 1rem; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; transition: 0.2s; }
                .action-icon:hover { background: var(--glass-highlight); }

                /* Intake Modal Styles */
                .intake-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 2rem; }
                .intake-modal { background: #f8fafc; width: 100%; max-width: 1200px; height: 90vh; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--shadow-main); }
                .intake-header { background: #075985; color: white; padding: 0.75rem 1.5rem; display: flex; justify-content: space-between; align-items: center; font-weight: 700; }
                
                .intake-nav { background: #0ea5e9; display: flex; divide-x: 1px solid rgba(255,255,255,0.2); }
                .intake-nav-item { padding: 0.75rem 1.5rem; color: white; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; cursor: pointer; letter-spacing: 0.5px; opacity: 0.8; }
                .intake-nav-item.active { background: white; color: #0ea5e9; opacity: 1; }

                .intake-body { flex: 1; display: grid; grid-template-columns: 220px 1fr; overflow: hidden; }
                .intake-sidebar { background: #f1f5f9; border-right: 1px solid var(--glass-border); padding: 0.5rem; }
                .sidebar-item { padding: 0.6rem 1rem; font-size: 0.75rem; font-weight: 600; color: #475569; border-radius: 4px; cursor: pointer; margin-bottom: 2px; }
                .sidebar-item:hover { background: #e2e8f0; }
                .sidebar-item.active { background: #0ea5e9; color: white; }

                .intake-content { padding: 1.5rem; overflow-y: auto; background: white; flex: 1; }
                .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .form-field { display: flex; flex-direction: column; gap: 0.3rem; }
                .form-field label { font-size: 0.7rem; font-weight: 600; color: #64748b; }
                .form-input { border: 1px solid #cbd5e1; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; outline: none; }
                .form-input:focus { border-color: #0ea5e9; }

                /* Triage Table */
                .triage-table { width: 100%; border-collapse: collapse; font-size: 0.65rem; border: 1px solid #e2e8f0; margin-top: 1rem; }
                .triage-table th, .triage-table td { border: 1px solid #e2e8f0; padding: 0.5rem; text-align: center; }
                .triage-red { background: #ef4444; color: white; }
                .triage-orange { background: #f97316; color: white; }
                .triage-yellow { background: #eab308; color: black; }
                .triage-green { background: #22c55e; color: white; }
                .triage-blue { background: #3b82f6; color: white; }

                .triage-selector { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
                .triage-color-btn { width: 30px; height: 30px; border-radius: 4px; border: 2px solid transparent; cursor: pointer; transition: 0.2s; }
                .triage-color-btn.active { transform: scale(1.1); border-color: #0c4a6e; }

                .history-table { width: 100%; margin-top: 2rem; border-collapse: collapse; font-size: 0.65rem; }
                .history-table th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 0.5rem; text-align: left; }
                .history-table td { border-bottom: 1px solid #f1f5f9; padding: 0.5rem; }
            `}</style>

            <div className="status-tabs">
                <div className={`status-tab new ${activeStatus === 'PENDING_SECRETARY' ? 'active' : ''}`} onClick={() => setActiveStatus('PENDING_SECRETARY')}>
                    New Patient <span className="tab-count">({requests.filter(r => r.status === 'PENDING_SECRETARY').length})</span>
                </div>
                <div className={`status-tab nurse ${activeStatus === 'NURSE_SEEN' ? 'active' : ''}`} onClick={() => setActiveStatus('NURSE_SEEN')}>
                    Nurse Seen <span className="tab-count">({requests.filter(r => r.status === 'NURSE_SEEN').length})</span>
                </div>
                <div className={`status-tab doctor ${activeStatus === 'ROUTED_TO_DOCTOR' ? 'active' : ''}`} onClick={() => setActiveStatus('ROUTED_TO_DOCTOR')}>
                    Doctor Seen <span className="tab-count">({requests.filter(r => r.status === 'ROUTED_TO_DOCTOR').length})</span>
                </div>
            </div>

            <div className="visit-filter-bar">
                <div className="filter-item"><label>Patient Search</label><input className="search-field" placeholder="Search..." /></div>
                <div className="filter-item"><label>Doctor</label><select className="search-field"><option>All</option></select></div>
                <div className="filter-item"><label>Clinic</label><select className="search-field"><option>All</option></select></div>
                <div className="filter-item"><label>Patient Type</label><select className="search-field"><option>Out Patient</option></select></div>
            </div>

            <div className="visit-table-container">
                <table className="visit-table">
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>Visit No.</th>
                            <th>Date & Time</th>
                            <th>Clinic/Doctor</th>
                            <th>UHID</th>
                            <th>Patient Name</th>
                            <th>Age</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map((req, idx) => (
                            <tr key={req.id}>
                                <td>{idx + 1}</td>
                                <td>{req.id.slice(-6).toUpperCase()}</td>
                                <td>{new Date(req.created_at).toLocaleString()}</td>
                                <td>General Medicine</td>
                                <td>{req.patient_id?.slice(-8) || 'SHH-001'}</td>
                                <td style={{ fontWeight: 700 }}>{req.patient_name}</td>
                                <td>34Y / M</td>
                                <td>{req.status}</td>
                                <td align="center">
                                    <div className="action-icon" onClick={() => handleOpenIntake(req)}>📝</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedRequest && (
                <div className="intake-modal-overlay">
                    <div className="intake-modal">
                        <div className="intake-header">
                            <div>Clinical Intake • {selectedRequest.patient_name}</div>
                            <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>
                        <div className="intake-nav">
                            <div className="intake-nav-item">Medical Records</div>
                            <div className="intake-nav-item">Package</div>
                            <div className="intake-nav-item active">Consultation</div>
                            <div className="intake-nav-item">Vaccination</div>
                        </div>
                        <div className="intake-body">
                            <div className="intake-sidebar">
                                <div className={`sidebar-item ${intakeTab === 'vital' ? 'active' : ''}`} onClick={() => setIntakeTab('vital')}>Vital Sign</div>
                                <div className={`sidebar-item ${intakeTab === 'allergies' ? 'active' : ''}`} onClick={() => setIntakeTab('allergies')}>Allergies</div>
                                <div className="sidebar-item">Current Medication</div>
                                <div className="sidebar-item">Diagnosis</div>
                                <div className="sidebar-item">Prescription Medicine</div>
                            </div>
                            <div className="intake-content">
                                {intakeTab === 'vital' && (
                                    <div className="fade-in">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', color: '#075985' }}>Vital Signs Entry</h3>
                                            <button className="btn-secondary btn-xs" onClick={() => setShowTriageList(true)}>📊 Triage Guide</button>
                                        </div>
                                        <div className="form-grid">
                                            <div className="form-field"><label>Weight (Kg)</label><input className="form-input" type="number" value={intakeData.vitals.weight} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, weight: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Height (cm)</label><input className="form-input" type="number" value={intakeData.vitals.height} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, height: e.target.value } }))} /></div>
                                            <div className="form-field"><label>BMI (Automatic)</label><input className="form-input" disabled value={intakeData.vitals.weight && intakeData.vitals.height ? (intakeData.vitals.weight / ((intakeData.vitals.height / 100) ** 2)).toFixed(1) : ''} /></div>

                                            <div className="form-field"><label>Systolic B.P.</label><input className="form-input" value={intakeData.vitals.systolic} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, systolic: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Diastolic B.P.</label><input className="form-input" value={intakeData.vitals.diastolic} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, diastolic: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Temperature (°C)</label><input className="form-input" value={intakeData.vitals.temp} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, temp: e.target.value } }))} /></div>

                                            <div className="form-field"><label>Respiratory Rate (/Min)</label><input className="form-input" value={intakeData.vitals.respRate} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, respRate: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Heart Rate (BPM)</label><input className="form-input" value={intakeData.vitals.heartRate} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, heartRate: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Urine Output</label><input className="form-input" value={intakeData.vitals.urineOutput} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, urineOutput: e.target.value } }))} /></div>

                                            <div className="form-field"><label>Blood Sugar(F)</label><input className="form-input" value={intakeData.vitals.bloodSugarF} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, bloodSugarF: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Blood Sugar(R)</label><input className="form-input" value={intakeData.vitals.bloodSugarR} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, bloodSugarR: e.target.value } }))} /></div>
                                            <div className="form-field"><label>SPO2 %</label><input className="form-input" value={intakeData.vitals.spo2} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, spo2: e.target.value } }))} /></div>

                                            <div className="form-field">
                                                <label>AVPU</label>
                                                <select className="form-input" value={intakeData.vitals.avpu} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, avpu: e.target.value } }))}>
                                                    <option value="">Select</option>
                                                    <option>Alert</option>
                                                    <option>Voice</option>
                                                    <option>Pain</option>
                                                    <option>Unresponsive</option>
                                                </select>
                                            </div>
                                            <div className="form-field">
                                                <label>Trauma</label>
                                                <select className="form-input" value={intakeData.vitals.trauma} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, trauma: e.target.value } }))}>
                                                    <option value="">Select</option>
                                                    <option>None</option>
                                                    <option>Blunt</option>
                                                    <option>Penetrating</option>
                                                </select>
                                            </div>
                                            <div className="form-field">
                                                <label>Mobility</label>
                                                <select className="form-input" value={intakeData.vitals.mobility} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, mobility: e.target.value } }))}>
                                                    <option value="">Select</option>
                                                    <option>Fully Mobile</option>
                                                    <option>Needs Assist</option>
                                                    <option>Bed Bound</option>
                                                </select>
                                            </div>

                                            <div className="form-field">
                                                <label>Oxygen Supplementation</label>
                                                <select className="form-input" value={intakeData.vitals.oxygenSupp} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, oxygenSupp: e.target.value } }))}>
                                                    <option value="">Select</option>
                                                    <option>None</option>
                                                    <option>Nasal Cannula</option>
                                                    <option>Face Mask</option>
                                                </select>
                                            </div>
                                            <div className="form-field"><label>Intake</label><input className="form-input" value={intakeData.vitals.intake} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, intake: e.target.value } }))} /></div>
                                            <div className="form-field"><label>Output</label><input className="form-input" value={intakeData.vitals.output} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, output: e.target.value } }))} /></div>

                                            <div className="form-field" style={{ gridColumn: 'span 3' }}>
                                                <label>Case Triage Color (Urgency)</label>
                                                <div className="triage-selector">
                                                    {['RED', 'ORANGE', 'YELLOW', 'GREEN', 'BLUE'].map(color => (
                                                        <button
                                                            key={color}
                                                            className={`triage-color-btn triage-${color.toLowerCase()} ${intakeData.vitals.triageColor === color ? 'active' : ''}`}
                                                            onClick={() => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, triageColor: color } }))}
                                                            title={color}
                                                        />
                                                    ))}
                                                    <span style={{ fontSize: '0.8rem', alignSelf: 'center', fontWeight: 600, color: '#075985' }}>{intakeData.vitals.triageColor || '--'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1rem' }}>
                                            <div className="form-field"><label>Nurse Comments</label><textarea className="form-input" style={{ minHeight: '60px' }} value={intakeData.vitals.comment} onChange={e => setIntakeData(p => ({ ...p, vitals: { ...p.vitals, comment: e.target.value } }))}></textarea></div>
                                        </div>

                                        <div className="current-vitals-section" style={{ marginTop: '2rem' }}>
                                            <h4 style={{ fontSize: '0.8rem', color: '#075985', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.3rem' }}>Current Vitals History</h4>
                                            <table className="history-table">
                                                <thead>
                                                    <tr>
                                                        <th>Select</th>
                                                        <th>Date & Time</th>
                                                        <th>Taken Time</th>
                                                        <th>SBP</th>
                                                        <th>DBP</th>
                                                        <th>Temp.</th>
                                                        <th>RR</th>
                                                        <th>HR</th>
                                                        <th>SPO2</th>
                                                        <th>AVPU</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {patientHistory.filter(h => h.vitals_data).map((hist, i) => (
                                                        <tr key={i}>
                                                            <td><button onClick={() => setIntakeData(p => ({ ...p, vitals: hist.vitals_data }))} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>👆</button></td>
                                                            <td>{new Date(hist.created_at).toLocaleDateString()}</td>
                                                            <td>{hist.vitals_data?.takenTime ? new Date(hist.vitals_data.takenTime).toLocaleTimeString() : '-'}</td>
                                                            <td>{hist.vitals_data?.systolic || '-'}</td>
                                                            <td>{hist.vitals_data?.diastolic || '-'}</td>
                                                            <td>{hist.vitals_data?.temp || '-'}</td>
                                                            <td>{hist.vitals_data?.respRate || '-'}</td>
                                                            <td>{hist.vitals_data?.heartRate || '-'}</td>
                                                            <td>{hist.vitals_data?.spo2 || '-'}</td>
                                                            <td>{hist.vitals_data?.avpu || '-'}</td>
                                                        </tr>
                                                    ))}
                                                    {patientHistory.filter(h => h.vitals_data).length === 0 && (
                                                        <tr>
                                                            <td colSpan="10" style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No historical records found.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {intakeTab === 'allergies' && (
                                    <div className="fade-in">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: '1rem', color: '#075985' }}>Allergies Entry</h3>
                                            <button className="btn-secondary btn-sm" onClick={handleAddAllergy}>+ Add Allergy</button>
                                        </div>
                                        <div className="visit-table-container">
                                            <table className="visit-table">
                                                <thead>
                                                    <tr>
                                                        <th>Allergy Type</th>
                                                        <th>Allergen</th>
                                                        <th>Reaction</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {intakeData.allergies.map((al, i) => (
                                                        <tr key={i}>
                                                            <td>
                                                                <select className="form-input" value={al.type} onChange={e => {
                                                                    const newList = [...intakeData.allergies];
                                                                    newList[i].type = e.target.value;
                                                                    setIntakeData(p => ({ ...p, allergies: newList }));
                                                                }}>
                                                                    <option value="">Select</option>
                                                                    <option>Drug Allergy</option>
                                                                    <option>Food Allergy</option>
                                                                    <option>Environmental</option>
                                                                </select>
                                                            </td>
                                                            <td><input className="form-input" value={al.allergen} onChange={e => {
                                                                const newList = [...intakeData.allergies];
                                                                newList[i].allergen = e.target.value;
                                                                setIntakeData(p => ({ ...p, allergies: newList }));
                                                            }} /></td>
                                                            <td><input className="form-input" value={al.reaction} onChange={e => {
                                                                const newList = [...intakeData.allergies];
                                                                newList[i].reaction = e.target.value;
                                                                setIntakeData(p => ({ ...p, allergies: newList }));
                                                            }} /></td>
                                                            <td><button onClick={() => setIntakeData(p => ({ ...p, allergies: p.allergies.filter((_, idx) => idx !== i) }))}>🗑️</button></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '1rem 2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0' }}>
                            <button className="btn-secondary" onClick={() => setSelectedRequest(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSaveIntake} disabled={loading}>
                                {loading ? 'Saving...' : 'Release to Doctor'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTriageList && (
                <div className="intake-modal-overlay" onClick={() => setShowTriageList(false)}>
                    <div className="intake-modal" style={{ height: 'auto', maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div className="intake-header" style={{ background: '#3b82f6' }}>
                            <div>Triage Color Discriminator List</div>
                            <button onClick={() => setShowTriageList(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <table className="triage-table">
                                <thead>
                                    <tr>
                                        <th>COLOUR</th>
                                        <th className="triage-red">RED</th>
                                        <th className="triage-orange">ORANGE</th>
                                        <th className="triage-yellow">YELLOW</th>
                                        <th className="triage-green">GREEN</th>
                                        <th className="triage-blue">BLUE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>TEWS</strong></td>
                                        <td>7 or more</td>
                                        <td>5 - 6</td>
                                        <td>3 - 4</td>
                                        <td>0 - 2</td>
                                        <td>DEAD</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Target Time</strong></td>
                                        <td>Immediate</td>
                                        <td>&lt; 10 mins</td>
                                        <td>&lt; 60 mins</td>
                                        <td>&lt; 240 mins</td>
                                        <td>-</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Symptoms</strong></td>
                                        <td>Drooling, Seizure</td>
                                        <td>Shortness of breath, Stridor</td>
                                        <td>Haemorrhage Controlled</td>
                                        <td>Minor Injuries</td>
                                        <td>Dead on Arrival</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NurseVisitDashboard;
