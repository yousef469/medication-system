import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const UserDoctors = () => {
    const { doctors } = useClinical();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="doctors-view fade-in">
            <h2 className="text-gradient mb-2">Find Egyptian Specialists</h2>

            <div className="search-box glass-card mb-2">
                <input
                    type="text"
                    placeholder="Search by name, specialty, or condition..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="doctors-list">
                {filteredDoctors.map(d => (
                    <div key={d.id} className="glass-card doctor-entry">
                        <div className="doc-avatar">👨‍⚕️</div>
                        <div className="doc-info">
                            <h3>{d.name}</h3>
                            <p className="specialty">{d.specialty}</p>
                            <p className="hospital">{d.hospital}</p>
                        </div>
                        <div className="doc-actions">
                            <span className={`status-dot ${d.status.toLowerCase()}`}></span>
                            <span className="status-text">{d.status}</span>
                            <button className="btn-book">Consult</button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .search-box input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    color: white;
                    padding: 0.5rem;
                    outline: none;
                }
                .doctors-list { display: flex; flex-direction: column; gap: 1rem; }
                .doctor-entry {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1.25rem;
                }
                .doc-avatar { font-size: 2rem; background: var(--glass-highlight); padding: 1rem; border-radius: 50%; }
                .doc-info { flex: 1; }
                .specialty { color: var(--primary); font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem; }
                .hospital { color: var(--text-muted); font-size: 0.8rem; margin-top: 0.25rem; }
                .doc-actions { text-align: right; display: flex; align-items: center; gap: 1rem; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.available { background: #10b981; box-shadow: 0 0 10px #10b981; }
                .status-dot.busy { background: #f59e0b; }
                .btn-book {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: var(--radius-sm);
                    cursor: pointer;
                    font-weight: 600;
                }
                .mb-2 { margin-bottom: 2rem; }
            `}</style>
        </div>
    );
};

export default UserDoctors;
