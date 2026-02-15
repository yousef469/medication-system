import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ClinicalProvider, useClinical } from './context/ClinicalContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy Loaded Components
const AppLayout = lazy(() => import('./components/layout/AppLayout'));
const DoctorDashboard = lazy(() => import('./components/dashboards/DoctorDashboard'));
const DoctorProfile = lazy(() => import('./components/doctors/DoctorProfile'));
const UserDashboard = lazy(() => import('./components/dashboards/UserDashboard'));
const SecretaryDashboard = lazy(() => import('./components/dashboards/SecretaryDashboard'));
const ITSupportDashboard = lazy(() => import('./components/dashboards/ITSupportDashboard'));
const AdminDashboard = lazy(() => import('./components/dashboards/AdminDashboard'));
const LoginView = lazy(() => import('./components/auth/LoginView'));
const AuthPortalSwitcher = lazy(() => import('./components/auth/AuthPortalSwitcher'));
const UserHospitals = lazy(() => import('./components/dashboards/UserHospitals'));
const UserDoctors = lazy(() => import('./components/dashboards/UserDoctors'));
const UserAppointments = lazy(() => import('./components/dashboards/UserAppointments'));
const AIAssistant = lazy(() => import('./components/dashboards/AIAssistant'));
const HospitalNetwork = lazy(() => import('./components/dashboards/HospitalNetwork'));
const HospitalAdminDashboard = lazy(() => import('./components/dashboards/HospitalAdminDashboard'));
const HospitalChat = lazy(() => import('./components/dashboards/HospitalChat'));
const NurseDashboard = lazy(() => import('./components/dashboards/NurseDashboard'));
const CoordinatorDashboard = lazy(() => import('./components/dashboards/CoordinatorDashboard'));
const LockScreen = lazy(() => import('./components/auth/LockScreen'));
const LandingPage = lazy(() => import('./components/dashboards/LandingPage'));
const MedicationHub = lazy(() => import('./components/dashboards/MedicationHub'));
const BioAnatomyLab = lazy(() => import('./components/dashboards/BioAnatomyLab'));
const VerificationPending = lazy(() => import('./components/auth/VerificationPending'));
const MobileAnatomyBridge = lazy(() => import('./components/mobile/MobileAnatomyBridge'));
const PharmacyPortal = lazy(() => import('./components/dashboards/PharmacyPortal'));
const PrescriptionTerminal = lazy(() => import('./components/shared/PrescriptionTerminal'));

const CURRENT_RELEASE = "v4.1.2"; // Structural Decoupling Fix

// [ErrorBoundary logic removed - moved to separate file]

function MainContent() {
  // Force HMR Refresh: 2026-01-18T02:07:00Z
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

  // Mobile Bridge Detect (Embedded Mode for Android)
  const queryParams = new URLSearchParams(window.location.search);
  const isMobileBridge = queryParams.get('mobile') === 'true';

  // Initial Route Check (Run Once)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (window.location.pathname === '/pharmacy') {
      setSelectedSystem('pharmacy');
      setIsStarted(true);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (user?.isAuthenticated) {
      console.log("[App] Auto-routing for:", user.role);
      setIsStarted(true);
      const role = user.role || 'user';
      if (['doctor', 'secretary', 'it', 'admin', 'hospital_admin', 'nurse'].includes(role)) {
        setSelectedSystem(role);
        // Priority Route: If hospital staff, directly to Team Hub (Ecosystem)
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
      // Handle contextual views (hospital-chat, management, etc.)
      setActiveSubView(view);
      setIsStarted(true);
    }
  };

  const getActiveContent = () => {
    // 2. Auth Required View
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

    // 4. Default User Discovery System (Patient)
    if (selectedSystem === 'user') {
      switch (activeSubView) {
        case 'hospitals': return <UserHospitals />;
        case 'appointments': return <UserAppointments />;
        case 'medication-hub': return <MedicationHub />;
        case 'ai-assistant': return <AIAssistant />;
        // anatomy-lab REMOVED for patients
        case 'login': return <LoginView />;
        default: return <UserDashboard />;
      }
    } else if (selectedSystem === 'doctor') {
      // Fallback for non-started or legacy routes
      switch (activeSubView) {
        case 'ai-assistant': return <AIAssistant />;
        case 'network': return <HospitalNetwork />;
        case 'anatomy-lab': return <BioAnatomyLab />; // Professionals can see it
        default: return <DoctorProfile doctor={user} />;
      }
    }

    return <UserDashboard />;
  };

  if (!isInitialized) return <div className="loading-screen">Clinical environment initializing...</div>;

  if (isMobileBridge) {
    return <MobileAnatomyBridge />;
  }

  // PUBLIC PHARMACY ROUTE
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

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <ClinicalProvider>
              <ThemeProvider>
                <Suspense fallback={<div className="loading-screen">Clinical modules loading...</div>}>
                  <MainContent />
                </Suspense>
              </ThemeProvider>
            </ClinicalProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
