import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

const LoginView = ({ targetRole }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(targetRole, name, password)) {
      setError('');
    } else {
      setError('Invalid credentials for this clinical section.');
    }
  };

  const getSystemName = () => {
    switch (targetRole) {
      case 'doctor': return 'Clinical Management System';
      case 'secretary': return 'Medical Coordination Hub';
      case 'it': return 'System Engineering Core';
      case 'admin': return 'City Health Administration';
      default: return 'Medical System';
    }
  };

  return (
    <div className="login-overlay">
      <div className="glass-card login-card fade-in">
        <div className="login-header">
          <div className="system-icon">🛡️</div>
          <h2 className="text-gradient">Secure Access</h2>
          <p className="system-subtitle">{getSystemName()}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Professional Identity</label>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Security Passcode</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primary w-full mt-1">
            Authorize Entry
          </button>

          <div className="login-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="btn-google w-full"
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: window.location.origin
                }
              });
              if (error) setError(error.message);
            }}
          >
            <span className="google-icon">G</span>
            Continue with Google
          </button>
        </form>

        <p className="login-footer">
          Authorized personnel only. All access is logged by {getSystemName()} monitors.
        </p>
      </div>

      <style jsx>{`
        .login-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 2, 18, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 2.5rem;
          text-align: center;
        }

        .login-header {
          margin-bottom: 2rem;
        }

        .system-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .system-subtitle {
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 0.5rem;
        }

        .login-form {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .input-group input {
          width: 100%;
          background: var(--glass-highlight);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 0.8rem 1rem;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          border-color: var(--primary);
        }

        .login-error {
          color: #ef4444;
          font-size: 0.875rem;
          text-align: center;
        }

        .login-footer {
          margin-top: 2rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .w-full { width: 100%; }
        .mt-1 { margin-top: 1rem; }

        .login-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 1.5rem 0;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--glass-border);
        }

        .login-divider:not(:empty)::before { margin-right: 1rem; }
        .login-divider:not(:empty)::after { margin-left: 1rem; }

        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: white;
          color: #1a1a1b;
          border: none;
          padding: 0.8rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }

        .btn-google:hover {
          background: #f1f1f1;
          transform: translateY(-2px);
        }

        .google-icon {
          font-weight: 900;
          color: #4285F4;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
};

export default LoginView;
