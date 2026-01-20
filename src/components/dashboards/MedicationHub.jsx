import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const MedicationHub = () => {
    const { hospitals } = useClinical();
    const [searchTerm, setSearchTerm] = useState('');

    const allTreatments = hospitals.flatMap(h =>
        (h.treatments || []).map(t => ({ ...t, hospitalName: h.name, hospitalId: h.id, contact: h.contact || 'N/A' }))
    );

    const filtered = allTreatments.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="medication-hub fade-in">
            <header className="hub-header">
                <h1 className="text-gradient">Medication & Treatment Hub</h1>
                <p className="subtitle">Global search for Egyptian medical facilities, costs, and availability.</p>

                <div className="search-box glass-card">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search for diagnosis, treatment, or hospital..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="results-grid">
                {filtered.map((item, idx) => (
                    <div key={idx} className="glass-card treatment-card">
                        <div className="card-header">
                            <h3>{item.name}</h3>
                            <span className="cost-tag">{item.cost}</span>
                        </div>
                        <div className="card-body">
                            <p className="hosp-name">🏥 {item.hospitalName}</p>
                            <p className="contact">📞 {item.contact}</p>
                        </div>
                        <button className="btn-secondary w-full">Request This Treatment</button>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="no-results glass-card">
                        <p>No matches found. Try searching for "Heart", "Cancer", or "Brain Surgery".</p>
                    </div>
                )}
            </div>

            <style>{`
        .medication-hub { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .hub-header { text-align: center; margin-bottom: 4rem; }
        .search-box { 
          max-width: 600px; 
          margin: 2rem auto 0; 
          display: flex; 
          align-items: center; 
          padding: 0.5rem 1.5rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--primary-glow);
        }
        .search-icon { font-size: 1.2rem; margin-right: 1rem; }
        .search-box input { 
          flex: 1; 
          background: transparent; 
          border: none; 
          color: white; 
          padding: 0.8rem 0; 
          outline: none; 
          font-size: 1.1rem;
        }

        .results-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 1.5rem; 
        }

        @media (max-width: 768px) {
          .medication-hub { padding: 1rem; }
          .hub-header { margin-bottom: 2rem; }
          .treatment-card { padding: 1.5rem; }
        }
      `}</style>
        </div>
    );
};

export default MedicationHub;
