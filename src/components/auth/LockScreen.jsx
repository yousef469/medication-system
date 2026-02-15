import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LockScreen = ({ onUnlock }) => {
    const { user, logout } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isUnlocking, setIsUnlocking] = useState(false);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setIsUnlocking(true);
        setError('');

        // Simulate verification delay for realism
        setTimeout(() => {
            // In a real app, verify password against Supabase (requires re-auth)
            // For this UI feature, we'll accept any non-empty password for now
            // or we could check against a stored PIN if we implemented that.
            if (password.length > 0) {
                onUnlock();
            } else {
                setError('Please enter your password.');
                setIsUnlocking(false);
            }
        }, 800);
    };

    return (
        <div className="lock-screen-overlay">
            <style>{`
                .lock-screen-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(25px);
                    -webkit-backdrop-filter: blur(25px);
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    animation: fadeIn 0.5s ease-out;
                }

                .lock-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    transform: translateY(20px);
                    animation: slideUp 0.5s ease-out forwards;
                }

                .user-avatar-large {
                    width: 96px;
                    height: 96px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary), var(--accent));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: 700;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    border: 4px solid rgba(255,255,255,0.1);
                }

                .user-name-lock {
                    font-size: 1.5rem;
                    font-weight: 600;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
                }

                .lock-input-group {
                    position: relative;
                    width: 280px;
                }

                .lock-password-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.15);
                    border: none;
                    border-radius: 20px;
                    padding: 0.8rem 1.2rem;
                    padding-right: 2.5rem;
                    color: white;
                    font-size: 0.9rem;
                    outline: none;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .lock-password-input:focus {
                    background: rgba(255, 255, 255, 0.25);
                    box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
                }

                .lock-password-input::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .unlock-btn-arrow {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: transparent;
                    border: none;
                    color: white;
                    cursor: pointer;
                    opacity: 0.8;
                    font-size: 1.2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    transition: all 0.2s;
                }

                .unlock-btn-arrow:hover {
                    background: rgba(255,255,255,0.2);
                    opacity: 1;
                }

                .lock-error {
                    color: #f87171;
                    font-size: 0.8rem;
                    height: 1.2rem;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .lock-actions {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .switch-user-btn {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.85rem;
                    cursor: pointer;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    transition: all 0.2s;
                }

                .switch-user-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(20px); }
                }
                
                .spinner-lock {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>

            <div className="lock-card">
                <div className="user-avatar-large">
                    {user?.name?.charAt(0) || 'U'}
                </div>

                <div className="user-name-lock">
                    {user?.name || 'User'}
                </div>

                <form onSubmit={handleUnlock} className="lock-input-group">
                    <input
                        type="password"
                        placeholder="Enter Password"
                        className="lock-password-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="unlock-btn-arrow" disabled={isUnlocking}>
                        {isUnlocking ? <div className="spinner-lock"></div> : '➝'}
                    </button>
                </form>

                <div className="lock-error">
                    {error}
                </div>
            </div>

            <div className="lock-actions">
                <button className="switch-user-btn" onClick={logout}>
                    Switch User
                </button>
            </div>

            <div style={{ position: 'absolute', bottom: '20px', fontSize: '0.75rem', opacity: 0.5 }}>
                {user?.role === 'hospital_admin' ? 'Facility Management Terminal' : 'Professional Workstation Protection'}
            </div>
        </div>
    );
};

export default LockScreen;
