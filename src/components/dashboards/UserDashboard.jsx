import React, { useState, useRef } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const UserDashboard = () => {
  const { hospitals, submitRequest } = useClinical();
  const [requestContent, setRequestContent] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('57357 Children\'s Cancer Hospital');
  const [urgency, setUrgency] = useState('NEXT HOUR');
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleRequest = (e) => {
    e.preventDefault();
    submitRequest("John Doe", selectedHospital, requestContent, urgency, 'text');
    setSubmitted(true);
    setRequestContent('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="user-dashboard">
      <header className="page-header">
        <h1 className="text-gradient">Egyptian Medical Discovery</h1>
        <p className="subtitle">Expert clinical care across Egypt - From Cairo to Aswan</p>
      </header>

      <div className="main-discovery-layout">
        <section className="request-portal glass-card">
          <h3>Emergency & Diagnostic Portal</h3>
          <p className="section-desc">Submit text, files, or voice for immediate AI triage & routing.</p>

          <form onSubmit={handleRequest} className="request-form">
            <div className="form-group">
              <label>Target Facility</label>
              <select value={selectedHospital} onChange={(e) => setSelectedHospital(e.target.value)}>
                {hospitals.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Diagnosis Request / Symptoms</label>
              <div className="input-with-tools">
                <textarea
                  placeholder="Describe your situation in words, or use tools below..."
                  value={requestContent}
                  onChange={(e) => setRequestContent(e.target.value)}
                  required
                ></textarea>
                <div className="form-tools">
                  <button type="button" className={`tool-btn ${isRecording ? 'recording' : ''}`} onClick={() => setIsRecording(!isRecording)}>
                    {isRecording ? '⏹ Recording...' : '🎤 Voice'}
                  </button>
                  <button type="button" className="tool-btn" onClick={() => fileInputRef.current.click()}>
                    📁 Attach Files
                  </button>
                  <input type="file" ref={fileInputRef} hidden />
                </div>
              </div>
            </div>

            <div className="urgency-selector">
              <label>Response Tier</label>
              <div className="tier-grid">
                {['IMMEDIATE', 'NEXT HOUR', 'SCHEDULED'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`tier-btn ${urgency === t ? 'active' : ''} ${t.toLowerCase().replace(' ', '')}`}
                    onClick={() => setUrgency(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-1">
              {submitted ? '✓ Request Transmitted' : 'Submit Diagnostic Request'}
            </button>
          </form>
        </section>

        <section className="highlights">
          <h3>Top Care Centers in Egypt</h3>
          <div className="hospitals-scroll">
            {hospitals.map(h => (
              <div key={h.id} className="glass-card hospital-mini-card">
                <div className="hosp-img-placeholder" style={{
                  backgroundImage: h.image ? `url(${h.image})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '120px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}></div>
                <h4>{h.name}</h4>
                <p className="hosp-loc">📍 {h.location}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .user-dashboard { display: flex; flex-direction: column; gap: 2rem; }
        .main-discovery-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        
        .request-portal { padding: 2rem; border: 1px solid var(--primary-glow); }
        .section-desc { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 2rem; }

        .request-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; }
        
        .form-group select, textarea {
          width: 100%;
          background: var(--glass-highlight);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: white;
          padding: 0.8rem;
          outline: none;
        }

        textarea { height: 120px; resize: none; }
        
        .input-with-tools { position: relative; }
        .form-tools { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .tool-btn { 
          font-size: 0.75rem; 
          background: var(--glass-highlight); 
          border: 1px solid var(--glass-border); 
          color: white; 
          padding: 0.4rem 0.8rem; 
          border-radius: var(--radius-full);
          cursor: pointer;
        }
        .tool-btn.recording { background: #ef4444; border-color: #ef4444; animation: pulse 1s infinite; }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .urgency-selector label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; }
        .tier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .tier-btn {
          padding: 0.8rem;
          font-size: 0.7rem;
          font-weight: 700;
          background: var(--glass-highlight);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tier-btn.active.immediate { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
        .tier-btn.active.nexthour { background: rgba(245, 158, 11, 0.2); border-color: var(--accent); color: var(--accent); }
        .tier-btn.active.scheduled { background: rgba(16, 185, 129, 0.2); border-color: var(--secondary); color: var(--secondary); }

        .hospitals-scroll { display: flex; flex-direction: column; gap: 1.5rem; }
        .hospital-mini-card { padding: 1rem; }
        .hosp-loc { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }
        .mini-tags { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
        .m-tag { font-size: 0.65rem; background: var(--glass-highlight); padding: 0.2rem 0.5rem; border-radius: 4px; color: var(--text-secondary); }

        .w-full { width: 100%; }
        .mt-1 { margin-top: 1rem; }
      `}</style>
    </div>
  );
};

export default UserDashboard;
