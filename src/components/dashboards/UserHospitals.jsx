import React from 'react';
import { useClinical } from '../../context/ClinicalContext';

const UserHospitals = () => {
    const { hospitals } = useClinical();

    return (
        <div className="hospitals-view fade-in">
            <h2 className="text-gradient mb-2">Egyptian Medical Centers</h2>
            <div className="hospitals-grid">
                {hospitals.map(h => (
                    <div key={h.id} className="glass-card hospital-full-card">
                        <div className="hosp-banner" style={{
                            backgroundImage: h.image ? `url(${h.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '200px',
                            borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                        }}></div>
                        <div className="hosp-content">
                            <h3>{h.name}</h3>
                            <p className="location-tag">📍 {h.location}</p>
                            <p className="description">Leading specialized medical care with state-of-the-art facilities and top-tier Egyptian specialists.</p>
                            <div className="stats">
                                <span>⭐ 4.9 Rating</span>
                                <span>🏥 24/7 ER</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .hospitals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2rem;
                }
                .hospital-full-card {
                    padding: 0;
                    overflow: hidden;
                    transition: transform 0.3s;
                }
                .hospital-full-card:hover {
                    transform: translateY(-5px);
                }
                .hosp-content {
                    padding: 1.5rem;
                }
                .location-tag { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem; }
                .description { font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.6; }
                .stats { display: flex; gap: 1.5rem; font-size: 0.8rem; font-weight: 600; color: var(--primary); }
                .mb-2 { margin-bottom: 2rem; }
            `}</style>
        </div>
    );
};

export default UserHospitals;
