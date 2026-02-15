import React from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/AuthContext';

const UserAppointments = () => {
    const { requests } = useClinical();
    const { user } = useAuth();

    // In a real app, we'd filter by user.id
    // For this prototype, we'll show all requests for the current guest/user session
    return (
        <div className="appointments-view fade-in">
            <h2 className="text-gradient mb-2">My Appointments</h2>

            {!user.isAuthenticated && (
                <div className="glass-card info-alert mb-2">
                    <p>⚠️ You are currently using a guest session. Sign in to sync your appointments across devices.</p>
                </div>
            )}

            <div className="requests-list">
                {requests.length === 0 ? (
                    <p className="empty-msg">No active appointments or requests found.</p>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="glass-card request-item">
                            <div className="req-header">
                                <span className={`urgency-badge ${req.urgency.toLowerCase().replace(' ', '-')}`}>
                                    {req.urgency}
                                </span>
                                <span className="timestamp">{new Date(req.created_at).toLocaleDateString()}</span>
                            </div>
                            <h3>{req.hospital}</h3>
                            <p className="diagnosis">{req.diagnosis}</p>
                            <div className="req-status">
                                <div className="status-stepper">
                                    <div className={`step ${req.status === 'PENDING_SECRETARY' ? 'active' : 'completed'}`}>Triage</div>
                                    <div className={`step ${req.status === 'ROUTED_TO_DOCTOR' ? 'active' : ''}`}>Doctor Assigned</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .info-alert { border-left: 4px solid var(--accent); padding: 1rem; color: var(--accent); }
                .requests-list { display: flex; flex-direction: column; gap: 1.5rem; }
                .request-item { padding: 1.5rem; position: relative; }
                .req-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
                .urgency-badge { font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 4px; }
                .urgency-badge.next-hour { background: rgba(245,158,11,0.2); color: #f59e0b; }
                .urgency-badge.immediate { background: rgba(239,68,68,0.2); color: #ef4444; }
                .timestamp { color: var(--text-muted); font-size: 0.75rem; }
                .diagnosis { font-size: 0.9rem; margin: 1rem 0; color: var(--text-secondary); }
                .status-stepper { display: flex; border-top: 1px solid var(--glass-border); padding-top: 1rem; gap: 1rem; }
                .step { font-size: 0.75rem; color: var(--text-muted); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); background: var(--glass-highlight); }
                .step.active { color: white; background: var(--primary); font-weight: 700; }
                .step.completed { color: white; background: var(--secondary); opacity: 0.7; }
                .empty-msg { text-align: center; color: var(--text-muted); margin-top: 4rem; }
                .mb-2 { margin-bottom: 2rem; }
            `}</style>
        </div>
    );
};

export default UserAppointments;
