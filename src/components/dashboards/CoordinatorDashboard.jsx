import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/useAuth';
import { useClinical } from '../../context/ClinicalContext';
import { useTheme } from '../../context/ThemeContext';
import ProfessionalProfile from '../shared/ProfessionalProfile';
import AppointmentScheduler from './AppointmentScheduler';
import PatientRegistration from './PatientRegistration';
import AccordionSidebar from '../shared/AccordionSidebar';
import HospitalChat from './HospitalChat';

const CoordinatorDashboard = ({ initialTab = 'triage' }) => {
    const { user, logout } = useAuth();
    const { setTheme } = useTheme();
    const { requests, doctors, fetchRequests, fetchDoctors, generateInvite, isBackendOnline } = useClinical();

    const [activeTab, setActiveTab] = useState(initialTab);
    const [inviteToken, setInviteToken] = useState(null);
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
    const [bookingContext, setBookingContext] = useState(null);

    // Force Light Theme for Coordinator
    useEffect(() => {
        setTheme('light');
    }, [setTheme]);

    // Initial Fetch
    useEffect(() => {
        if (user?.hospital_id) {
            fetchRequests(user.hospital_id);
            fetchDoctors(user.hospital_id);
        }
    }, [user?.hospital_id]);

    useEffect(() => {
        // Only override if initialTab is valid and different
        if (initialTab && initialTab !== 'launchpad') setActiveTab(initialTab);
    }, [initialTab]);

    // Top Navigation Items
    const topNavItems = [
        { id: 'team_hub', label: 'Team Hub', icon: '🫂', onClick: () => setActiveTab('chat'), active: activeTab === 'chat' },
        { id: 'dashboard', label: 'Dashboard', icon: '🏠', onClick: () => setActiveTab('launchpad'), active: activeTab === 'launchpad' },
        { id: 'profile', label: 'My Profile', icon: '👤', onClick: () => setActiveTab('profile') }
    ];

    // Bottom Navigation Items
    const bottomNavItems = [
        { id: 'logout', label: 'Log Out', icon: '🚪', onClick: logout }
    ];

    // Launchpad Modules Configuration (Restricted)
    const launchpadModules = [
        { id: 'triage', label: 'Emergency Queue', icon: '🚨', category: 'icon-emergency' },
        { id: 'appointments', label: 'Appointment', icon: '📅', category: 'icon-clinical' },
        { id: 'registration', label: 'Patient Registration', icon: '📋', category: 'icon-admin' },
        { id: 'billing', label: 'Billing & Collection', icon: '💰', category: 'icon-finance' },
        { id: 'insurance', label: 'Insurance & Eclaim', icon: '🛡️', category: 'icon-finance' },
        { id: 'phlebotomy', label: 'Phlebotomy', icon: '🧪', category: 'icon-lab' },
        { id: 'laboratory', label: 'Laboratory', icon: '🔬', category: 'icon-lab' },
        { id: 'bloodbank', label: 'Blood Bank', icon: '🩸', category: 'icon-lab' },
        { id: 'radiology', label: 'Radiology', icon: '☢️', category: 'icon-lab' },
        { id: 'linen', label: 'Linen & Laundry', icon: '🧺', category: 'icon-service' },
        { id: 'discharge', label: 'Discharge Summary', icon: '📄', category: 'icon-admin' },
        { id: 'mortuary', label: 'Mortuary Mgmt', icon: '💀', category: 'icon-service' },
        { id: 'feedback', label: 'Feedback Mgmt', icon: '💬', category: 'icon-admin' },
        { id: 'inventory', label: 'Inventory', icon: '📦', category: 'icon-admin' },
        { id: 'mrd', label: 'MRD', icon: '📁', category: 'icon-admin' },
        { id: 'mis_dash', label: 'MIS Dashboard', icon: '📊', category: 'icon-admin' },
        { id: 'mis_reports', label: 'MIS Reports', icon: '📈', category: 'icon-admin' },
        { id: 'inventory_setup', label: 'Inventory Setup', icon: '⚙️', category: 'icon-admin' },
        { id: 'custom_template', label: 'Custom Template', icon: '📝', category: 'icon-admin' },
        { id: 'software', label: 'Software Mgmt', icon: '💻', category: 'icon-admin' },
        { id: 'cssd', label: 'CSSD', icon: '🧼', category: 'icon-service' },
        { id: 'system_control', label: 'System Control', icon: '🕹️', category: 'icon-admin' },
        { id: 'security', label: 'Security & Audit', icon: '🔐', category: 'icon-admin' },
        { id: 'hr', label: 'HR Management', icon: '👥', category: 'icon-admin' },
        { id: 'ambulance', label: 'Ambulance Mgmt', icon: '🚑', category: 'icon-emergency' },
        { id: 'lab_setup', label: 'Laboratory Setup', icon: '🧪', category: 'icon-lab' },
    ];

    // Define Menu Groups
    const menuGroups = [
        {
            title: 'Clinical Operations',
            icon: '🩺',
            items: [
                { id: 'triage', label: 'Emergency Queue', icon: '🚨' },
                { id: 'appointments', label: 'Appointment', icon: '📅' },
                { id: 'phlebotomy', label: 'Phlebotomy', icon: '🧪' },
                { id: 'laboratory', label: 'Laboratory', icon: '🔬' },
                { id: 'bloodbank', label: 'Blood Bank', icon: '🩸' },
                { id: 'radiology', label: 'Radiology', icon: '☢️' },
                { id: 'ambulance', label: 'Ambulance Mgmt', icon: '🚑' }
            ]
        },
        {
            title: 'Administration',
            icon: '🏢',
            items: [
                { id: 'registration', label: 'Patient Registration', icon: '📋' },
                { id: 'hr', label: 'Staff & HR', icon: '👥' },
                { id: 'discharge', label: 'Discharge Summary', icon: '📄' },
                { id: 'mrd', label: 'MRD', icon: '📁' },
                { id: 'feedback', label: 'Feedback Mgmt', icon: '💬' },
                { id: 'mis_dash', label: 'MIS Dashboard', icon: '📊' },
                { id: 'inventory', label: 'Inventory', icon: '📦' }
            ]
        },
        {
            title: 'Finance & Accounts',
            icon: '💰',
            items: [
                { id: 'billing', label: 'Billing & Collection', icon: '💵' },
                { id: 'insurance', label: 'Insurance & Eclaim', icon: '🛡️' }
            ]
        },
        {
            title: 'Services & Support',
            icon: '🛠️',
            items: [
                { id: 'linen', label: 'Linen & Laundry', icon: '🧺' },
                { id: 'mortuary', label: 'Mortuary Mgmt', icon: '💀' },
                { id: 'cssd', label: 'CSSD', icon: '🧼' },
                { id: 'security', label: 'Security & Audit', icon: '🔐' }
            ]
        }
    ];


    // Data Filtering & Metrics
    const myRequests = useMemo(() => requests.filter(r => r.hospital_id === user?.hospital_id), [requests, user?.hospital_id]);
    const emergencyRequests = myRequests.filter(r => r.urgency === 'IMMEDIATE' || r.urgency === 'HIGH');

    // MOCK DATA for Lab/Radiology
    const labRequests = useMemo(() => [
        { id: 'LAB-001', test: 'CBC', status: 'COMPLETED', patient: 'Khalid Al-Fubeiri' },
        { id: 'LAB-002', test: 'Lipid Profile', status: 'PENDING', patient: 'Sarah Conner' }
    ], []);

    const radRequests = useMemo(() => [
        { id: 'RAD-001', type: 'X-Ray Chest', status: 'DONE', patient: 'John Doe' },
        { id: 'RAD-002', type: 'MRI Brain', status: 'SCHEDULED', patient: 'Jane Smith' }
    ], []);


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

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-app)', overflow: 'hidden' }}>
            <AccordionSidebar
                menuGroups={menuGroups}
                topNavItems={topNavItems}
                bottomNavItems={bottomNavItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                userRole="Coordinator"
                hospitalName={user?.hospital_name || 'Unity Medical'}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <div className="coordinator-content fade-in">
                    <style>{`
                        .coordinator-content { padding: 2rem; color: var(--text-primary); max-width: 1600px; margin: 0 auto; width: 100%; }
                        
                        /* Reusing existing styles */
                        .command-header { padding-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
                        .case-card { background: var(--bg-surface); border: 1px solid var(--glass-border); border-radius: 12px; padding: 0.75rem; transition: 0.2s; position: relative; overflow: hidden; box-shadow: var(--shadow-main); }
                        .case-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
                        .patient-id { font-family: monospace; font-size: 0.6rem; opacity: 0.6; color: var(--text-muted); }
                        .status-row { display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--glass-border); font-size: 0.8rem; }
                        .status-badge { padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 700; font-size: 0.7rem; }
                        .status-badge.pending { background: #fef3c7; color: #b45309; }
                        .status-badge.completed { background: #d1fae5; color: #065f46; }
                        .status-badge.scheduled { background: #dbeafe; color: #1e40af; }
                        .status-badge.done { background: #fae8ff; color: #86198f; }
                        .clinical-grid { display: grid; gap: 1rem; }
                        .glass-card { background: rgba(255,255,255,0.5); backdrop-filter: blur(10px); border-radius: 8px; }
                    `}</style>

                    {/* Header Section */}
                    <div className="command-header">
                        <div>
                            <h1 className="text-gradient" style={{ fontSize: '1.75rem', marginBottom: '0.2rem' }}>
                                {menuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Dashboard'}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.7 }}>
                                <span className={`sensor-light ${isBackendOnline ? 'sensor-online' : 'sensor-alert'}`} style={{ width: '6px', height: '6px' }}></span>
                                <span className="text-micro" style={{ fontSize: '0.6rem' }}>SYSTEM STATUS: {isBackendOnline ? 'ONLINE' : 'OFFLINE'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Viewport Content */}
                    <div className="module-viewport">
                        {activeTab === 'chat' && <HospitalChat />}

                        {activeTab === 'launchpad' && (
                            <div className="fade-in">
                                <div className="launchpad-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                                    {launchpadModules.map(module => (
                                        <div
                                            key={module.id}
                                            className="modular-icon-card"
                                            onClick={() => setActiveTab(module.id)}
                                            style={{
                                                background: 'var(--bg-surface)', borderRadius: '15px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid var(--glass-border)'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div className={`icon-circle ${module.category}`} style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '0.8rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9' }}>
                                                {module.icon}
                                            </div>
                                            <span className="modular-label" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', lineHeight: 1.3 }}>{module.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'triage' && (
                            <div className="fade-in">
                                <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid #ef4444', paddingLeft: '0.5rem' }}>Active Emergency Queue ({emergencyRequests.length})</h3>
                                <div className="clinical-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {emergencyRequests.map(req => (
                                        <div key={req.id} className="case-card">
                                            <div className="case-meta">
                                                <span className="status-pill status-emergency">{req.urgency}</span>
                                                <span className="patient-id">{req.id.slice(-6)}</span>
                                            </div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{req.patient_name}</div>
                                            <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                                Status: {req.status.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    ))}
                                    {emergencyRequests.length === 0 && <div style={{ opacity: 0.5 }}>No active emergencies.</div>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'laboratory' && (
                            <div className="fade-in">
                                <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid #0ea5e9', paddingLeft: '0.5rem' }}>Laboratory Requests</h3>
                                <div className="glass-card">
                                    {labRequests.map(req => (
                                        <div key={req.id} className="status-row">
                                            <span style={{ fontWeight: 700 }}>{req.patient}</span>
                                            <span>{req.test}</span>
                                            <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'radiology' && (
                            <div className="fade-in">
                                <h3 style={{ marginBottom: '1rem', borderLeft: '4px solid #8b5cf6', paddingLeft: '0.5rem' }}>Radiology Schedule</h3>
                                <div className="glass-card">
                                    {radRequests.map(req => (
                                        <div key={req.id} className="status-row">
                                            <span style={{ fontWeight: 700 }}>{req.patient}</span>
                                            <span>{req.type}</span>
                                            <span className={`status-badge ${req.status.toLowerCase()}`}>{req.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <AppointmentScheduler onBookNew={(slot) => {
                                setBookingContext(slot);
                                setActiveTab('registration');
                            }} />
                        )}

                        {activeTab === 'registration' && (
                            <PatientRegistration
                                initialData={bookingContext ? {
                                    time: bookingContext.time,
                                    date: bookingContext.date,
                                    doctorId: bookingContext.doctorId,
                                    clinic: bookingContext.clinic
                                } : {}}
                                onSave={(patient) => {
                                    setBookingContext(null);
                                    setActiveTab('appointments'); // Go back to appointments usually
                                    alert("Record saved successfully!");
                                }}
                                onCancel={() => {
                                    setBookingContext(null);
                                    setActiveTab('appointments');
                                }}
                            />
                        )}

                        {activeTab === 'hr' && (
                            <div className="fade-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.2rem' }}>Staff Directory</h2>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-primary" onClick={() => handleGenerateInvite('doctor')} style={{ height: '32px', fontSize: '0.7rem', padding: '0 1rem' }} disabled={isGeneratingInvite}>
                                            {isGeneratingInvite ? '...' : '+ Doctor Invite'}
                                        </button>
                                    </div>
                                </div>

                                {inviteToken && (
                                    <div className="glass-card fade-in" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)', padding: '1rem' }}>
                                        <div className="text-micro" style={{ marginBottom: '0.5rem' }}>Invite Token Generated</div>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <code style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', flex: 1 }}>{inviteToken}</code>
                                            <button onClick={() => { navigator.clipboard.writeText(inviteToken); alert('Copied'); }} className="btn-primary btn-xs">Copy</button>
                                        </div>
                                    </div>
                                )}

                                <div className="clinical-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {doctors.filter(d => d.hospital_id === user?.hospital_id).map(staff => (
                                        <div key={staff.id} className="stat-card" style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{staff.name}</div>
                                            <div className="text-micro" style={{ color: 'var(--primary)', marginTop: '0.2rem' }}>{staff.role} • {staff.specialty || 'General'}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                                                <span className={`sensor-light ${staff.clinical_status === 'Available' ? 'sensor-online' : 'sensor-alert'}`} style={{ width: '6px', height: '6px' }}></span>
                                                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{staff.clinical_status || 'On Rotation'}</span>
                                            </div>
                                        </div>
                                    ))}
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

                        {!['launchpad', 'triage', 'hr', 'profile', 'appointments', 'registration', 'laboratory', 'radiology'].includes(activeTab) && (
                            <div style={{ textAlign: 'center', marginTop: '6rem', opacity: 0.15 }}>
                                <div style={{ fontSize: '3rem' }}>🔒</div>
                                <p className="text-micro" style={{ marginTop: '1rem' }}>Module "{activeTab.toUpperCase()}" is under restricted access or maintenance.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorDashboard;
