import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'user';

  const getSystemConfig = () => {
    switch (role) {
      case 'doctor': return { name: 'Clinical System', color: 'var(--secondary)', icon: '🏥' };
      case 'secretary': return { name: 'Linker Hub', color: 'var(--accent)', icon: '📋' };
      case 'it': return { name: 'Engineering', color: 'var(--primary)', icon: '⚙️' };
      case 'admin': return { name: 'Executive', color: '#f43f5e', icon: '💎' };
      default: return { name: 'Health Discovery', color: 'var(--primary)', icon: '🌐' };
    }
  };

  const config = getSystemConfig();

  return (
    <div className={`app-container system-${role}`}>
      <nav className="glass-card main-nav">
        <div className="nav-logo">
          <span className="system-icon-nav">{config.icon}</span>
          <span className="text-gradient">Medi{config.name}</span>
        </div>

        <div className="nav-links">
          {role === 'user' && (
            <>
              <a href="#hospitals">Hospitals</a>
              <a href="#doctors">Find Doctors</a>
              <a href="#appointments">My Appointments</a>
            </>
          )}
          {role === 'doctor' && (
            <>
              <a href="#profile">Clinical Feed</a>
              <a href="#patients">Patient Cases</a>
              <a href="#diagnostics">Local AI Lab</a>
            </>
          )}
          {role === 'secretary' && (
            <>
              <a href="#queue">Patient Queue</a>
              <a href="#schedules">Doctor Rosters</a>
            </>
          )}
        </div>

        <div className="nav-profile">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="role-tag" style={{ color: config.color, borderColor: config.color + '44' }}>
              {role}
            </span>
          </div>
          {role !== 'user' && (
            <button className="btn-logout" onClick={logout} title="Secure Logout">
              ✕
            </button>
          )}
        </div>
      </nav>

      <main className="content-area">
        {children}
      </main>

      <style jsx>{`
        .app-container {
          padding-top: 80px;
          min-height: 100vh;
          transition: background 0.5s ease;
        }

        /* Unique atmosphere for each system */
        .system-doctor { background: radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.05), transparent 50%); }
        .system-it { background: radial-gradient(circle at 100% 0%, rgba(14, 165, 233, 0.05), transparent 50%); }
        .system-admin { background: radial-gradient(circle at 100% 0%, rgba(244, 63, 94, 0.05), transparent 50%); }

        .main-nav {
          position: fixed;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          width: 95%;
          max-width: 1400px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.5rem;
          z-index: 1000;
          border-radius: var(--radius-full);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .nav-links {
          display: flex;
          gap: 2rem;
        }

        .nav-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-links a:hover {
          color: white;
          text-shadow: 0 0 10px var(--primary-glow);
        }

        .nav-profile {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .role-tag {
          font-size: 0.65rem;
          background: var(--glass-highlight);
          padding: 0.1rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: 1px solid transparent;
        }

        .btn-logout {
          background: var(--glass-highlight);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.75rem;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-color: #ef444444;
        }

        .content-area {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AppLayout;
