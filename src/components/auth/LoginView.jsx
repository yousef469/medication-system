import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

const LoginView = ({ targetRole: initialTargetRole }) => {
  const [targetRole, setTargetRole] = useState(initialTargetRole || 'user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) setError(error.message);
  };

  const roles = [
    { id: 'user', name: 'Patient', icon: '👤', color: 'var(--primary)', desc: 'Personal health discovery and diagnostics' },
    { id: 'doctor', name: 'Clinical Staff', icon: '👨‍⚕️', color: 'var(--secondary)', desc: 'Case management and AI-assisted triage' },
    { id: 'secretary', name: 'Coordinator', icon: '📋', color: 'var(--accent)', desc: 'Patient routing and facility operations' },
    { id: 'it', name: 'System Tech', icon: '⚙️', color: 'var(--primary)', desc: 'Node health and local AI infrastructure' },
  ];

  return (
    <div className="login-split-view fade-in">
      <div className="login-form-container">
        <div className="login-header">
          <h2 className="text-gradient">Welcome to MediDiscovery</h2>
          <p className="subtitle">Select your portal to continue </p>
        </div>

        <div className="role-grid">
          {roles.map(r => (
            <div
              key={r.id}
              className={`role-card glass-card ${targetRole === r.id ? 'active' : ''}`}
              onClick={() => setTargetRole(r.id)}
              style={{ '--role-color': r.color }}
            >
              <span className="role-icon">{r.icon}</span>
              <div className="role-label">{r.name}</div>
            </div>
          ))}
        </div>

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-msg">⚠️ {error}</div>}

          <button type="submit" className="btn-primary w-full btn-lg" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : `Enter ${roles.find(r => r.id === targetRole).name} Portal`}
          </button>

          <div className="divider"><span>OR</span></div>

          <button type="button" className="google-btn w-full" onClick={handleGoogleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            Continue with Google
          </button>
        </form>
      </div>

      <div className="login-visual-container" style={{ backgroundImage: `url('medical_hero_split_auth_1768086048804.png')` }}>
        <div className="visual-overlay">
          <div className="visual-content">
            <div className="tag">EGYPTIAN LOCALIZATION</div>
            <h1>Advanced Clinical Network</h1>
            <p>
              Join a unified system connecting patients with Egypt's most prestigious medical institutions
              using state-of-the-art AI triage and real-time coordination.
            </p>

            <div className="mini-features">
              <div className="mini-feat">
                <span>⚡</span>
                <div>
                  <strong>Real-time Triage</strong>
                  <p>AI-powered routing across Cairo & Aswan</p>
                </div>
              </div>
              <div className="mini-feat">
                <span>💎</span>
                <div>
                  <strong>Elite Facilities</strong>
                  <p>Direct integration with 57357 and Kasr Al-Ainy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
                .login-split-view {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    background: var(--bg-dark);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                    max-width: 1200px;
                    margin: 2rem auto;
                }

                .login-form-container {
                    padding: 4rem 3rem;
                    background: var(--bg-dark);
                    border-right: 1px solid var(--glass-border);
                }

                .login-header { margin-bottom: 2.5rem; }
                .login-header h2 { font-size: 2rem; margin-bottom: 0.5rem; }
                .subtitle { color: var(--text-muted); font-size: 0.9rem; }

                .role-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    margin-bottom: 2.5rem;
                }

                .role-card {
                    padding: 1rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    border: 1px solid var(--glass-border);
                }

                .role-card.active {
                    background: var(--glass-highlight);
                    border-color: var(--role-color);
                    box-shadow: 0 0 15px var(--primary-glow-low);
                }

                .role-icon { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
                .role-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

                .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
                .form-group input {
                    width: 100%;
                    background: var(--glass-highlight);
                    border: 1px solid var(--glass-border);
                    padding: 0.9rem;
                    border-radius: var(--radius-md);
                    color: white;
                    outline: none;
                }

                .error-msg { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem; }

                .divider { text-align: center; position: relative; margin: 1rem 0; }
                .divider::before { content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: var(--glass-border); }
                .divider span { background: var(--bg-dark); padding: 0 1rem; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; position: relative; }

                .google-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    background: white;
                    color: #1a1a1a;
                    border: none;
                    padding: 0.8rem;
                    border-radius: var(--radius-md);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .google-btn:hover { background: #f0f0f0; }
                .google-btn img { width: 18px; }

                .login-visual-container {
                    background-size: cover;
                    background-position: center;
                    position: relative;
                }

                .visual-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, var(--bg-dark) 10%, transparent 90%);
                    display: flex;
                    align-items: flex-end;
                    padding: 4rem;
                }

                .visual-content { color: white; }
                .tag { 
                    display: inline-block; 
                    background: var(--primary); 
                    font-size: 0.65rem; 
                    font-weight: 800; 
                    padding: 0.25rem 0.75rem; 
                    border-radius: var(--radius-full); 
                    margin-bottom: 1rem;
                }
                .visual-content h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 800; line-height: 1.1; }
                .visual-content p { color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 2.5rem; }

                .mini-features { display: flex; flex-direction: column; gap: 1.5rem; }
                .mini-feat { display: flex; gap: 1rem; align-items: flex-start; }
                .mini-feat span { font-size: 1.25rem; background: var(--glass-highlight); padding: 0.5rem; border-radius: 8px; }
                .mini-feat strong { display: block; font-size: 0.95rem; margin-bottom: 0.25rem; }
                .mini-feat p { font-size: 0.8rem; margin: 0; }

                @media (max-width: 1024px) {
                    .login-split-view { grid-template-columns: 1fr; }
                    .login-visual-container { display: none; }
                }
            `}</style>
    </div>
  );
};

export default LoginView;
