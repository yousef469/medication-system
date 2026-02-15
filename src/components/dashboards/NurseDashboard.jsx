import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinical } from '../../context/ClinicalContext';
import { useTheme } from '../../context/ThemeContext';
import ProfessionalProfile from '../shared/ProfessionalProfile';
import NurseVisitDashboard from './NurseVisitDashboard';
import AccordionSidebar from '../shared/AccordionSidebar';

import HospitalChat from './HospitalChat';

const NurseDashboard = () => {
    const { user, logout } = useAuth();
    const { setTheme } = useTheme();
    const { fetchDoctors } = useClinical();
    const [activeTab, setActiveTab] = useState('clinical'); // Default

    // Force Light Mode for Professional Dashboards
    useEffect(() => {
        setTheme('light');
        if (user?.hospital_id) fetchDoctors(user.hospital_id);
    }, [user?.hospital_id, setTheme, fetchDoctors]);

    const topNavItems = [
        { id: 'team_hub', label: 'Team Hub', icon: '🫂', onClick: () => setActiveTab('chat'), active: activeTab === 'chat' },
        { id: 'dashboard', label: 'Dashboard', icon: '🏠', onClick: () => setActiveTab('launchpad'), active: activeTab === 'launchpad' },
        { id: 'profile', label: 'My Profile', icon: '👤', onClick: () => setActiveTab('profile') }
    ];

    const bottomNavItems = [
        { id: 'logout', label: 'Log Out', icon: '🚪', onClick: logout }
    ];

    const launchpadModules = [
        { id: 'inpatient', label: 'In-Patient Management', sublabel: 'Vital signs, bed status, care notes', icon: '🛌', color: '#0ea5e9' },
        { id: 'nurse_station', label: 'Nurse Station', sublabel: 'Core nurse workflow', icon: '🧑‍⚕️', color: '#10b981' },
        { id: 'registration', label: 'Patient Registration', sublabel: 'View basic patient info', icon: '📋', color: '#8b5cf6', restricted: true },
        { id: 'clinical', label: 'Clinical Management', sublabel: 'Follow doctor orders', icon: '🩻', color: '#6366f1' },
        { id: 'phlebotomy', label: 'Phlebotomy', sublabel: 'Blood sample tracking', icon: '🧪', color: '#f43f5e' },
        { id: 'discharge', label: 'Discharge Summary', sublabel: 'View only instructions', icon: '📄', color: '#f59e0b', restricted: true },
        { id: 'inventory', label: 'Inventory (Limited)', sublabel: 'Supplies & medication stock', icon: '📦', color: '#ec4899' },
        { id: 'emergency', label: 'Emergency (Read-only)', sublabel: 'Emergency alerts', icon: '🚨', color: '#ef4444' },
    ];

    const menuGroups = [
        {
            title: 'Clinical Care',
            icon: '🩺',
            items: [
                { id: 'clinical', label: 'Clinical Management', icon: '🩻' },
                { id: 'nurse_station', label: 'Nurse Station', icon: '🧑‍⚕️' },
                { id: 'inpatient', label: 'In-Patient Mgmt', icon: '🛌' },
                { id: 'phlebotomy', label: 'Phlebotomy', icon: '🧪' },
                { id: 'emergency', label: 'Emergency (View)', icon: '🚨' }
            ]
        },
        {
            title: 'Administrative',
            icon: '📋',
            items: [
                { id: 'registration', label: 'Patient Registration', icon: '📝', restricted: true },
                { id: 'discharge', label: 'Discharge Summary', icon: '📄', restricted: true },
                { id: 'inventory', label: 'Inventory', icon: '📦' }
            ]
        }
    ];

    const renderMainContent = () => {
        switch (activeTab) {
            case 'chat':
                return <HospitalChat />;
            case 'launchpad':
                return (
                    <div className="launchpad-grid fade-in">
                        {launchpadModules.map(module => (
                            <div
                                key={module.id}
                                className="modular-icon-card"
                                onClick={() => !module.restricted && setActiveTab(module.id)}
                                style={{ opacity: module.restricted ? 0.7 : 1 }}
                            >
                                <div className="icon-circle" style={{ backgroundColor: module.color + '20', color: module.color }}>
                                    <span>{module.icon}</span>
                                </div>
                                <div className="modular-label" style={{ marginBottom: '0.2rem' }}>{module.label}</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: '1.2', fontWeight: 500 }}>{module.sublabel}</div>
                                {module.restricted && <span style={{ fontSize: '0.5rem', fontWeight: 800, color: '#ef4444', position: 'absolute', top: '10px', right: '10px' }}>LOCKED</span>}
                            </div>
                        ))}
                    </div>
                );
            case 'clinical':
                return <NurseVisitDashboard />;
            case 'profile':
                return <ProfessionalProfile profile={user} isOwner={true} showFeed={true} />;
            default:
                return (
                    <div className="empty-state fade-in">
                        <div style={{ fontSize: '3rem' }}>🚧</div>
                        <h3>Module Under Construction</h3>
                        <p>Accessing {activeTab.toUpperCase()} restricted/admin zone.</p>
                        <button className="btn-secondary" onClick={() => setActiveTab('clinical')}>Back to Clinical</button>
                    </div>
                );
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
                userRole="Nurse"
                hospitalName={user?.hospital_name || 'Unity Medical'}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <main style={{ padding: '2rem', flex: 1 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', color: '#0f172a' }}>
                                {activeTab === 'launchpad' ? 'Nurse Dashboard' : (menuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Dashboard')}
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Nurse Portal • {user?.name}</p>
                        </div>
                        <button className="btn-primary" onClick={logout}>Sign Out</button>
                    </header>

                    {/* Re-add styles for launchpad grid locally or assume global/imported */}
                    <style>{`
    .launchpad-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.5rem; }
                        .modular-icon-card {
    background: var(--bg-surface);
    border-radius: 15px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid var(--glass-border);
    position: relative;
}
                        .modular-icon-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-light);
}
                        .icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin-bottom: 1rem;
    flex-shrink: 0;
}
                        .modular-label {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 0.9rem;
    line-height: 1.3;
}
`}</style>

                    {renderMainContent()}
                </main>
            </div>
        </div>
    );
};

export default NurseDashboard;
