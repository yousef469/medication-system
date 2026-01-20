import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const EmergencyOverlay = ({ isOpen, onClose }) => {
  const { logEvent } = useClinical();
  const [step, setStep] = useState('confirm'); // confirm | alerting | success

  const handleSOS = async () => {
    setStep('alerting');

    // Simulate location fetch & alert routing
    setTimeout(async () => {
      await logEvent("EMERGENCY: SOS Triggered. Location: Maadi, Cairo (Simulated). Nearest Facility: Al-Salam International.", "CRITICAL");
      setStep('success');
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="emergency-overlay">
      <div className="overlay-blur" onClick={onClose}></div>
      <div className="emergency-modal glass-card">
        {step === 'confirm' && (
          <div className="content fade-in">
            <div className="sos-icon-large">🆘</div>
            <h2>Immediate Assistance?</h2>
            <p>One tap will alert the nearest medical facility and route an ambulance to your current location.</p>
            <div className="actions">
              <button className="btn-sos" onClick={handleSOS}>CALL AMBULANCE NOW</button>
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {step === 'alerting' && (
          <div className="content fade-in">
            <div className="loading-spinner"></div>
            <h2>Establishing Connection...</h2>
            <p>Locating nearest facility and sharing your medical profile.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="content fade-in">
            <div className="success-icon">🚑</div>
            <h2>Help is on the way!</h2>
            <p>An ambulance from <strong>Al-Salam International</strong> has been dispatched. ETA: 8 minutes.</p>
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>

      <style>{`
        .emergency-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .overlay-blur {
          position: absolute;
          inset: 0;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(8px);
        }
        .emergency-modal {
          position: relative;
          z-index: 10;
          max-width: 500px;
          width: 100%;
          padding: 3rem;
          text-align: center;
          border: 2px solid #ef4444;
          box-shadow: 0 0 50px rgba(239, 68, 68, 0.3);
        }
        
        .sos-icon-large { font-size: 5rem; margin-bottom: 2rem; animation: pulse-red 2s infinite; }
        .success-icon { font-size: 5rem; margin-bottom: 2rem; }
        
        h2 { font-size: 2rem; margin-bottom: 1rem; color: white; }
        p { color: var(--text-secondary); margin-bottom: 2.5rem; line-height: 1.6; }
        
        .actions { display: flex; flex-direction: column; gap: 1rem; }
        
        .btn-sos {
          background: #ef4444;
          color: white;
          border: none;
          padding: 1.5rem;
          border-radius: var(--radius-md);
          font-size: 1.25rem;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn-sos:hover { transform: scale(1.02); background: #dc2626; }

        @keyframes pulse-red {
          0% { transform: scale(1); filter: drop-shadow(0 0 0px #ef4444); }
          50% { transform: scale(1.1); filter: drop-shadow(0 0 20px #ef4444); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0px #ef4444); }
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid var(--glass-border);
          border-top-color: #ef4444;
          border-radius: 50%;
          margin: 0 auto 2rem;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default EmergencyOverlay;
