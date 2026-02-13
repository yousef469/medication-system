import React, { useState, useRef } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';
import ProfessionalProfileModal from '../shared/ProfessionalProfileModal';
import ThemeToggle from '../shared/ThemeToggle';
import QRCode from 'react-qr-code';
import Humanoid3D from '../visual/Humanoid3D';

const UserDashboard = () => {
  const {
    hospitals,
    doctors,
    fetchDoctors,
    submitRequest,
    fetchPatientHistory,
    fetchDiagnoses,
    uploadDiagnosis,
    deleteDiagnosis,
    isBackendOnline,
    fetchPatientPrescriptions
  } = useClinical();
  const { user } = useAuth();
  const [requestContent, setRequestContent] = useState('');
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [diagnosesVault, setDiagnosesVault] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [expandedRxId, setExpandedRxId] = useState(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [urgency, setUrgency] = useState('NEXT HOUR');
  const [selectedFile, setSelectedFile] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [preferredDoctorId, setPreferredDoctorId] = useState(null);
  const fileInputRef = useRef(null);
  const vaultInputRef = useRef(null);
  const isGuest = !user?.isAuthenticated;

  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('IDLE'); // IDLE, SYNCING, SUCCESS, ERROR

  const syncPrescriptions = async () => {
    if (!user?.id) return;
    setSyncStatus('SYNCING');
    try {
      console.log("[UserDashboard] Explicit Sync: Fetching prescriptions for:", user.id);
      const rxList = await fetchPatientPrescriptions(user.id);
      if (Array.isArray(rxList)) {
        const active = rxList.filter(rx => rx.status === 'ACTIVE');
        setActivePrescriptions(active);
        setSyncStatus('SUCCESS');
        setTimeout(() => setSyncStatus('IDLE'), 3000);
      } else {
        throw new Error("Invalid Prescription Data Received");
      }
    } catch (err) {
      console.error("[UserDashboard] Sync Failed:", err);
      setSyncStatus('ERROR');
    }
  };

  React.useEffect(() => {
    if (user?.id) {
      syncPrescriptions();
      // Also sync when window regains focus (mobile app return flow)
      const handleFocus = () => syncPrescriptions();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    }
  }, [user?.id]);

  // Auto-select first hospital
  React.useEffect(() => {
    if (hospitals.length > 0 && !selectedHospitalId) {
      setSelectedHospitalId(hospitals[0].id);
    }
  }, [hospitals]);

  // Fetch doctors for the selected hospital
  React.useEffect(() => {
    if (selectedHospitalId) {
      fetchDoctors(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  // Fetch Patient History
  React.useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
  }, [user?.id]);

  const loadHistory = async () => {
    if (!user?.id) return;
    setIsLoadingHistory(true);
    const [history, vault] = await Promise.all([
      fetchPatientHistory(user.id),
      fetchDiagnoses(user.id)
    ]);
    setMedicalHistory(history || []);
    setDiagnosesVault(vault || []);
    setIsLoadingHistory(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setRequestContent(prev => prev + `\n[Attached File: ${file.name}]`);
    }
  };

  const handleVoiceToggle = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        const voiceText = "Critical inquiry for clinical triage.";
        setRequestContent(prev => prev ? prev + " " + voiceText : voiceText);
        setVoiceUrl("blob:v-123");
      }, 2000);
    } else {
      setIsRecording(false);
      setVoiceUrl('v-placeholder-url');
      setRequestContent(prev => prev + `\n[Voice Note Recorded]`);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (isGuest) {
      alert("Please sign in to submit a clinical request.");
      return;
    }

    const inputType = voiceUrl ? 'voice' : selectedFile ? 'file' : 'text';

    await submitRequest(
      user.name || "Guest Patient",
      selectedHospitalId,
      requestContent,
      urgency,
      inputType,
      selectedFile,
      voiceUrl,
      preferredDoctorId
    );

    setSubmitted(true);
    setRequestContent('');
    setSelectedFile(null);
    setVoiceUrl(null);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="user-dashboard">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient">Global Medical Discovery</h1>
          <p className="subtitle">Expert clinical care - Available across the globe</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* SYNC CONTROL CENTER (MOBILE DEBUG) */}
          <div className="sync-status-bar" style={{
            background: 'var(--glass-highlight)',
            padding: '0.4rem 0.8rem',
            borderRadius: '12px',
            fontSize: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isBackendOnline ? '#10b981' : '#ef4444',
              boxShadow: isBackendOnline ? '0 0 8px #10b981' : 'none'
            }}></div>
            <span style={{ fontWeight: 800, opacity: 0.8 }}>
              {isBackendOnline ? 'SYNC: ONLINE' : 'SYNC: OFFLINE'}
            </span>
            <button
              onClick={() => {
                syncPrescriptions();
                loadHistory();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.8rem',
                opacity: syncStatus === 'SYNCING' ? 0.5 : 1
              }}
              title="Force Sync Now"
            >
              {syncStatus === 'SYNCING' ? '⏳' : '🔄'}
            </button>
            {!isGuest && (
              <span style={{ paddingLeft: '0.5rem', borderLeft: '1px solid var(--glass-border)', opacity: 0.6, fontWeight: 700 }}>
                {user?.email}
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="main-discovery-layout">
        <section className="request-portal glass-card">
          {/* 📲 NEW DEDICATED QR CODES SECTION AT TOP */}
          {activePrescriptions.length > 0 && (
            <div className="qr-wallet-hero fade-in" style={{ marginBottom: '2.5rem', padding: '2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '24px', color: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>📲 My Active QR Codes</h2>
                  <p style={{ margin: '0.2rem 0 0', opacity: 0.9, fontSize: '0.8rem' }}>Present these to the pharmacy for dispensing.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {activePrescriptions.length} Active Rx
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {activePrescriptions.map(rx => (
                  <div key={rx.token} style={{ background: 'white', padding: '1rem', borderRadius: '18px', minWidth: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#064e3b' }}>
                    <div style={{ background: '#f0fdf4', padding: '0.8rem', borderRadius: '12px', marginBottom: '0.8rem' }}>
                      <QRCode value={`${window.location.origin}/prescription/${rx.token}`} size={140} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.05em' }}>Pharmacy Token</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, margin: '0.2rem 0' }}>{rx.token.slice(0, 8).toUpperCase()}...</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>Issued: {new Date(rx.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGuest && activePrescriptions.length === 0 && (
            <div className="fade-in" style={{
              marginBottom: '2.5rem',
              padding: '1.5rem',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '24px',
              border: '1px dashed #10b981',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎫</div>
              <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>QR Wallet is Active</div>
              <p style={{ margin: '0.2rem 0', opacity: 0.6, fontSize: '0.75rem' }}>No active prescriptions found in the clinical cloud.</p>
              <button
                onClick={syncPrescriptions}
                type="button"
                style={{ background: 'none', border: '1px solid #10b981', color: '#10b981', padding: '4px 12px', borderRadius: '8px', fontSize: '0.65rem', marginTop: '0.8rem', cursor: 'pointer', fontWeight: 900 }}
              >
                {syncStatus === 'SYNCING' ? 'SYNCING...' : 'FORCE REFRESH CLOUD'}
              </button>
            </div>
          )}

          <h3>Emergency & Clinical Portal <span style={{ fontSize: '0.6rem', opacity: 0.4, fontWeight: 'normal' }}>v4.1.0 (Sync Ready)</span></h3>
          <p className="section-desc">Submit text, files, or voice for clinical routing.</p>

          <form onSubmit={handleRequest} className="request-form">
            <div className="form-group">
              <label>Target Facility</label>
              <select value={selectedHospitalId} onChange={(e) => setSelectedHospitalId(e.target.value)}>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Request Details / Symptoms</label>
              <div className="input-with-tools">
                <textarea
                  placeholder="Describe your situation in words, or use tools below..."
                  value={requestContent}
                  onChange={(e) => setRequestContent(e.target.value)}
                  required
                ></textarea>
                <div className="form-tools">
                  <button type="button" className={`tool-btn ${isRecording ? 'recording' : ''}`} onClick={handleVoiceToggle}>
                    {isRecording ? '⏹ Stop Recording' : '🎤 Voice Note'}
                  </button>
                  <div
                    className="tool-btn"
                    style={{ position: 'relative', padding: '0.4rem 0.8rem', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {selectedFile ? `📁 ${selectedFile.name.slice(0, 10)}...` : '📁 Attach Files'}
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
                      onChange={handleFileChange}
                      accept="*/*"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="urgency-selector">
              <label>Response Tier</label>
              <div className="tier-grid">
                {['IMMEDIATE', 'NEXT HOUR', 'SCHEDULED'].map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`tier-btn ${urgency === t ? 'active' : ''} ${t.toLowerCase().replace(' ', '')}`}
                    onClick={() => setUrgency(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className={`btn-primary w-full mt-1 ${isGuest ? 'guest-btn' : ''}`}>
              {submitted ? '✓ Request Transmitted' : isGuest ? '🔐 Sign In to Submit' : 'Submit Clinical Request'}
            </button>
          </form>

          {/* Patient History Section */}
          {!isGuest && (
            <div className="medical-history-section" style={{ marginTop: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ borderBottom: '2px solid var(--primary)', width: 'fit-content' }}>My Medical History</h3>
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{medicalHistory.length} Sessions Resolved</span>
              </div>

              <div className="history-list" style={{ marginTop: '1.5rem' }}>
                {isLoadingHistory ? (
                  <p style={{ opacity: 0.5 }}>Synchronizing health records...</p>
                ) : medicalHistory.length === 0 ? (
                  <div className="empty-history" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                    <p style={{ opacity: 0.4 }}>No historical clinical records found.</p>
                  </div>
                ) : (
                  medicalHistory.map(record => {
                    const associatedRx = activePrescriptions.find(rx => rx.request_id === record.id);
                    return (
                      <div key={record.id} className="history-card" style={{ background: 'var(--glass-highlight)', padding: '1.2rem', borderRadius: '14px', marginBottom: '1rem', borderLeft: '3px solid var(--secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                            {new Date(record.created_at).toLocaleDateString()} at {hospitals.find(h => h.id === record.hospital_id)?.name || 'Medical Center'}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {record.status === 'COMPLETED' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {associatedRx && (
                                  <button
                                    className="btn-primary btn-xs"
                                    style={{ padding: '2px 8px', fontSize: '0.6rem', background: '#10b981', borderColor: '#10b981' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedRxId(expandedRxId === record.id ? null : record.id);
                                    }}
                                  >
                                    💊 VIEW QR RX
                                  </button>
                                )}
                                <span style={{ fontSize: '0.6rem', color: '#4ade80', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></span>
                                  DOCTOR VERIFIED
                                </span>
                              </div>
                            )}
                            <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '4px' }}>FINISHED</span>
                            <button
                              className="btn-secondary btn-xs"
                              style={{ padding: '2px 8px', fontSize: '0.6rem' }}
                              onClick={() => setExpandedHistoryId(expandedHistoryId === record.id ? null : record.id)}
                            >
                              {expandedHistoryId === record.id ? 'CLOSE' : 'VIEW AI MAP'}
                            </button>
                          </div>
                        </div>
                        <div style={{ marginBottom: '0.8rem' }}>
                          <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', textTransform: 'uppercase' }}>Clinical Diagnosis</label>
                          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{record.diagnosis || 'Standard Consultation'}</div>
                        </div>

                        {expandedHistoryId === record.id ? (
                          <div className="fade-in" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: '1fr 180px', gap: '1.5rem', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>GEMINI CLINICAL SYNTHESIS</div>
                              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5, opacity: 0.9 }}>{record.ai_conclusion || "Standard historical record analysis."}</p>

                              <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', textTransform: 'uppercase' }}>Medication</label>
                                  <div style={{ fontSize: '0.8rem' }}>{record.medication_schedule || 'None listed'}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block', textTransform: 'uppercase' }}>Physician</label>
                                  <div style={{ fontSize: '0.8rem' }}>Dr. {doctors.find(d => d.id === record.assigned_doctor_id)?.name || 'Specialist'}</div>
                                </div>
                              </div>
                            </div>
                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '15px', padding: '0.5rem' }}>
                              <Humanoid3D markers={record.ai_humanoid_markers || []} />
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '2rem' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block' }}>Medication Prescribed</label>
                              <div style={{ fontSize: '0.8rem' }}>{record.medication_schedule || 'No medicine required'}</div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block' }}>Clinical Physician</label>
                              <div style={{ fontSize: '0.8rem' }}>Dr. {doctors.find(d => d.id === record.assigned_doctor_id)?.name || 'Specialist'}</div>
                            </div>
                            {record.file_url && (
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.6rem', opacity: 0.5, display: 'block' }}>Clinical Evidence</label>
                                <a href={record.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}>📎 VIEW MEDIA</a>
                              </div>
                            )}
                          </div>
                        )}

                        {expandedRxId === record.id && associatedRx && (
                          <div className="fade-in" style={{ marginTop: '1rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
                              <h4 style={{ margin: 0, color: '#065f46' }}>Secure Prescription QR</h4>
                              <button className="btn-secondary btn-xs" onClick={() => setExpandedRxId(null)}>CLOSE</button>
                            </div>
                            <QRCode value={`MED_RX:${associatedRx.token}`} size={160} />
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#047857' }}>READY FOR PHARMACY SCAN</div>
                              <div style={{ fontSize: '0.6rem', opacity: 0.6, fontFamily: 'monospace' }}>{associatedRx.token}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Highlights & Vault */}
        <section className="highlights">
          {!isGuest && (
            <div className="medical-vault-section" style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.8rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Clinical Vault</h3>
                  <p style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.2rem' }}>Persistent Storage</p>
                </div>
                <button
                  className="btn-secondary btn-xs"
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                  onClick={() => vaultInputRef.current?.click()}
                >
                  {isUploading ? '📤 ...' : '+ Add'}
                </button>
                <input
                  type="file"
                  ref={vaultInputRef}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsUploading(true);
                    try {
                      await uploadDiagnosis(file, file.name);
                      loadHistory();
                    } catch (err) {
                      alert("Vault sync failed: " + err.message);
                    } finally {
                      setIsUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {diagnosesVault.length === 0 ? (
                  <p style={{ opacity: 0.4, fontSize: '0.8rem', textAlign: 'center' }}>Vault is empty.</p>
                ) : (
                  diagnosesVault.map(diag => (
                    <div key={diag.id} className="glass-card" style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{diag.title}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <a href={diag.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-xs">View</a>
                        <button
                          className="btn-secondary btn-xs"
                          style={{ color: '#ef4444' }}
                          onClick={async () => {
                            if (window.confirm('Wipe this clinical data?')) {
                              await deleteDiagnosis(diag.id);
                              loadHistory();
                            }
                          }}
                        >Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <h3>Top Care Centers</h3>
          <div className="hospitals-scroll">
            {hospitals.map(h => (
              <div
                key={h.id}
                className={`glass-card hospital-mini-card ${selectedHospitalId === h.id ? 'active-hosp' : ''}`}
                onClick={() => setSelectedHospitalId(h.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="hosp-img-placeholder" style={{
                  backgroundImage: h.cover_image_url ? `url(${h.cover_image_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '100px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem'
                }}></div>
                <h4>{h.name}</h4>
                <p className="hosp-loc">📍 {h.address}</p>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: '2.5rem' }}>Hospital Staff</h3>
          <div className="doctors-list">
            {doctors.length === 0 ? (
              <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>No specialist profiles list available.</p>
            ) : (
              doctors.map(dr => (
                <div
                  key={dr.id}
                  className={`glass-card dr-item ${preferredDoctorId === dr.id ? 'preferred' : ''}`}
                  onClick={() => setSelectedProfileId(dr.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <div className="dr-avatar-small">
                      {dr.avatar_url ? <img src={dr.avatar_url} alt={dr.name} className="avatar-img-round-mini" /> : dr.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Dr. {dr.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{dr.specialty || dr.role}</div>
                    </div>
                  </div>
                  <button
                    className="btn-secondary btn-xs"
                    style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.6rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreferredDoctorId(dr.id);
                      setRequestContent(prev => `Attention: Dr. ${dr.name}\n\n` + prev);
                    }}
                  >
                    {preferredDoctorId === dr.id ? '★ REQUESTED' : 'Request Specialist'}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .user-dashboard { display: flex; flex-direction: column; gap: 2rem; max-width: 100vw; overflow-x: hidden; }
        .main-discovery-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; }
        
        @media (max-width: 1024px) {
          .main-discovery-layout { grid-template-columns: 1fr; }
          .request-portal { padding: 1.5rem; }
        }

        .active-hosp { border-color: var(--primary) !important; background: var(--glass-highlight) !important; }
        .dr-item { padding: 1rem; margin-bottom: 0.75rem; transition: transform 0.2s; border: 1px solid transparent; }
        .dr-item:hover { transform: translateX(5px); }
        .dr-item.preferred { border-color: var(--primary); background: rgba(124, 58, 237, 0.05); }
        .dr-avatar-small { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; overflow: hidden; }
        .avatar-img-round-mini { width: 100%; height: 100%; object-fit: cover; }
        
        .request-portal { padding: 2rem; border: 1px solid var(--primary-glow); }
        .section-desc { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 2rem; }

        .request-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; }
        
        .form-group select, textarea {
          width: 100%;
          background: var(--bg-app);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          padding: 0.8rem;
          outline: none;
        }

        textarea { height: 120px; resize: none; }
        
        .input-with-tools { position: relative; }
        .form-tools { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .tool-btn { 
          font-size: 0.75rem; 
          background: var(--glass-highlight); 
          border: 1px solid var(--glass-border); 
          color: var(--text-primary); 
          padding: 0.4rem 0.8rem; 
          border-radius: var(--radius-full);
          cursor: pointer;
        }
        .tool-btn.recording { background: #ef4444; border-color: #ef4444; animation: pulse 1s infinite; }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .urgency-selector label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; }
        .tier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        .tier-btn {
          padding: 0.8rem;
          font-size: 0.7rem;
          font-weight: 700;
          background: var(--glass-highlight);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tier-btn.active.immediate { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
        .tier-btn.active.nexthour { background: rgba(245, 158, 11, 0.2); border-color: var(--accent); color: var(--accent); }
        .tier-btn.active.scheduled { background: rgba(16, 185, 129, 0.2); border-color: var(--secondary); color: var(--secondary); }

        .hospitals-scroll { display: flex; flex-direction: column; gap: 1.5rem; }
        .hospital-mini-card { padding: 1rem; }
        .hosp-loc { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; }

        .guest-btn { 
          background: var(--accent) !important; 
          border-color: var(--accent) !important;
          opacity: 0.8;
        }
        .guest-btn:hover { opacity: 1; transform: translateY(-2px); }

        .w-full { width: 100%; }
        .mt-1 { margin-top: 1rem; }
      `}</style>

      {selectedProfileId && (
        <ProfessionalProfileModal
          userId={selectedProfileId}
          onClose={() => setSelectedProfileId(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
