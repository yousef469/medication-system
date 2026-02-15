import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useClinical } from '../../context/ClinicalContext';

// Lazy Loaded Components (Moved from App.jsx to isolate initialization)
const AppLayout = lazy(() => import('./AppLayout'));
const DoctorDashboard = lazy(() => import('../dashboards/DoctorDashboard'));
const DoctorProfile = lazy(() => import('../doctors/DoctorProfile'));
const UserDashboard = lazy(() => import('../dashboards/UserDashboard'));
const SecretaryDashboard = lazy(() => import('../dashboards/SecretaryDashboard'));
const ITSupportDashboard = lazy(() => import('../dashboards/ITSupportDashboard'));
const AdminDashboard = lazy(() => import('../dashboards/AdminDashboard'));
const LoginView = lazy(() => import('../auth/LoginView'));
const AuthPortalSwitcher = lazy(() => import('../auth/AuthPortalSwitcher'));
const UserHospitals = lazy(() => import('../dashboards/UserHospitals'));
const UserDoctors = lazy(() => import('../dashboards/UserDoctors'));
const UserAppointments = lazy(() => import('../dashboards/UserAppointments'));
const AIAssistant = lazy(() => import('../dashboards/AIAssistant'));
const HospitalNetwork = lazy(() => import('../dashboards/HospitalNetwork'));
const HospitalAdminDashboard = lazy(() => import('../dashboards/HospitalAdminDashboard'));
const HospitalChat = lazy(() => import('../dashboards/HospitalChat'));
const NurseDashboard = lazy(() => import('../dashboards/NurseDashboard'));
const CoordinatorDashboard = lazy(() => import('../dashboards/CoordinatorDashboard'));
const LockScreen = lazy(() => import('../auth/LockScreen'));
const LandingPage = lazy(() => import('../dashboards/LandingPage'));
const MedicationHub = lazy(() => import('../dashboards/MedicationHub'));
const BioAnatomyLab = lazy(() => import('../dashboards/BioAnatomyLab'));
const VerificationPending = lazy(() => import('../auth/VerificationPending'));
const MobileAnatomyBridge = lazy(() => import('../mobile/MobileAnatomyBridge'));
const PharmacyPortal = lazy(() => import('../dashboards/PharmacyPortal'));
const PrescriptionTerminal = lazy(() => import('../shared/PrescriptionTerminal'));

const CURRENT_RELEASE = "v4.1.6"; // Voice Transcription Fix

export default function MainContent() {
    const { user: authUser, isInitialized, isLocked, unlockSession } = useAuth();
    const { isBackendOnline } = useClinical();

    const user = authUser || { role: 'user', name: 'Guest', isAuthenticated: false, verification_status: 'APPROVED' };
    const [isStarted, setIsStarted] = useState(false);
    const [selectedSystem, setSelectedSystem] = useState('user');
    const [activeSubView, setActiveSubView] = useState('discovery');
    const [selectedPortal, setSelectedPortal] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return (params.get('invite') || params.get('token')) ? 'professional' : null;
    });

    const queryParams = new URLSearchParams(window.location.search);
    const isMobileBridge = queryParams.get('mobile') === 'true';

    useEffect(() => {
        if (window.location.pathname === '/pharmacy') {
            setSelectedSystem('pharmacy');
            setIsStarted(true);
        }
    }, []);

    useEffect(() => {
        if (user?.isAuthenticated) {
            console.log("[App] Auto-routing for:", user.role);
            setIsStarted(true);
            const role = user.role || 'user';
            if (['doctor', 'secretary', 'it', 'admin', 'hospital_admin', 'nurse'].includes(role)) {
                setSelectedSystem(role);
                if (user.hospital_id && ['doctor', 'nurse', 'hospital_admin', 'secretary'].includes(role)) {
                    setActiveSubView('hospital-chat');
                } else {
                    setActiveSubView('dashboard');
                }
            } else {
                setSelectedSystem('user');
                if (activeSubView === 'login') setActiveSubView('discovery');
            }
        }
    }, [user?.isAuthenticated, user?.role, user?.hospital_id, activeSubView]);

    const handleNavClick = (view) => {
        if (view === 'login') {
            setSelectedSystem('user');
            setActiveSubView('login');
            setIsStarted(true);
        } else if (['hospitals', 'doctors', 'appointments', 'discovery', 'medication-hub', 'ai-assistant', 'anatomy-lab'].includes(view)) {
            setSelectedSystem('user');
            setActiveSubView(view);
            setIsStarted(true);
        } else if (view === 'home') {
            setIsStarted(false);
            setSelectedPortal(null);
            if (user?.isAuthenticated) {
                setActiveSubView('discovery');
            }
        } else {
            setActiveSubView(view);
            setIsStarted(true);
        }
    };

    const getActiveContent = () => {
        if (!user?.isAuthenticated) {
            if (!selectedPortal) {
                return <AuthPortalSwitcher onSelectPortal={setSelectedPortal} />;
            }
            return <LoginView portalMode={selectedPortal} onBack={() => setSelectedPortal(null)} />;
        }

        const isProfessional = ['doctor', 'secretary', 'nurse', 'hospital_admin'].includes(user.role);

        const renderProfessionalSystem = () => {
            switch (user.role) {
                case 'doctor':
                    if (activeSubView === 'chat') return <HospitalChat />;
                    return <DoctorDashboard />;
                case 'nurse':
                    if (activeSubView === 'chat') return <HospitalChat />;
                    return <NurseDashboard />;
                case 'secretary':
                    if (activeSubView === 'chat') return <HospitalChat />;
                    if (activeSubView === 'profile') return <CoordinatorDashboard initialTab="profile" />;
                    return <CoordinatorDashboard initialTab="triage" />;
                case 'hospital_admin':
                    if (activeSubView === 'chat') return <HospitalChat />;
                    return <HospitalAdminDashboard />;
                default:
                    return <UserDashboard />;
            }
        };

        if (isProfessional && isStarted) {
            return renderProfessionalSystem();
        }

        if (selectedSystem === 'user') {
            switch (activeSubView) {
                case 'hospitals': return <UserHospitals />;
                case 'appointments': return <UserAppointments />;
                case 'medication-hub': return <MedicationHub />;
                case 'ai-assistant': return <AIAssistant />;
                case 'login': return <LoginView />;
                default: return <UserDashboard />;
            }
        } else if (selectedSystem === 'doctor') {
            switch (activeSubView) {
                case 'ai-assistant': return <AIAssistant />;
                case 'network': return <HospitalNetwork />;
                case 'anatomy-lab': return <BioAnatomyLab />;
                default: return <DoctorProfile doctor={user} />;
            }
        }

        return <UserDashboard />;
    };

    if (!isInitialized) return <div className="loading-screen">Clinical environment initializing...</div>;

    if (isMobileBridge) {
        return <MobileAnatomyBridge />;
    }

    if (selectedSystem === 'pharmacy') {
        return <PharmacyPortal />;
    }

    const configStatus = !!import.meta.env.VITE_SUPABASE_ANON_KEY && !!import.meta.env.VITE_SUPABASE_URL;

    return (
        <Routes>
            <Route path="/prescription/:token" element={<PrescriptionTerminal />} />
            <Route path="*" element={
                <>
                    {isLocked && <LockScreen onUnlock={unlockSession} />}
                    <div style={{
                        position: 'fixed',
                        top: '10px',
                        right: '10px',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            background: configStatus ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: configStatus ? '#4ade80' : '#f87171',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            border: `1px solid ${configStatus ? '#22c55e' : '#ef4444'}`,
                            backdropFilter: 'blur(4px)',
                            fontFamily: 'monospace',
                            textAlign: 'right'
                        }}>
                            SUPABASE: {configStatus ? 'READY' : 'CONFIG_ERROR'}
                        </div>
                        <div style={{
                            background: isBackendOnline ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isBackendOnline ? '#4ade80' : '#f87171',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                            border: `1px solid ${isBackendOnline ? '#22c55e' : '#ef4444'}`,
                            backdropFilter: 'blur(4px)',
                            fontFamily: 'monospace',
                            textAlign: 'right'
                        }}>
                            AI BRAIN: {isBackendOnline ? 'ONLINE' : 'OFFLINE (CHECK TUNNEL)'}
                        </div>
                    </div>

                    {!isStarted ? (
                        <AppLayout onNavClick={handleNavClick} currentView="landing">
                            <LandingPage onGetStarted={() => setIsStarted(true)} />
                        </AppLayout>
                    ) : (
                        ['doctor', 'nurse', 'secretary', 'hospital_admin'].includes(user?.role) ? (
                            getActiveContent()
                        ) : (
                            <AppLayout onNavClick={handleNavClick} currentView={activeSubView}>
                                <div className="system-viewport">
                                    {user?.isAuthenticated && user.role !== 'user' && user.verification_status !== 'APPROVED' ? (
                                        <VerificationPending />
                                    ) : (
                                        getActiveContent()
                                    )}
                                </div>
                            </AppLayout>
                        )
                    )}
                </>
            } />
        </Routes>
    );
}
