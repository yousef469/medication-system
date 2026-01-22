import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useClinical } from '../../context/ClinicalContext';
import { useTheme } from '../../context/ThemeContext';
import ProfessionalProfile from '../shared/ProfessionalProfile';
import DoctorVisitDashboard from './DoctorVisitDashboard';
import AccordionSidebar from '../shared/AccordionSidebar';

import HospitalChat from './HospitalChat';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const { fetchRequests, refreshGlobalData } = useClinical();
    const { setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('clinical'); // Default

    useEffect(() => {
        setTheme('light');
        refreshGlobalData();
    }, []);

    const topNavItems = [
        { id: 'team_hub', label: 'Team Hub', icon: '🫂', onClick: () => setActiveTab('chat'), active: activeTab === 'chat' },
        { id: 'dashboard', label: 'Dashboard', icon: '🏠', onClick: () => setActiveTab('launchpad'), active: activeTab === 'launchpad' },
        { id: 'profile', label: 'My Profile', icon: '👤', onClick: () => setActiveTab('profile') }
    ];

    const bottomNavItems = [
        { id: 'logout', label: 'Log Out', icon: '🚪', onClick: logout }
    ];

    const doctorModules = [
        { id: 'clinical', label: 'Clinical Management', icon: '👨‍⚕️', sublabel: 'Patient Consultation & EHR', color: '#0ea5e9' },
        { id: 'appointment', label: 'Appointment', icon: '📅', sublabel: 'Schedule & Patient Bookings', color: '#10b981' },
        { id: 'emergency', label: 'Emergency', icon: '🚨', sublabel: 'Critical Care & Alerts', color: '#ef4444' },
        { id: 'theatre', label: 'Operation Theatre', icon: '🔪', sublabel: 'Surgery Schedule & Status', color: '#8b5cf6' },
        { id: 'phlebotomy', label: 'Phlebotomy', icon: '🩸', sublabel: 'Blood Sampling', color: '#f43f5e' },
        { id: 'laboratory', label: 'Laboratory', icon: '🔬', sublabel: 'Test Results & Analysis', color: '#6366f1' },
        { id: 'radiology', label: 'Radiology', icon: '🩻', sublabel: 'Imaging & Diagnostics', color: '#f59e0b' },
        { id: 'system', label: 'System Control', icon: '⚙️', sublabel: 'Hospital Configuration', restricted: true, color: '#64748b' }
    ];

    const menuGroups = [
        {
            title: 'Clinical Practice',
            icon: '🩺',
            items: [
                { id: 'clinical', label: 'Clinical Management', icon: '👨‍⚕️' },
                { id: 'appointment', label: 'Appointments', icon: '📅' },
                { id: 'emergency', label: 'Emergency', icon: '🚨' },
                { id: 'theatre', label: 'Operation Theatre', icon: '🔪' }
            ]
        },
        {
            title: 'Diagnostics',
            icon: '🔬',
            items: [
                { id: 'laboratory', label: 'Laboratory', icon: '🧪' },
                { id: 'radiology', label: 'Radiology', icon: '🩻' },
                { id: 'phlebotomy', label: 'Phlebotomy', icon: '🩸' }
            ]
        },
        {
            title: 'Administrative',
            icon: '⚙️',
            items: [
                { id: 'system', label: 'System Control', icon: '🔧', restricted: true }
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
                        {doctorModules.map(module => (
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
                return <DoctorVisitDashboard />;
            case 'profile':
                return <ProfessionalProfile profile={user} isOwner={true} showFeed={true} />;
            default:
                return (
                    <div className="empty-state fade-in">
                        <div style={{ fontSize: '3rem' }}>🚧</div>
                        <h3>Module Under Construction</h3>
                        <p>The {activeTab.toUpperCase()} module is being calibrated for Silver Hill Hospital standards.</p>
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
                userRole="Doctor"
                hospitalName={user?.hospital_name || 'Unity Medical'}
            />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
                <main style={{ padding: '2rem', flex: 1 }}>
                    <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', color: '#0f172a' }}>
                                {activeTab === 'launchpad' ? 'Doctor Dashboard' : (menuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Dashboard')}
                            </h1>
                            <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Doctor Portal • {user?.name}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9' }}>{user?.department || 'GENERAL MEDICINE'}</span>
                            </div>
                            <button className="btn-primary" onClick={logout}>Sign Out</button>
                        </div>
                    </header>

                    {/* Re-add styles for launchpad grid locally or assume global/imported */}
                    <style>{`
                        .launchpad-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem; }
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

export default DoctorDashboard;
