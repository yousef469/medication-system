import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const SecretaryDashboard = () => {
  const { requests, doctors, routeToDoctor } = useClinical();
  const [filterHospital, setFilterHospital] = useState('All');
  const [filterSection, setFilterSection] = useState('All');

  const pendingRequests = requests.filter(r => r.status === 'PENDING_SECRETARY');

  const filteredRequests = pendingRequests.filter(r =>
    (filterHospital === 'All' || r.hospital === filterHospital) &&
    (filterSection === 'All' || r.section === filterSection)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return '#10b981';
      case 'Busy': return '#f59e0b';
      case 'Vacation': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  const hospitals = ['All', ...new Set(requests.map(r => r.hospital))];
  const sections = ['All', ...new Set(requests.map(r => r.section))];

  return (
    <div className="secretary-dashboard">
      <header className="page-header">
        <h1 className="text-gradient">Medical Coordination Hub</h1>
        <p className="subtitle">Route patients to specialized care facilities based on AI triage</p>
      </header>

      <div className="coordination-grid">
        <section className="requests-column glass-card">
          <div className="section-header-row">
            <h3>Diagnostic Queue</h3>
            <div className="filters">
              <select value={filterHospital} onChange={(e) => setFilterHospital(e.target.value)}>
                {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="request-list">
            {filteredRequests.length === 0 ? (
              <p className="empty-state">No pending requests for selected filters.</p>
            ) : (
              filteredRequests.map(req => (
                <div key={req.id} className={`request-card glass-card ${req.urgency.toLowerCase().replace(' ', '')}`}>
                  <div className="req-main">
                    <span className="req-patient">{req.patient_name}</span>
                    <span className="req-diagnosis">{req.diagnosis}</span>
                    <div className="req-meta">
                      <span className="hospital-tag">{req.hospital}</span>
                      <span className="section-tag">{req.section}</span>
                    </div>
                  </div>
                  <div className="req-triage">
                    <span className={`urgency-badge ${req.urgency.toLowerCase().replace(' ', '')}`}>
                      {req.urgency}
                    </span>
                    <div className="routing-actions">
                      <select onChange={(e) => routeToDoctor(req.id, e.target.value)} defaultValue="">
                        <option value="" disabled>Route to Doctor...</option>
                        {doctors
                          .filter(d => d.hospital === req.hospital && d.specialty === req.section)
                          .map(d => (
                            <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>
                              {d.name} ({d.status})
                            </option>
                          ))}
                        {doctors
                          .filter(d => d.hospital === req.hospital && d.specialty !== req.section)
                          .map(d => (
                            <option key={d.id} value={d.id} disabled={d.status !== 'Available'}>
                              [Alt] {d.name} - {d.specialty}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="doctors-column">
          <div className="glass-card status-card">
            <h3>Specialist Availability</h3>
            <div className="doctor-status-list">
              {doctors.map(doc => (
                <div key={doc.id} className="doc-status-item">
                  <div className="doc-info">
                    <span className="doc-name">Dr. {doc.name}</span>
                    <span className="doc-spec">{doc.specialty} • {doc.hospital}</span>
                  </div>
                  <span className="status-indicator" style={{ background: getStatusColor(doc.status) }}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .secretary-dashboard { display: flex; flex-direction: column; gap: 2rem; }
        .coordination-grid { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; }
        
        .section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .filters { display: flex; gap: 0.5rem; }
        .filters select { 
          background: var(--glass-highlight); 
          border: 1px solid var(--glass-border); 
          color: white; 
          font-size: 0.75rem; 
          padding: 0.3rem 0.6rem; 
          border-radius: 4px;
          outline: none;
        }

        .request-list { display: flex; flex-direction: column; gap: 1rem; }
        .request-card { 
          padding: 1.25rem; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border-left: 4px solid transparent; 
        }
        
        .request-card.immediate { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
        .request-card.nexthour { border-left-color: var(--accent); }
        
        .req-main { display: flex; flex-direction: column; gap: 0.25rem; }
        .req-patient { font-weight: 700; color: white; }
        .req-diagnosis { font-size: 0.85rem; color: var(--text-secondary); }
        .req-meta { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .hospital-tag, .section-tag { 
          font-size: 0.65rem; 
          background: var(--glass-highlight); 
          padding: 0.1rem 0.4rem; 
          border-radius: 3px; 
          color: var(--primary); 
          font-weight: 600;
        }

        .req-triage { display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; }
        .urgency-badge { 
          font-size: 0.65rem; 
          font-weight: 800; 
          padding: 0.2rem 0.5rem; 
          border-radius: 4px; 
          text-transform: uppercase;
        }
        .urgency-badge.immediate { background: #ef4444; color: white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.3); }
        .urgency-badge.nexthour { background: var(--accent); color: white; }
        .urgency-badge.scheduled { background: var(--secondary); color: white; }

        .routing-actions select {
          padding: 0.4rem 0.8rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          cursor: pointer;
        }

        .doctor-status-list { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1.5rem; }
        .doc-status-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid var(--glass-border); }
        .doc-info { display: flex; flex-direction: column; gap: 0.1rem; }
        .doc-name { font-weight: 600; font-size: 0.9rem; }
        .doc-spec { font-size: 0.75rem; color: var(--text-muted); }
        .status-indicator { font-size: 0.65rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; color: white; }

        .empty-state { text-align: center; color: var(--text-muted); padding: 3rem; font-style: italic; }
      `}</style>
    </div>
  );
};

export default SecretaryDashboard;
