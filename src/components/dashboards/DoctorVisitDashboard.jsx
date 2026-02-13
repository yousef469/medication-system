import React, { useState, useMemo } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';
import DoctorConsultation from './DoctorConsultation';

const DoctorVisitDashboard = () => {
    const { requests, acknowledgeVisit, loading } = useClinical();
    const { user } = useAuth();
    const [activeStatus, setActiveStatus] = useState('NURSE_SEEN');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredRequests = useMemo(() => {
        return requests.filter(r =>
            r.hospital_id === user?.hospital_id &&
            (activeStatus === 'ALL' || r.status === activeStatus) &&
            (r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm))
        );
    }, [requests, user?.hospital_id, activeStatus, searchTerm]);

    const handleAcknowledge = async (req) => {
        try {
            await acknowledgeVisit(req.id);
            setSelectedRequest(req);
        } catch (err) {
            alert("Acknowledgement Failed: " + err.message);
        }
    };

    if (selectedRequest) {
        return <DoctorConsultation request={selectedRequest} onBack={() => setSelectedRequest(null)} />;
    }

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
                
                .btn-acknowledge-pill { background: #075985; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; cursor: pointer; }
                .btn-view-pill { background: #e2e8f0; color: #475569; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; cursor: pointer; }
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
                <div className="filter-item">
                    <label>Patient Search</label>
                    <input
                        className="search-field"
                        placeholder="Name or Visit No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-item"><label>Clinic</label><select className="search-field"><option>All Clinics</option></select></div>
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
                            <th>Age/Sex</th>
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
                                <td>{req.clinic || 'General Medicine'}</td>
                                <td>{req.uhid || 'SHH-001'}</td>
                                <td style={{ fontWeight: 700 }}>{req.patient_name}</td>
                                <td>34Y / M</td>
                                <td>
                                    <span style={{
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        background: req.status === 'NURSE_SEEN' ? '#fff7ed' : '#f0fdf4',
                                        color: req.status === 'NURSE_SEEN' ? '#c2410c' : '#15803d'
                                    }}>
                                        {req.status}
                                    </span>
                                </td>
                                <td align="center">
                                    {req.status === 'NURSE_SEEN' ? (
                                        <button className="btn-acknowledge-pill" onClick={() => handleAcknowledge(req)}>Acknowledge</button>
                                    ) : (
                                        <button className="btn-view-pill" onClick={() => setSelectedRequest(req)}>Review</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRequests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, fontSize: '0.8rem' }}>No patients found in this queue.</div>
                )}
            </div>
        </div>
    );
};

export default DoctorVisitDashboard;
