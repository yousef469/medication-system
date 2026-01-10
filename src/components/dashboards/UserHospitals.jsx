import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/AuthContext';

const UserHospitals = () => {
    const { hospitals, submitRequest } = useClinical();
    const { user } = useAuth();
    const [selectedHospitalId, setSelectedHospitalId] = useState(null);
    const [bookingNote, setBookingNote] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [wasBooked, setWasBooked] = useState(false);

    const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!user?.isAuthenticated) {
            alert("Please sign in to book an appointment.");
            return;
        }
        await submitRequest(
            user.name,
            selectedHospital.name,
            `Appointment Booking: ${selectedSection}. Note: ${bookingNote}`,
            'SCHEDULED'
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
                                <button type="submit" className="btn-primary w-full">Confirm Booking Request</button>
                            </form>
                        )}
                        {!user?.isAuthenticated && <p className="auth-nudge">🔒 Login required to book</p>}
                    </div>
                </div>

                <style jsx>{`
                    .btn-back { background: transparent; border: 1px solid var(--glass-border); color: white; padding: 0.5rem 1rem; border-radius: var(--radius-sm); cursor: pointer; }
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
                    .form-group select, .form-group textarea { width: 100%; background: var(--glass-highlight); border: 1px solid var(--glass-border); color: white; padding: 0.8rem; border-radius: var(--radius-md); }
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
            <h2 className="text-gradient mb-2">Egyptian Medical Centers</h2>
            <div className="hospitals-grid">
                {hospitals.map(h => (
                    <div key={h.id} className="glass-card hospital-full-card" onClick={() => setSelectedHospitalId(h.id)}>
                        <div className="hosp-banner" style={{
                            backgroundImage: h.image ? `url(${h.image})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            height: '200px',
                            borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
                        }}></div>
                        <div className="hosp-content">
                            <div className="hosp-header">
                                <h3>{h.name}</h3>
                                <span className={`mini-status ${h.busyStatus}`}>●</span>
                            </div>
                            <p className="location-tag">📍 {h.location}</p>
                            <p className="description">{h.description}</p>
                            <div className="stats">
                                <span>⭐ 4.9</span>
                                <span>{h.sections.length} Depts</span>
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
                .stats { display: flex; gap: 1.5rem; font-size: 0.8rem; font-weight: 700; color: var(--primary); }
                .mb-2 { margin-bottom: 2rem; }
            `}</style>
        </div>
    );
};

export default UserHospitals;
