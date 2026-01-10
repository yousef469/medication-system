import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import DoctorProfile from './components/doctors/DoctorProfile';
import UserDashboard from './components/dashboards/UserDashboard';
import SecretaryDashboard from './components/dashboards/SecretaryDashboard';
import ITSupportDashboard from './components/dashboards/ITSupportDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';
import LoginView from './components/auth/LoginView';

const MainContent = () => {
  const { user, isInitialized } = useAuth();
  const [selectedSystem, setSelectedSystem] = useState('user');

  if (!isInitialized) return null;

  // Determine which system to show based on selection and auth status
  const getActiveContent = () => {
    // If the selected system is the same as the authenticated role, show the dashboard
    if (user.role === selectedSystem && user.isAuthenticated) {
      switch (selectedSystem) {
        case 'doctor': return <DoctorProfile doctor={mockDoctor} />;
        case 'secretary': return <SecretaryDashboard />;
        case 'it': return <ITSupportDashboard />;
        case 'admin': return <AdminDashboard />;
        default: return <UserDashboard onDoctorSelect={() => setSelectedSystem('doctor')} />;
      }
    }

    // If a professional system is selected but user is not authenticated for it, show login
    if (selectedSystem !== 'user' && user.role !== selectedSystem) {
      return <LoginView targetRole={selectedSystem} />;
    }

    // Default to User Dashboard
    return <UserDashboard onDoctorSelect={() => setSelectedSystem('doctor')} />;
  };

  const mockDoctor = {
    name: "Alexander Vance",
    specialty: "Senior Neurosurgeon • AI Diagnostic Specialist",
    bio: "Pioneering robotic-assisted neurosurgery and integrating local AI models for real-time pathology detection. Committed to precision medicine in our city.",
    followers: "12.4K",
    rating: "4.9/5",
    surgeryCount: "1,240+",
    posts: [
      { date: "2 hours ago", content: "Just completed a successful micro-vessel repair using the new laser-guided system.", likes: 842, image: true },
      { date: "Yesterday", content: "Exciting news: We're beginning the first stage of local AI integration.", likes: 1520, image: false }
    ]
  };

  return (
    <AppLayout>
      <div className="system-selector glass-card">
        <span className="selector-label">Clinical Network:</span>
        <button
          className={selectedSystem === 'user' ? 'active' : ''}
          onClick={() => setSelectedSystem('user')}
        >
          Public Discovery
        </button>
        <button
          className={selectedSystem === 'doctor' ? 'active' : ''}
          onClick={() => setSelectedSystem('doctor')}
        >
          {user.role === 'doctor' ? 'Clinical Feed' : 'Doctor Portal'}
        </button>
        <button
          className={selectedSystem === 'secretary' ? 'active' : ''}
          onClick={() => setSelectedSystem('secretary')}
        >
          {user.role === 'secretary' ? 'Coordination' : 'Secretary Hub'}
        </button>
        <button
          className={selectedSystem === 'it' ? 'active' : ''}
          onClick={() => setSelectedSystem('it')}
        >
          {user.role === 'it' ? 'Engineering' : 'IT Core'}
        </button>
        <button
          className={selectedSystem === 'admin' ? 'active' : ''}
          onClick={() => setSelectedSystem('admin')}
        >
          {user.role === 'admin' ? 'Oversight' : 'Admin Panel'}
        </button>
      </div>

      <div className="system-viewport">
        {getActiveContent()}
      </div>

      <style jsx>{`
        .system-selector {
          margin-bottom: 2rem;
          padding: 0.75rem 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          border-radius: var(--radius-full);
        }

        .selector-label {
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .system-selector button {
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .system-selector button:hover {
          background: var(--glass-highlight);
          color: white;
        }

        .system-selector button.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .system-viewport {
          min-height: 600px;
        }
      `}</style>
    </AppLayout>
  );
};

import { ClinicalProvider } from './context/ClinicalContext';

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
