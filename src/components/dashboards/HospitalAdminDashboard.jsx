import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/useAuth';
import AccordionSidebar from '../shared/AccordionSidebar';
import HospitalChat from './HospitalChat'; // Import HospitalChat
import HospitalOnboarding from './HospitalOnboarding';
import { useClinical } from '../../context/ClinicalContext';
import { useTheme } from '../../context/ThemeContext'; // Ensure theme context is used if needed

const HospitalAdminDashboard = () => {
    const { user, logout } = useAuth();
    const { generateInvite } = useClinical();
    const { setTheme } = useTheme(); // Assuming we want to force light mode or handle theme
    const [pendingStaff, setPendingStaff] = useState([]);
    const [copyStatus, setCopyStatus] = useState('');
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('staff'); // Default tab

    useEffect(() => {
        setTheme('light'); // Enforce light mode for consistency
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
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (hError) throw hError;

            // If no hospital found, stop here (will trigger Onboarding view)
            if (!hospital) {
                setHospitalInfo(null);
                setLoading(false);
                return;
            }

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

    if (loading) return <div className="loading-screen">Authenticating Facility Credentials...</div>;

    // Show Onboarding if hospital doesn't exist yet OR phase 1 is not complete
    if (!hospitalInfo || hospitalInfo.registration_phase < 2) {
        return <HospitalOnboarding onComplete={fetchHospitalData} />;
    }

    const handleInvite = async (role) => {
        try {
            const invite = await generateInvite(hospitalInfo.id, role);
            const link = `${window.location.origin}/?token=${invite.token}`;
            await navigator.clipboard.writeText(link);
            setCopyStatus(`${role.toUpperCase()} link copied!`);
            setTimeout(() => setCopyStatus(''), 3000);
        } catch (err) {
            alert("Failed to generate invite: " + err.message);
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

    const topNavItems = [
        { id: 'team_hub', label: 'Team Hub', icon: '🫂', onClick: () => setActiveTab('chat'), active: activeTab === 'chat' },
        { id: 'dashboard', label: 'Dashboard', icon: '🏠', onClick: () => setActiveTab('staff'), active: activeTab === 'staff' },
        // Profile might not be as relevant for Admin entity, but good for user account settings
        { id: 'profile', label: 'Settings', icon: '⚙️', onClick: () => setActiveTab('settings') }
    ];

    const bottomNavItems = [
        { id: 'logout', label: 'Log Out', icon: '🚪', onClick: logout }
    ];

    const menuGroups = [
        {
            title: 'Administration',
            icon: '🏢',
            items: [
                { id: 'staff', label: 'Staff Management', icon: '👥' },
                { id: 'invites', label: 'Staff Invitations', icon: '📩' },
                { id: 'archives', label: 'Logistic Archives', icon: '📂' },
                { id: 'billing', label: 'Billing & Finance', icon: '💳', restricted: true }
            ]
        },
        {
            title: 'Facility',
            icon: '🏥',
            items: [
                { id: 'settings', label: 'Facility Profile', icon: '⚙️' }
            ]
        }
    ];

    const renderMainContent = () => {
        if (loading) return <div className="p-4 text-center">Loading Management Console...</div>;
        if (!hospitalInfo) return (
            <div className="glass-card p-4 text-center">
                <h3>No Hospital Assigned</h3>
                <p>Your account is not yet linked to a verified hospital facility.</p>
            </div>
        );

        switch (activeTab) {
            case 'chat':
                return <HospitalChat />;
            case 'invites':
                return (
                    <div className="invites-view glass-card fade-in">
                        <style>{`
                            .invite-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 2rem; }
                            .invite-card-admin { 
                                background: #ffffff; 
                                border: 1px solid var(--glass-border); 
                                padding: 2.5rem 2rem; 
                                border-radius: 20px; 
                                text-align: center; 
                                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                                box-shadow: var(--shadow-main);
                                font-family: 'Inter', sans-serif;
                            }
                            .invite-card-admin:hover { 
                                transform: translateY(-8px); 
                                box-shadow: var(--shadow-glow); 
                                border-color: var(--primary); 
                            }
                            .invite-icon { font-size: 3.5rem; display: block; margin-bottom: 1.5rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
                            .role-label { display: block; font-weight: 800; font-size: 1.4rem; margin-bottom: 0.75rem; color: var(--text-primary); font-family: 'Outfit', sans-serif; }
                            .role-desc { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.6; min-height: 3em; }
                            .copy-banner { margin-top: 2rem; background: var(--secondary); color: white; padding: 1rem; border-radius: 12px; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 12px var(--secondary-glow); animation: fadeIn 0.3s ease; }
                        `}</style>
                        <div className="section-title">
                            <h3>Staff Invitations</h3>
                            <p style={{ opacity: 0.6 }}>Generate secure onboarding links for your medical facility.</p>
                        </div>

                        <div className="invite-grid">
                            {[
                                { role: 'doctor', label: 'Doctor', icon: '🩺', desc: 'Full medical authority and triage access.' },
                                { role: 'nurse', label: 'Nurse', icon: '💊', desc: 'Care execution and patient assessment.' },
                                { role: 'secretary', label: 'Coordinator', icon: '📋', desc: 'Manage flow and patient routing.' }
                            ].map(opt => (
                                <div key={opt.role} className="invite-card-admin">
                                    <span className="invite-icon">{opt.icon}</span>
                                    <span className="role-label">{opt.label}</span>
                                    <span className="role-desc">{opt.desc}</span>
                                    <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleInvite(opt.role)}>
                                        Copy Invite Link
                                    </button>
                                </div>
                            ))}
                        </div>

                        {copyStatus && <div className="copy-banner fade-in">✅ {copyStatus}</div>}
                    </div>
                );
            case 'settings':
                return (
                    <div className="glass-card p-4">
                        <h3>Facility Settings</h3>
                        <p>Detailed hospital configuration would go here (Name, Address, Departments).</p>
                        <div className="control-list" style={{ marginTop: '1rem' }}>
                            <div className="control-item">
                                <span>Emergency Status</span>
                                <span className="status-toggle active">Operating</span>
                            </div>
                        </div>
                    </div>
                );
            case 'archives':
                return (
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
                );
            case 'staff':
            default:
                return (
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
                        </section>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
            <AccordionSidebar
                title="HOSPITAL ADMIN"
                menuGroups={menuGroups}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                topNavItems={topNavItems}
                bottomNavItems={bottomNavItems}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <div className="admin-content fade-in">
                    <style>{`
                        .admin-content { padding: 2rem; color: var(--text-primary); max-width: 1600px; margin: 0 auto; width: 100%; }
                        
                        /* Reusing existing styles */
                        .admin-header { padding: 2rem; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--accent); margin-bottom: 1rem; }
                        .facility-brand { display: flex; gap: 1.5rem; align-items: center; }
                        .facility-icon { font-size: 2.5rem; background: var(--glass-highlight); padding: 1rem; border-radius: 12px; }
                        
                        .management-grid { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; }
                        .section-title { margin-bottom: 1.5rem; }
                        
                        .archive-table-wrapper { overflow-x: auto; margin-top: 1rem; }
                        .archive-table { width: 100%; border-collapse: collapse; }
                        .archive-table th { text-align: left; padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }
                        .archive-table td { padding: 1rem; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 0.9rem; }
                        .status-badge { font-size: 0.6rem; background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 4px; font-weight: 800; }

                        .request-list { display: flex; flex-direction: column; gap: 1rem; }
                        .approval-card { 
                            display: flex; justify-content: space-between; align-items: center; 
                            padding: 1rem; background: white; border-radius: 12px; border: 1px solid var(--glass-border);
                        }
                        .staff-info { display: flex; gap: 1rem; align-items: center; }
                        .staff-avatar { width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; }
                        
                        .actions { display: flex; gap: 0.5rem; }
                        .actions button { padding: 0.4rem 0.8rem; border-radius: 6px; border: none; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
                        .btn-view { background: #e2e8f0; color: #475569; }
                        .btn-approve { background: #10b981; color: white; }
                        .btn-reject { background: #ef4444; color: white; }

                        .control-list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                        .control-item { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted); }
                        .status-toggle { font-size: 0.7rem; color: #10b981; font-weight: 800; border: 1px solid #10b981; padding: 2px 6px; border-radius: 4px; }
                        
                        .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); font-style: italic; }
                        .glass-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                    `}</style>

                    {/* Header Section - Only show on Dash */}
                    {activeTab === 'staff' && hospitalInfo && (
                        <header className="admin-header glass-card">
                            <div className="facility-brand">
                                <span className="facility-icon">🏥</span>
                                <div>
                                    <h2 style={{ margin: 0, color: '#0f172a' }}>{hospitalInfo.name}</h2>
                                    <p className="subtitle" style={{ margin: 0, color: '#64748b' }}>Official Administration Portal • {hospitalInfo.status}</p>
                                </div>
                            </div>
                        </header>
                    )}

                    {/* Viewport Content */}
                    <div className="module-viewport">
                        {renderMainContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HospitalAdminDashboard;
