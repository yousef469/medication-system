import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../supabaseClient';

const LoginView = ({ portalMode = 'patient', onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [isInstant, setIsInstant] = useState(false);
  const [targetRole, setTargetRole] = useState(portalMode === 'professional' ? 'doctor' : 'user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const [lockedHospital, setLockedHospital] = useState(null);
  const [lockedRole, setLockedRole] = useState(null);
  const [inviteToken, setInviteToken] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const inviteId = params.get('invite');

    const initializePortal = async () => {
      if (portalMode === 'professional') {
        const { data: hospitalData } = await supabase.from('hospitals').select('id, name').eq('status', 'APPROVED');
        if (hospitalData) setHospitals(hospitalData);
      }

      if (token) {
        setInviteToken(token);
        try {
          const { data, error } = await supabase.rpc('validate_invite_token', { lookup_token: token });
          const result = Array.isArray(data) ? data[0] : data;

          if (result && result.valid) {
            setLockedHospital({ id: result.target_hospital_id, name: result.hospital_name });
            setLockedRole(result.target_role);
            setSelectedHospital(result.target_hospital_id);
            setTargetRole(result.target_role);
            setIsSignUp(true);
          } else {
            setError("This invitation link is invalid or has expired.");
          }
        } catch (err) {
          console.error("Token lookup failed:", err);
          setError("Failed to verify invitation link.");
        }
      } else if (inviteId) {
        setSelectedHospital(inviteId);
        setIsSignUp(true);
      }
    };

    initializePortal();
  }, [portalMode]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log("[Auth] Environment Check:", {
      url: (import.meta.env.VITE_SUPABASE_URL || '').substring(0, 10),
      keyPrefix: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').substring(0, 10)
    });

    try {
      if (isSignUp) {
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: targetRole,
              phone: phone,
              hospital_id: selectedHospital || null,
              is_new_registrant: true
            }
          }
        });

        if (authErr) {
          console.error("[Auth] SignUp Error Object:", JSON.stringify(authErr, null, 2));
          throw authErr;
        }

        // Claim Secure Token if present
        if (inviteToken) {
          await supabase.rpc('claim_invite_token', { claim_token: inviteToken });
        }

        console.log("[Auth] SignUp Result:", {
          userId: authData?.user?.id,
          sessionExists: !!authData?.session,
          userMetadata: authData?.user?.user_metadata
        });

        setIsInstant(!!authData.session);
        setRegSuccess(true);
      } else {
        const { data, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) {
          console.error("[Auth] Login Error Object:", JSON.stringify(loginErr, null, 2));
          throw loginErr;
        }
      }
    } catch (err) {
      console.error("[Auth] Caught Error:", err);
      setError(err.message || 'Authentication failed. Technical details in console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setError(error.message);
  };

  const isProfessional = portalMode === 'professional';

  if (regSuccess) {
    const isAdmin = targetRole === 'hospital_admin';
    return (
      <div className="login-card success-screen fade-in">
        <style>{`
          .success-screen { text-align: center; padding: 4rem 2rem; max-width: 500px; margin: 0 auto; }
          .success-icon { font-size: 4rem; margin-bottom: 2rem; display: block; }
          .email-highlight { color: var(--primary); font-weight: 700; border-bottom: 2px solid var(--primary); }
          .diagnostic-link { font-size: 0.75rem; color: var(--text-muted); opacity: 0.6; cursor: pointer; margin-top: 3rem; display: block; text-decoration: underline; }
          .admin-note { background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.2); padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.85rem; }
        `}</style>
        <span className="success-icon">{isInstant ? '✅' : '📧'}</span>
        <h2 className="text-gradient">{isInstant ? 'Welcome Aboard!' : 'Identity Pending'}</h2>

        {isInstant ? (
          <div>
            <p>Your {isAdmin ? 'Hospital Facility' : 'Professional'} registration is complete.</p>
            {isAdmin && <div className="admin-note">🏥 **Facility Setup Running**: We are initializing your hospital dashboard and clinical workflows.</div>}
            <p style={{ marginTop: '1rem' }}>Redirecting you to the medical hub...</p>
          </div>
        ) : (
          <>
            <p>Verification is required for <br /><span className="email-highlight">{email}</span></p>
            <div className="alert-box info mt-1" style={{ fontSize: '0.85rem' }}>
              <strong>Not getting the email?</strong><br />
              Supabase often limits email volume. To skip verification:
              <ol style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                <li>Go to Supabase Dashboard.</li>
                <li>Go to Authentication, then Providers, then Email.</li>
                <li>Turn OFF the "Confirm Email" toggle.</li>
                <li>Delete this user and Try Again!</li>
              </ol>
            </div>
          </>
        )}

        <button className="btn-primary w-full mt-1" onClick={async () => {
          const { data } = await supabase.auth.getSession();
          console.log("[Diag] Reload Check Session:", !!data.session);
          if (data.session || isInstant) window.location.reload();
          else setRegSuccess(false);
        }}>
          {isInstant ? 'Enter Clinical Dashboard' : 'Back to Login'}
        </button>

        <span className="diagnostic-link" onClick={() => {
          console.log("[Diag] Connection Details:", {
            url: supabase.supabaseUrl,
            keySet: !!supabase.supabaseKey,
            sessionActive: !!isInstant
          });
          alert(`Supabase Connected: ${supabase.supabaseUrl ? 'YES' : 'NO'}\nInstant Session: ${isInstant ? 'YES' : 'NO'}`);
        }}>
          DEBUG: Test Connection & Key
        </span>
      </div>
    );
  }

  return (
    <div className="login-portal-view fade-in">
      <style>{`
        .login-portal-view {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .login-visual {
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .login-visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--bg-dark) 20%, transparent 80%);
          display: flex;
          align-items: flex-end;
          padding: 4rem;
          color: white;
        }

        .login-form-side {
          padding: 4rem 6rem;
          background: var(--bg-dark);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .back-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
        }

        .login-header { margin-bottom: 3rem; }
        .login-header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .login-header p { color: var(--text-muted); }

        .form-stack { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-group label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
        .input-group input, .input-group select {
          width: 100%;
          background: var(--glass-highlight);
          border: 1px solid var(--glass-border);
          padding: 1rem;
          border-radius: var(--radius-md);
          color: white;
          outline: none;
        }

        .pro-mode { border-top: 5px solid #7c3aed; }
        .pro-badge-top { background: #7c3aed; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 1rem; text-transform: uppercase; }
        .patient-badge-top { background: var(--primary); color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; display: inline-block; margin-bottom: 1rem; text-transform: uppercase; }
        .portal-header { text-align: center; margin-bottom: 2rem; }
        .error-banner { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; }

        .role-switch {
          display: flex;
          background: var(--glass-highlight);
          padding: 0.3rem;
          border-radius: var(--radius-full);
          margin-bottom: 2rem;
        }
        .role-switch button {
          flex: 1;
          padding: 0.7rem;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: var(--radius-full);
          cursor: pointer;
        }
        .role-switch button.active { background: var(--primary); color: white; }

        @media (max-width: 1024px) {
          .login-portal-view { grid-template-columns: 1fr; }
          .login-visual { display: none; }
          .login-form-side { padding: 3rem 2rem; }
        }
      `}</style>

      <div className="login-visual" style={{ backgroundImage: `url(${isProfessional ? '/professional_portal_hero.png' : '/patient_portal_hero.png'})` }}>
        <div className="login-visual-overlay">
          <div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900 }}>{isProfessional ? 'Healthcare Force' : 'Your Health, Simplified'}</h1>
            <p>{isProfessional ? 'Advanced clinical tools and patient management.' : 'Connect with doctors and manage your care from anywhere.'}</p>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <button className="back-btn" onClick={onBack}>← Back to Portals</button>

        <div className={`login-card bounce-in ${isProfessional ? 'pro-mode' : ''}`}>
          <div className="portal-header">
            {isProfessional ? (
              <div className="pro-badge-top">Healthcare Provider Track</div>
            ) : (
              <div className="patient-badge-top">Patient Access</div>
            )}
            <h1>{isSignUp ? (isProfessional ? 'Professional Onboarding' : 'Create Account') : 'Welcome Back'}</h1>
            <p>{isSignUp ? (isProfessional ? 'Register as part of Egypt\'s verified clinical network.' : 'Join the medical hub for easy appointment booking.') : 'Please sign in to your dashboard.'}</p>
          </div>
        </div>

        {isProfessional && isSignUp && (
          <div className="role-switch">
            {lockedRole ? (
              <div className="pro-badge-top" style={{ width: '100%', textAlign: 'center', padding: '0.8rem' }}>
                Joining as: {lockedRole.toUpperCase()}
              </div>
            ) : (
              <>
                <button className={targetRole !== 'hospital_admin' ? 'active' : ''} onClick={() => setTargetRole('doctor')}>Medical Staff</button>
                <button className={targetRole === 'hospital_admin' ? 'active' : ''} onClick={() => setTargetRole('hospital_admin')}>Hospital Admin</button>
              </>
            )}
          </div>
        )}

        <form className="form-stack" onSubmit={handleAuth}>
          {isSignUp && (
            <div className="input-group">
              <label>{targetRole === 'hospital_admin' ? 'Facility Registration Name' : 'Full Legal Name'}</label>
              <input type="text" placeholder={targetRole === 'hospital_admin' ? 'Cairo General' : 'John Doe'} value={name} onChange={e => setName(e.target.value)} required />
            </div>
          )}

          {isSignUp && isProfessional && (
            <div className="input-group">
              <label>WhatsApp / Contact Number</label>
              <input type="tel" placeholder="+20 123 456 7890" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          {isProfessional && isSignUp && (
            <>
              {targetRole !== 'hospital_admin' && !lockedRole && (
                <div className="input-group">
                  <label>Service Area / Role</label>
                  <select value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                    <option value="doctor">Medical Doctor</option>
                    <option value="nurse">Professional Nurse</option>
                    <option value="secretary">Clinic Secretary</option>
                  </select>
                </div>
              )}
              {targetRole !== 'hospital_admin' && (
                <div className="input-group">
                  <label>Assign to Medical Center</label>
                  {/* If invited, show locked input. Else show dropdown */}
                  {(lockedHospital || new URLSearchParams(window.location.search).get('invite')) ? (
                    <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '8px', color: '#4ade80', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏥 Joining: {lockedHospital?.name || hospitals.find(h => h.id === selectedHospital)?.name || 'Loading Facility...'}
                      <input type="hidden" value={selectedHospital} />
                    </div>
                  ) : (
                    <select
                      value={selectedHospital}
                      onChange={e => setSelectedHospital(e.target.value)}
                      required={hospitals.length > 0}
                    >
                      <option value="">{hospitals.length > 0 ? 'Select Hospital...' : 'No approved centers found'}</option>
                      {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  )}
                  {hospitals.length === 0 && !lockedHospital && !new URLSearchParams(window.location.search).get('invite') && <p style={{ fontSize: '0.7rem', color: '#eab308', marginTop: '4px' }}>Note: You can proceed; facility assignment can be completed later.</p>}
                </div>
              )}
              <div className="input-group">
                <label>Professional ID / License</label>
                <input type="file" onChange={e => setLicense(e.target.files[0])} required />
              </div>
            </>
          )}

          {error && <div className="error-banner">⚠️ {error}</div>}

          <button type="submit" className="btn-primary btn-lg" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignUp ? 'Apply for Access' : 'Secure Login')}
          </button>

          {!isSignUp && !isProfessional && (
            <button type="button" className="btn-secondary" onClick={handleGoogleLogin}>
              Continue with Google
            </button>
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button type="button" className="btn-link" onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </button>
            <p style={{ marginTop: '10px', fontSize: '0.6rem', color: '#666', fontFamily: 'monospace' }}>
              Debug Redirect: {window.location.origin}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
