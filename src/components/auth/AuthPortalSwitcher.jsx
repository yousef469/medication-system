import React from 'react';

const AuthPortalSwitcher = ({ onSelectPortal }) => {
  return (
    <div className="portal-switcher-overlay">
      <style>{`
        .portal-switcher-overlay {
          position: fixed;
          inset: 0;
          background: #0a0a0c;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
          overflow-y: auto;
          background-image: radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0a0a0c 100%);
        }

        .portal-switcher-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          max-width: 1400px;
          width: 100%;
          animation: fadeInUp 0.8s ease-out;
        }

        .portal-card {
          position: relative;
          height: 600px;
          border-radius: var(--radius-2xl);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--glass-border);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .portal-card:hover {
          transform: translateY(-20px) scale(1.02);
          box-shadow: 0 40px 80px rgba(var(--primary-rgb), 0.3);
          border-color: var(--primary);
        }

        .portal-hero {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.8s ease;
        }

        .portal-card:hover .portal-hero {
          transform: scale(1.1);
        }

        .portal-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--bg-dark) 20%, transparent 80%);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          color: white;
        }

        .portal-badge {
          display: inline-block;
          background: var(--primary);
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1.5rem;
          width: fit-content;
        }

        .portal-card h2 {
          font-size: 3rem;
          font-weight: 900;
          margin-bottom: 1rem;
          line-height: 1.1;
        }

        .portal-card p {
          font-size: 1.1rem;
          opacity: 0.8;
          max-width: 400px;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .portal-btn {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 1rem 2rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          color: white;
          width: fit-content;
          transition: all 0.3s;
        }

        .portal-card:hover .portal-btn {
          background: white;
          color: var(--bg-dark);
          transform: translateX(10px);
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .portal-switcher-container { grid-template-columns: 1fr; }
          .portal-card { height: 400px; }
        }
      `}</style>

      <div className="portal-switcher-container">
        {/* Patient Portal */}
        <div className="portal-card" onClick={() => onSelectPortal('patient')}>
          <div className="portal-hero" style={{ backgroundImage: "url('/patient_portal_hero.png')" }}></div>
          <div className="portal-overlay">
            <span className="portal-badge">Patient Services</span>
            <h2>Personal Healthcare Portal</h2>
            <p>Access your medical history, book appointments, and connect with top doctors instantly.</p>
            <div className="portal-btn">Enter Patient Portal →</div>
          </div>
        </div>

        {/* Professional Portal */}
        <div className="portal-card" onClick={() => onSelectPortal('professional')}>
          <div className="portal-hero" style={{ backgroundImage: "url('/professional_portal_hero.png')" }}></div>
          <div className="portal-overlay">
            <span className="portal-badge" style={{ background: '#7c3aed' }}>Healthcare Provider</span>
            <h2>Clinical Network & Analytics</h2>
            <p>Unified medical ecosystem for hospitals, doctors, and clinics. AI-powered diagnostics and network coordination.</p>
            <div className="portal-btn">Professional Entrance →</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPortalSwitcher;
