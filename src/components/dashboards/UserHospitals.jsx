import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';

const UserHospitals = () => {
    const { hospitals, submitRequest } = useClinical();
    const { user } = useAuth();
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);
    const [bookingNote, setBookingNote] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [wasBooked, setWasBooked] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = React.useRef(null);

    const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!user?.isAuthenticated) {
            alert("Please sign in to book an appointment.");
            return;
        }
        await submitRequest(
            user.name || "Guest Patient",
            selectedHospitalId,
            `Appointment Booking: ${selectedSection}. Note: ${bookingNote}`,
            'SCHEDULED',
            selectedFile ? 'file' : 'text',
            selectedFile
        );
        setWasBooked(true);
        setTimeout(() => {
            setWasBooked(false);
            setSelectedHospitalId(null);
            setBookingNote('');
        }, 3000);
    };

    if (selectedHospital) {
        return (
            <div className="hospital-detail fade-in">
                <button className="btn-back mb-2" onClick={() => setSelectedHospitalId(null)}>← Back to List</button>

                <div className="detail-layout">
                    <div className="detail-main glass-card">
                        <div className="detail-banner" style={{ backgroundImage: `url(${selectedHospital.image})` }}></div>
                        <div className="detail-content">
                            <div className="header-row">
                                <h1>{selectedHospital.name}</h1>
                                <span className={`status-badge ${selectedHospital.busyStatus}`}>
                                    {selectedHospital.busyStatus.toUpperCase()} BUSY
                                </span>
                            </div>
                            <p className="loc">📍 {selectedHospital.location}</p>
                            <p className="desc">{selectedHospital.description}</p>

                            <div className="sections-list">
                                <h3>Available Specialists</h3>
                                <div className="tags">
                                    {selectedHospital.sections.map(s => (
                                        <span key={s} className="section-tag">{s}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="booking-panel glass-card">
                        <h3>Book Appointment</h3>
                        {wasBooked ? (
                            <div className="success-msg">
                                <span className="check">✓</span>
                                <p>Requested! Our coordinator will contact you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleBook}>
                                <div className="form-group">
                                    <label>Select Section</label>
                                    <select required value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                                        <option value="">Choose specialization...</option>
                                        {selectedHospital.sections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Medical Note (Optional)</label>
                                    <textarea
                                        placeholder="Reason for visit..."
                                        value={bookingNote}
                                        onChange={e => setBookingNote(e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div
                                        className="btn-secondary btn-xs"
                                        style={{ flex: 1, cursor: 'pointer', textAlign: 'center', display: 'block', padding: '0.5rem', position: 'relative' }}
                                    >
                                        {selectedFile ? `📁 ${selectedFile.name.slice(0, 15)}...` : '📎 Attach Medical File'}
                                        <input
                                            type="file"
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                opacity: 0,
                                                width: '100%',
                                                height: '100%',
                                                cursor: 'pointer',
                                                zIndex: 999
                                            }}
                                            onChange={(e) => setSelectedFile(e.target.files[0])}
                                            accept="*/*"
                                        />
                                    </div>
                                    {selectedFile && (
                                        <button
                                            type="button"
                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', zIndex: 1000 }}
                                            onClick={() => setSelectedFile(null)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <button type="submit" className="btn-primary w-full">Confirm Booking Request</button>
                            </form>
                        )}
                        {!user?.isAuthenticated && <p className="auth-nudge">🔒 Login required to book</p>}
                    </div>
                </div>

                <style>{`
                    .btn-back { background: transparent; border: 1px solid var(--glass-border); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor: pointer; }
                    .detail-layout { display: grid; grid-template-columns: 1fr 380px; gap: 2rem; }
                    .detail-banner { height: 300px; background-size: cover; background-position: center; border-radius: var(--radius-md) var(--radius-md) 0 0; }
                    .detail-content { padding: 2rem; }
                    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                    .status-badge { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.75rem; border-radius: 4px; }
                    .status-badge.maximal { background: #ef4444; color: white; }
                    .status-badge.high { background: #f59e0b; color: white; }
                    .status-badge.moderate { background: #10b981; color: white; }
                    .loc { color: var(--text-muted); margin-bottom: 1.5rem; }
                    .desc { line-height: 1.8; margin-bottom: 2rem; color: var(--text-secondary); }
                    .section-tag { background: var(--glass-highlight); color: var(--primary); padding: 0.4rem 1rem; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; display: inline-block; margin: 0.5rem 0.5rem 0 0; }
                    
                    .booking-panel { padding: 2rem; height: fit-content; border: 1px solid var(--primary-glow-low); }
                    .booking-panel h3 { margin-bottom: 2rem; }
                    .form-group { margin-bottom: 1.5rem; }
                    .form-group label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
                    .form-group select, .form-group textarea { width: 100%; background: var(--bg-app); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 0.8rem; border-radius: var(--radius-md); outline: none; }
                    .form-group select option { background: var(--bg-surface); color: var(--text-primary); }
                    .form-group textarea { height: 100px; resize: none; }
                    .auth-nudge { font-size: 0.75rem; color: var(--accent); text-align: center; margin-top: 1rem; }
                    .success-msg { text-align: center; padding: 2rem 0; }
                    .check { font-size: 3rem; color: var(--secondary); display: block; margin-bottom: 1rem; }
                    .mb-2 { margin-bottom: 2rem; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="hospitals-view fade-in">
            <h2 className="text-gradient mb-2">Medical Centers</h2>
            <div className="hospitals-grid">
                {hospitals.map(h => (
                    <div key={h.id} className="glass-card hospital-full-card" onClick={() => setSelectedHospitalId(h.id)}>
                        <div className="hosp-banner" style={{
                            backgroundImage: (h.cover_image_url || h.image) ? `url(${h.cover_image_url || h.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '200px',
                            borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                        }}>
                            {h.ai_config?.level && (
                                <span className={`ai-badge ${h.ai_config.level}`}>
                                    {h.ai_config.level.toUpperCase()} AI
                                </span>
                            )}
                        </div>
                        <div className="hosp-content">
                            <div className="hosp-header">
                                <h3>{h.name}</h3>
                                <span className={`mini-status ${h.busyStatus || 'moderate'}`}>●</span>
                            </div>
                            <p className="location-tag">📍 {h.address || h.location || h.city || 'Location Pending'}</p>
                            <p className="description">{h.description || 'Welcome to our newly registered medical facility.'}</p>
                            <div className="stats">
                                <span>⭐ 5.0</span>
                                <span>{(h.specialty_tags || h.sections)?.length || 0} Depts</span>
                                {h.digital_reality === 'digital' && <span className="tech-badge">⚡ FULL DIGITAL</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .hospitals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2rem;
                }
                .hospital-full-card {
                    padding: 0;
                    overflow: hidden;
                    transition: all 0.3s;
                    cursor: pointer;
                    border: 1px solid var(--glass-border);
                }
                .hospital-full-card:hover {
                    transform: translateY(-8px);
                    border-color: var(--primary-glow-low);
                }
                .hosp-content {
                    padding: 1.5rem;
                }
                .hosp-header { display: flex; justify-content: space-between; align-items: flex-start; }
                .mini-status.maximal { color: #ef4444; }
                .mini-status.high { color: #f59e0b; }
                .mini-status.moderate { color: #10b981; }
                .location-tag { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem; }
                .description { font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.6; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .stats { display: flex; gap: 1.5rem; font-size: 0.8rem; font-weight: 700; color: var(--primary); align-items: center; }
                .ai-badge { position: absolute; top: 1rem; right: 1rem; background: rgba(124, 58, 237, 0.9); color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.65rem; font-weight: 900; backdrop-filter: blur(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
                .ai-badge.advanced { background: linear-gradient(135deg, #7c3aed, #ec4899); }
                .tech-badge { background: rgba(34, 197, 94, 0.1); color: #4ade80; padding: 2px 8px; border-radius: 4px; font-size: 0.65rem; border: 1px solid rgba(34, 197, 94, 0.2); }
                .mb-2 { margin-bottom: 2rem; }
            `}</style>
        </div>
    );
};

export default UserHospitals;
