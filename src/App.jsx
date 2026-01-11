import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import DoctorProfile from './components/doctors/DoctorProfile';
import UserDashboard from './components/dashboards/UserDashboard';
import SecretaryDashboard from './components/dashboards/SecretaryDashboard';
import ITSupportDashboard from './components/dashboards/ITSupportDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import LoginView from './components/auth/LoginView';
import UserHospitals from './components/dashboards/UserHospitals';
import UserDoctors from './components/dashboards/UserDoctors';
import UserAppointments from './components/dashboards/UserAppointments';

import LandingPage from './components/dashboards/LandingPage';
import MedicationHub from './components/dashboards/MedicationHub';
import { ClinicalProvider } from './context/ClinicalContext';

const MainContent = () => {
  const { user, isInitialized } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState('user');
  const [activeSubView, setActiveSubView] = useState('discovery');

  // Automatically start if authenticated (handles OAuth redirect)
  useEffect(() => {
    if (user?.isAuthenticated) {
      setIsStarted(true);
    }
  }, [user?.isAuthenticated]);

  if (!isInitialized) return null;

  // 1. Landing Mode for Guests
  if (!user?.isAuthenticated && !isStarted) {
    return (
      <AppLayout onNavClick={() => setIsStarted(true)} currentView="landing">
        <LandingPage onGetStarted={() => setIsStarted(true)} />
      </AppLayout>
    );
  }

  const handleNavClick = (view) => {
    if (view === 'login') {
      setSelectedSystem('user');
      setActiveSubView('login');
    } else if (['hospitals', 'doctors', 'appointments', 'discovery', 'medication-hub', 'ai-assistant'].includes(view)) {
      setSelectedSystem('user');
      setActiveSubView(view);
    } else if (view === 'home') {
      setIsStarted(false);
      if (user?.isAuthenticated) {
        setActiveSubView('discovery');
      }
    }
  };

  const getActiveContent = () => {
    // 2. Auth Required View
    if (!user.isAuthenticated) {
      return <LoginView targetRole={selectedSystem} />;
    }

    // 3. Authenticated System Routing
    if (user.role === selectedSystem) {
      switch (selectedSystem) {
        case 'doctor': return <DoctorProfile doctor={mockDoctor} />;
        case 'secretary': return <SecretaryDashboard />;
        case 'it': return <ITSupportDashboard />;
        case 'admin': return <AdminDashboard />;
      }
    }

    // 4. Default User Discovery System
    if (selectedSystem === 'user') {
      switch (activeSubView) {
        case 'hospitals': return <UserHospitals />;
        case 'appointments': return <UserAppointments />;
        case 'medication-hub': return <MedicationHub />;
        case 'ai-assistant': return <AIAssistant />;
        case 'login': return <LoginView />;
        default: return <UserDashboard />;
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

  return (
    <AppLayout onNavClick={handleNavClick} currentView={activeSubView}>
      <div className="system-viewport">
        {getActiveContent()}
      </div>

      <style jsx>{`
        .system-viewport {
          min-height: 600px;
          padding-bottom: 4rem;
        }
      `}</style>
    </AppLayout>
  );
};


function App() {
  return (
    <AuthProvider>
      <ClinicalProvider>
        <MainContent />
      </ClinicalProvider>
    </AuthProvider>
  );
}

export default App;
