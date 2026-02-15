import React from 'react';
import { useAuth } from '../../context/AuthContext';

const VerificationPending = () => {
    const { user, logout } = useAuth();

    return (
        <div className="pending-portal fade-in">
            <style>{`
                .pending-portal {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-dark);
                    color: white;
                    padding: 2rem;
                    text-align: center;
                }
                .pending-card {
                    max-width: 500px;
                    padding: 3rem;
                    border: 1px solid var(--glass-border);
                    background: var(--glass-highlight);
                    border-radius: var(--radius-xl);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                }
                .status-badge {
                    display: inline-block;
                    padding: 0.5rem 1.5rem;
                    background: rgba(234, 179, 8, 0.1);
                    color: #eab308;
                    border: 1px solid #eab308;
                    border-radius: var(--radius-full);
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 2rem;
                }
                h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; }
                p { color: var(--text-muted); margin-bottom: 2rem; line-height: 1.6; }
                .btn-primary { 
                    background: var(--primary); 
                    color: white; 
                    padding: 1rem; 
                    border-radius: var(--radius-md); 
                    font-weight: 700; 
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px var(--primary-glow); }
                
                .process-steps {
                    text-align: left;
                    margin-bottom: 3rem;
                    background: rgba(255,255,255,0.03);
                    padding: 1.5rem;
                    border-radius: var(--radius-md);
                }
                .step {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                    align-items: center;
                }
                .step-icon {
                    width: 24px;
                    height: 24px;
                    background: var(--primary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: 900;
                    flex-shrink: 0;
                }
                .step.complete .step-icon { background: #22c55e; }
                .step.pending .step-icon { background: #64748b; animation: pulse 2s infinite; }

                .actions { display: flex; flex-direction: column; gap: 1rem; }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>

            <div className="pending-card bounce-in">
                <div className="status-badge">Professional Credentials Pending</div>
                <h1>Review in Progress</h1>
                <p>Hello {user.name}, we've received your registration for the Healthcare Professional portal.</p>

                <div className="process-steps">
                    <div className="step complete">
                        <div className="step-icon">✓</div>
                        <span>AI Document Verification Complete</span>
                    </div>
                    <div className="step pending">
                        <div className="step-icon">2</div>
                        <span>Manual Facility Verification (In Progress)</span>
                    </div>
                    <div className="step">
                        <div className="step-icon">3</div>
                        <span>Account Activation & Portal Access</span>
                    </div>
                </div>

                <div className="actions">
                    <button className="btn-primary" onClick={() => window.location.reload()}>Check Account Status</button>
                    <button className="btn-secondary" onClick={logout}>Sign Out & Return Later</button>
                    <p style={{ fontSize: '0.75rem', marginTop: '1rem' }}>
                        Need help? Contact system coordination at <br />
                        <strong>support@medlink-system.org</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerificationPending;
