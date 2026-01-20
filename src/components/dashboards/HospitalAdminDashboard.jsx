import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/useAuth';

const HospitalAdminDashboard = () => {
    const { user } = useAuth();
    const [pendingStaff, setPendingStaff] = useState([]);
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'archives'

    useEffect(() => {
        if (user?.id) {
            fetchHospitalData();
        }
    }, [user]);

    const fetchHospitalData = async () => {
        try {
            // 1. Get Hospital details managed by this admin
            const { data: hospital, error: hError } = await supabase
                .from('hospitals')
                .select('*')
                .eq('admin_id', user.id)
                .single();

            if (hError) throw hError;
            setHospitalInfo(hospital);

            // 2. Get Pending Staff for this Hospital
            const { data: staff, error: sError } = await supabase
                .from('profiles')
                .select('*')
                .eq('hospital_id', hospital.id)
                .eq('verification_status', 'PENDING');

            if (sError) throw sError;
            setPendingStaff(staff);

            // 3. Get Logistic Archives (Completed Requests)
            const { data: arch, error: aError } = await supabase
                .from('appointment_requests')
                .select('id, created_at, patient_name, status, assigned_doctor_id, assigned_nurse_id')
                .eq('hospital_id', hospital.id)
                .eq('status', 'COMPLETED')
                .order('created_at', { ascending: false });

            if (aError) throw aError;
            setArchives(arch);
        } catch (err) {
            console.error('Error fetching admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (staffId) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ verification_status: 'APPROVED' })
                .eq('id', staffId);

            if (error) throw error;
            setPendingStaff(prev => prev.filter(s => s.id !== staffId));
        } catch (err) {
            alert("Approval failed: " + err.message);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading Management Console...</div>;

    if (!hospitalInfo) return (
        <div className="glass-card p-4 text-center">
            <h3>No Hospital Assigned</h3>
            <p>Your account is not yet linked to a verified hospital facility.</p>
        </div>
    );

    return (
        <div className="admin-dashboard fade-in">
            <header className="admin-header glass-card">
                <div className="facility-brand">
                    <span className="facility-icon">🏥</span>
                    <div>
                        <h2>{hospitalInfo.name}</h2>
                        <p className="subtitle">Official Administration Portal • {hospitalInfo.status}</p>
                    </div>
                </div>
                <div className="stats-row">
                    <div className="stat-pill">
                        <span className="label">Total Staff</span>
                        <span className="value">42</span>
                    </div>
                    <div className="stat-pill accent">
                        <span className="label">Medical Logs</span>
                        <span className="value">{archives.length}</span>
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    className={`nav-chip ${activeTab === 'staff' ? 'active' : ''}`}
                    onClick={() => setActiveTab('staff')}
                >
                    Staff Management
                </button>
                <button
                    className={`nav-chip ${activeTab === 'archives' ? 'active' : ''}`}
                    onClick={() => setActiveTab('archives')}
                >
                    Logistic Archives
                </button>
            </div>

            {activeTab === 'staff' ? (
                <div className="management-grid">
                    <section className="staff-requests glass-card">
                        <div className="section-title">
                            <h3>Staff Approval Queue</h3>
                            <span className="badge">Action Required</span>
                        </div>

                        <div className="request-list">
                            {pendingStaff.length === 0 ? (
                                <div className="empty-state">No pending staff applications.</div>
                            ) : (
                                pendingStaff.map(staff => (
                                    <div key={staff.id} className="approval-card">
                                        <div className="staff-info">
                                            <div className="staff-avatar">{staff.name?.charAt(0)}</div>
                                            <div>
                                                <strong>{staff.name}</strong>
                                                <p>{staff.role.toUpperCase()} • License Pending AI Scan</p>
                                            </div>
                                        </div>
                                        <div className="actions">
                                            <button className="btn-view" onClick={() => window.open(`${supabase.storage.from('licenses').getPublicUrl(staff.license_url).data.publicUrl}`)}>View License</button>
                                            <button className="btn-approve" onClick={() => handleApprove(staff.id)}>Approve</button>
                                            <button className="btn-reject">Reject</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="facility-controls glass-card">
                        <h3>Facility Status</h3>
                        <div className="control-list">
                            <div className="control-item">
                                <span>Emergency Status</span>
                                <span className="status-toggle active">Operating</span>
                            </div>
                            <div className="control-item">
                                <span>Logic Core Load (Gemini)</span>
                                <span className="status-toggle">Optimal</span>
                            </div>
                        </div>

                        <div className="admin-actions mt-2">
                            <button className="btn-secondary w-full">Update Facility Profile</button>
                        </div>
                    </section>
                </div>
            ) : (
                <div className="archives-view glass-card fade-in">
                    <div className="section-title">
                        <h3>Logistic Archives</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Historical log of completed sessions. Medical data (Diagnosis) is restricted from admin view.</p>
                    </div>

                    <div className="archive-table-wrapper">
                        {archives.length === 0 ? (
                            <div className="empty-state">Archives are currently empty.</div>
                        ) : (
                            <table className="archive-table">
                                <thead>
                                    <tr>
                                        <th>Patient ID</th>
                                        <th>Date</th>
                                        <th>Physician</th>
                                        <th>Coordinator</th>
                                        <th>Clinical Nurse</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archives.map(rec => (
                                        <tr key={rec.id}>
                                            <td>{rec.patient_name}</td>
                                            <td>{new Date(rec.created_at).toLocaleDateString()}</td>
                                            <td>DOC-{rec.assigned_doctor_id?.slice(0, 4)}</td>
                                            <td>COORD-{rec.handled_by_coordinator_id?.slice(0, 4) || 'SYSTEM'}</td>
                                            <td>NURS-{rec.assigned_nurse_id?.slice(0, 4)}</td>
                                            <td><span className="status-badge">{rec.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .admin-dashboard { display: flex; flex-direction: column; gap: 2rem; }
                .admin-header { padding: 2rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--accent); margin-bottom: 1rem; }
                .facility-brand { display: flex; gap: 1.5rem; align-items: center; }
                .facility-icon { font-size: 2.5rem; background: var(--glass-highlight); padding: 1rem; border-radius: 12px; }
                
                .nav-chip { background: transparent; border: 1px solid var(--glass-border); color: var(--text-muted); padding: 0.6rem 1.2rem; border-radius: 30px; cursor: pointer; transition: 0.3s; font-weight: 700; font-size: 0.8rem; }
                .nav-chip:hover { border-color: var(--accent); color: var(--accent); }
                .nav-chip.active { background: var(--accent); border-color: var(--accent); color: white; box-shadow: var(--accent-glow); }

                .stats-row { display: flex; gap: 1rem; }
                .stat-pill { background: var(--glass-highlight); padding: 0.5rem 1.5rem; border-radius: 12px; text-align: center; border: 1px solid var(--glass-border); }
                .stat-pill.accent { border-color: var(--accent); }
                .stat-pill .label { display: block; font-size: 0.65rem; text-transform: uppercase; color: var(--text-muted); font-weight: 800; }
                .stat-pill .value { font-size: 1.25rem; font-weight: 800; }

                .management-grid { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
                .section-title { margin-bottom: 1.5rem; }
                
                .archive-table-wrapper { overflow-x: auto; margin-top: 1rem; }
                .archive-table { width: 100%; border-collapse: collapse; }
                .archive-table th { text-align: left; padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
                .archive-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
                .status-badge { font-size: 0.6rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-weight: 800; }

                .request-list { display: flex; flex-direction: column; gap: 1rem; }
                .approval-card { 
                    display: flex; justify-content: space-between; align-items: center; 
                    padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid var(--glass-border);
                }
                .staff-info { display: flex; gap: 1rem; align-items: center; }
                .staff-avatar { width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; }
                
                .actions { display: flex; gap: 0.5rem; }
                .actions button { padding: 0.4rem 0.8rem; border-radius: 6px; border: none; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
                .btn-view { background: var(--glass-highlight); color: white; }
                .btn-approve { background: var(--secondary); color: white; }
                .btn-reject { background: #ef4444; color: white; }

                .control-list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .control-item { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted); }
                .status-toggle { font-size: 0.7rem; color: var(--secondary); font-weight: 800; border: 1px solid var(--secondary); padding: 2px 6px; border-radius: 4px; }
                
                .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); font-style: italic; }
                .mt-2 { margin-top: 2rem; }
            `}</style>
        </div>
    );
};

export default HospitalAdminDashboard;
