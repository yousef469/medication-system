import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import AppLayout from './components/layout/AppLayout';
import DoctorWorkstation from './components/doctors/DoctorWorkstation';
import UserDashboard from './components/dashboards/UserDashboard';
import SecretaryDashboard from './components/dashboards/SecretaryDashboard';
import ITSupportDashboard from './components/dashboards/ITSupportDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import LoginView from './components/auth/LoginView';
import AuthPortalSwitcher from './components/auth/AuthPortalSwitcher';
import UserHospitals from './components/dashboards/UserHospitals';
import UserDoctors from './components/dashboards/UserDoctors';
import UserAppointments from './components/dashboards/UserAppointments';
import AIAssistant from './components/dashboards/AIAssistant';
import HospitalNetwork from './components/dashboards/HospitalNetwork';
import HospitalAdminDashboard from './components/dashboards/HospitalAdminDashboard';
import HospitalChat from './components/dashboards/HospitalChat';
import NurseDashboard from './components/dashboards/NurseDashboard';
import CoordinatorDashboard from './components/dashboards/CoordinatorDashboard';
import LockScreen from './components/auth/LockScreen';
import ProfessionalSidebar from './components/layout/ProfessionalSidebar';

import LandingPage from './components/dashboards/LandingPage';
import MedicationHub from './components/dashboards/MedicationHub';
import BioAnatomyLab from './components/dashboards/BioAnatomyLab';
import VerificationPending from './components/auth/VerificationPending';
import MobileAnatomyBridge from './components/mobile/MobileAnatomyBridge';
import { ClinicalProvider } from './context/ClinicalContext';
import { ThemeProvider } from './context/ThemeContext';

// Demo Data
const mockDoctor = {
  name: "Dr. Sarah Miller",
  specialty: "Cardiologist",
  hospital: "St. Mary's Hospital",
  image: "https://randomuser.me/api/portraits/women/44.jpg",
  stats: { patients: 12, rating: 4.8, reviews: 154 }
};

const MainContent = () => {
  // Force HMR Refresh: 2026-01-18T02:07:00Z
  const { user: authUser, login, logout, isInitialized, isLocked, unlockSession } = useAuth();
  const user = authUser || { role: 'user', name: 'Guest', isAuthenticated: false, verification_status: 'APPROVED' };
  const [isStarted, setIsStarted] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState('user');
  const [activeSubView, setActiveSubView] = useState('discovery');
  const [selectedPortal, setSelectedPortal] = useState(null);

  // Automatically start if authenticated (handles OAuth redirect)
  useEffect(() => {
    // Check for Invite Link (Legacy or Secure Token)
    const params = new URLSearchParams(window.location.search);
    if (params.get('invite') || params.get('token')) {
      console.log("[App] Invitation token/link detected, switching to Professional Portal");
      setSelectedPortal('professional');
    }

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
  }, [user?.isAuthenticated, user?.role]);


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
          return <DoctorWorkstation />;
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
      return (
        <div className="professional-layout" style={{ display: 'flex', width: '100%', minHeight: '100vh', background: '#000212' }}>
          <ProfessionalSidebar
            activeTab={activeSubView === 'hospital-chat' || activeSubView === 'chat' ? 'chat' : activeSubView === 'profile' ? 'profile' : 'dashboard'}
            onTabChange={(tab) => {
              if (tab === 'chat') setActiveSubView('chat');
              else if (tab === 'profile') setActiveSubView('profile');
              else setActiveSubView('dashboard');
            }}
          />
          <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            {renderProfessionalSystem()}
          </main>
        </div>
      );
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

  const mockDoctor = {
    name: "Alexander Vance",
    specialty: "Senior Neurosurgeon • AI Diagnostic Specialist",
    bio: "Pioneering robotic-assisted neurosurgery and integrating local AI models.",
    followers: "12.4K",
    rating: "4.9/5",
    surgeryCount: "1,240+",
    posts: []
  };

  if (!isInitialized) return <div className="loading-screen">Clinical environment initializing...</div>;

  // Mobile Bridge Detect (Embedded Mode for Android)
  const isMobileBridge = new URLSearchParams(window.location.search).get('mobile') === 'true';
  if (isMobileBridge) {
    return <MobileAnatomyBridge />;
  }

  const configStatus = !!import.meta.env.VITE_SUPABASE_ANON_KEY && !!import.meta.env.VITE_SUPABASE_URL;

  return (
    <>
      {isLocked && <LockScreen onUnlock={unlockSession} />}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        background: configStatus ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        color: configStatus ? '#4ade80' : '#f87171',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        border: `1px solid ${configStatus ? '#22c55e' : '#ef4444'}`,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
        fontFamily: 'monospace'
      }}>
        SUPABASE: {configStatus ? 'CONNECTED' : 'CONFIG_MISSING'}
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
  );
};


import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ClinicalProvider>
          <ThemeProvider>
            <MainContent />
          </ThemeProvider>
        </ClinicalProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
