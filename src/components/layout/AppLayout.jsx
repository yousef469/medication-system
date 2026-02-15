import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import EmergencyOverlay from '../common/EmergencyOverlay';

const AppLayout = ({ children, onNavClick, currentView }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const role = user?.role || 'user';
  const isGuest = role === 'user' && !user?.isAuthenticated;

  const getSystemConfig = () => {
    switch (role) {
      case 'doctor': return { name: 'Clinical System', color: 'var(--secondary)', icon: '🏥' };
      case 'secretary': return { name: 'Linker Hub', color: 'var(--accent)', icon: '📋' };
      case 'it': return { name: 'Engineering', color: 'var(--primary)', icon: '⚙️' };
      case 'admin': return { name: 'Executive', color: '#f43f5e', icon: '💎' };
      case 'hospital_admin': return { name: 'Management', color: 'var(--accent)', icon: '🏢' };
      default: return { name: 'Health Discovery', color: 'var(--primary)', icon: '🌐' };
    }
  };

  const config = getSystemConfig();

  return (
    <div className={`app-container system-${role} ${isRTL ? 'rtl' : 'ltr'}`}>
      <EmergencyOverlay isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />

      <button
        className="nav-mobile-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          position: 'fixed',
          top: '20px',
          left: isRTL ? 'auto' : '20px',
          right: isRTL ? '20px' : 'auto',
          zIndex: 1100,
          background: 'var(--primary)',
          border: 'none',
          padding: '8px',
          borderRadius: '8px',
          display: 'none'
        }}
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      <nav className={`glass-card main-nav ${isMenuOpen ? 'menu-open' : ''}`}>
        <div className="nav-logo" onClick={() => { onNavClick?.('home'); setIsMenuOpen(false); }} style={{ cursor: 'pointer' }}>
          <span className="system-icon-nav">{config.icon}</span>
          <span className="text-gradient">Medi{config.name}</span>
        </div>

        <div className="nav-links">
          {currentView !== 'landing' && (
            <>
              {role === 'user' && (
                <>
                  <button
                    className={`nav-link-btn ${currentView === 'discovery' ? 'active' : ''}`}
                    onClick={() => { onNavClick?.('discovery'); setIsMenuOpen(false); }}
                  >
                    {t('triage_hub')}
                  </button>
                  <button
                    className={`nav-link-btn ${currentView === 'medication-hub' ? 'active' : ''}`}
                    onClick={() => { onNavClick?.('medication-hub'); setIsMenuOpen(false); }}
                  >
                    {t('medication_hub')}
                  </button>
                  <button
                    className={`nav-link-btn ${currentView === 'anatomy-lab' ? 'active' : ''}`}
                    onClick={() => { onNavClick?.('anatomy-lab'); setIsMenuOpen(false); }}
                  >
                    🧬 Anatomy Lab
                  </button>
                  <button
                    className={`nav-link-btn ${currentView === 'ai-assistant' ? 'active' : ''}`}
                    onClick={() => { onNavClick?.('ai-assistant'); setIsMenuOpen(false); }}
                  >
                    {t('ai_assistant')}
                  </button>
                  {!isGuest && (
                    <>
                      <button
                        className={`nav-link-btn ${currentView === 'hospitals' ? 'active' : ''}`}
                        onClick={() => { onNavClick?.('hospitals'); setIsMenuOpen(false); }}
                      >
                        {t('hospitals')}
                      </button>
                      <button
                        className={`nav-link-btn ${currentView === 'appointments' ? 'active' : ''}`}
                        onClick={() => { onNavClick?.('appointments'); setIsMenuOpen(false); }}
                      >
                        {t('appointments')}
                      </button>
                    </>
                  )}
                </>
              )}
              {role !== 'user' && (
                <button
                  className={`nav-link-btn ${currentView === 'network' ? 'active' : ''}`}
                  onClick={() => { onNavClick?.('network'); setIsMenuOpen(false); }}
                >
                  {t('hospital_network')}
                </button>
              )}
            </>
          )}
        </div>

        <div className="nav-profile">
          <select
            className="lang-switcher"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="ar">🇦🇪 AR</option>
            <option value="en">🇺🇸 EN</option>
          </select>

          {(!isGuest || currentView !== 'landing') && !['doctor', 'nurse', 'hospital_admin', 'secretary', 'it'].includes(role) && (
            <button className="sos-pill" onClick={() => setIsSOSOpen(true)}>
              <span>🆘</span> {t('sos')}
            </button>
          )}

          {isGuest ? (
            <button className="btn-login-nav" onClick={() => onNavClick?.('login')}>
              {t('sign_in')}
            </button>
          ) : (
            <>
              <button className="btn-logout" onClick={logout} title="Logout">
                ✕
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="content-area">
        {children}
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .nav-mobile-toggle { display: block !important; }
          .main-nav {
            position: fixed !important;
            flex-direction: column !important;
            height: auto !important;
            padding: 2rem !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            transform: translateY(-100%) !important;
            border-radius: 0 !important;
            transition: transform 0.3s ease !important;
            gap: 2rem;
            background: var(--bg-surface) !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
          }
          .main-nav.menu-open {
            transform: translateY(0) !important;
          }
          .nav-links {
            flex-direction: column;
            width: 100%;
            gap: 1rem !important;
          }
          .nav-link-btn { width: 100%; text-align: center; padding: 1rem !important; }
          .nav-profile { width: 100%; justify-content: space-between; border-top: 1px solid var(--glass-border); padding-top: 1.5rem; }
          .app-container { padding-top: 0 !important; overflow-x: hidden; }
          .content-area { padding: 1rem !important; width: 100% !important; box-sizing: border-box; }
        }
        .app-container {
          padding-top: 80px;
          min-height: 100vh;
          transition: background 0.5s ease;
        }
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }

        .lang-switcher {
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--glass-border);
          color: white;
          padding: 0.2rem;
          border-radius: 4px;
          cursor: pointer;
        }

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

        .nav-link-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
        }

        .nav-link-btn:hover, .nav-link-btn.active {
          color: white;
          background: var(--glass-highlight);
          text-shadow: 0 0 10px var(--primary-glow);
        }

        .btn-login-nav {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-full);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px var(--primary-glow-low);
        }

        .btn-login-nav:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px var(--primary-glow);
        }

        .sos-pill {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          font-weight: 800;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          animation: sos-glow 2s infinite;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
        }

        @keyframes sos-glow {
          0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
          100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4); }
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

        .pending-verification-overlay {
          max-width: 600px;
          margin: 4rem auto;
          padding: 4rem;
          text-align: center;
          border-top: 4px solid var(--accent);
        }
        .verification-content .anim-icon { font-size: 4rem; display: block; margin-bottom: 1.5rem; animation: pulse 2s infinite; }
        .status-steps { display: flex; justify-content: center; gap: 1rem; margin: 2rem 0; }
        .step { font-size: 0.7rem; background: var(--glass-highlight); padding: 0.5rem 1rem; border-radius: 20px; color: var(--text-muted); }
        .step.completed { background: var(--secondary); color: white; }
        .step.pulse { border: 1px solid var(--accent); color: var(--accent); animation: border-pulse 2s infinite; }
        
        @keyframes border-pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

        @keyframes entrance {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
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
