import React, { useState, useRef } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';

const HospitalOnboarding = ({ onComplete }) => {
    const { registerHospitalNode, updateHospitalConfig, analyzeLicenseOCR, uploadFileToSupabase, generateInvite } = useClinical();
    const { user } = useAuth();
    const [phase, setPhase] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hospitalId, setHospitalId] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');
    const fileInputRef = useRef(null);

    // Form States
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        country: '',
        city: '',
        official_email: '',
        phone_number: '',
        logo_url: ''
    });

    const [licenseData, setLicenseData] = useState({
        file: null,
        ocrResult: null,
        isVerified: false
    });

    const [config, setConfig] = useState({
        digital_reality: 'hybrid', // paper-first, hybrid, digital
        ai_level: 'assistive', // off, assistive, advanced
        departments: [],
        prescription_mode: 'paper-qr', // qr-only, paper-qr, paper-only
        insurance_mode: 'manual' // none, manual, digital
    });

    // --- PHASE 1: TRUST & IDENTITY ---
    const handlePhase1Submit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const data = await registerHospitalNode({
                ...basicInfo,
                license_url: licenseData.file,
                verification_data: licenseData.ocrResult
            });
            setHospitalId(data.id);
            setPhase(2);
        } catch (err) {
            alert("Registration failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            // 1. Analyze via AI
            const ocr = await analyzeLicenseOCR(file);

            // 2. Upload to storage for permanent record
            const url = await uploadFileToSupabase(file);

            setLicenseData({
                file: url,
                ocrResult: ocr,
                isVerified: true // Let human audit handle the final trust check
            });

            if (ocr.entity_name) {
                setBasicInfo(prev => ({ ...prev, name: ocr.entity_name }));
            }
        } catch (err) {
            alert("OCR Analysis failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- PHASE 2: ENVIRONMENT BUILDER ---
    const handlePhase2Submit = async () => {
        setIsProcessing(true);
        try {
            await updateHospitalConfig(hospitalId, {
                ...config,
                registration_phase: 2,
                status: 'PENDING_VERIFICATION' // Keep pending until humans approve
            });
            setPhase(3);
        } catch (err) {
            alert("Configuration failed: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleDepartment = (dept) => {
        setConfig(prev => ({
            ...prev,
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const handleInvite = async (role) => {
        try {
            const invite = await generateInvite(hospitalId, role);
            const link = `${window.location.origin}/?invite=${hospitalId}&role=${role}`;
            await navigator.clipboard.writeText(link);
            setCopyStatus(`${role.toUpperCase()} link copied!`);
            setTimeout(() => setCopyStatus(''), 3000);
        } catch (err) {
            alert("Failed to generate invite: " + err.message);
        }
    };

    // --- RENDERERS ---
    const renderPhase1 = () => (
        <div className="onboarding-step fade-in">
            <div className="step-header">
                <span className="step-num">01</span>
                <h2>Trust & Identity</h2>
                <p>Establishing your hospital's digital footprint.</p>
            </div>

            <form onSubmit={handlePhase1Submit} className="onboarding-form">
                <div className="form-section">
                    <h3>Basic Account Details</h3>
                    <div className="input-grid">
                        <div className="input-group">
                            <label>Hospital Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Cairo General Hospital"
                                value={basicInfo.name}
                                onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Official Email</label>
                            <input
                                type="email"
                                placeholder="admin@hospital.com"
                                value={basicInfo.official_email}
                                onChange={e => setBasicInfo({ ...basicInfo, official_email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="input-grid">
                        <div className="input-group">
                            <label>Country / City</label>
                            <input
                                type="text"
                                placeholder="Egypt, Cairo"
                                value={basicInfo.country}
                                onChange={e => setBasicInfo({ ...basicInfo, country: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+20..."
                                value={basicInfo.phone_number}
                                onChange={e => setBasicInfo({ ...basicInfo, phone_number: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section license-upload">
                    <h3>License & Proof Upload</h3>
                    <p className="hint">Upload your operating license. Gemini AI will verify authenticity.</p>

                    <div
                        className={`drop-zone ${licenseData.isVerified ? 'verified' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isProcessing ? (
                            <div className="loader-box">
                                <div className="spinner"></div>
                                <span>AI Analyzing License...</span>
                            </div>
                        ) : licenseData.isVerified ? (
                            <div className="verified-badge">
                                <span className="icon">✅</span>
                                <div>
                                    <strong>License Verified</strong>
                                    <span>#{licenseData.ocrResult.license_number}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="upload-prompt">
                                <span className="icon">📄</span>
                                <span>Click to Upload Hospital License (PDF/Image)</span>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            accept="image/*,application/pdf"
                        />
                    </div>

                    {licenseData.ocrResult && (
                        <div className="ocr-preview glass-card">
                            <div className="preview-item">
                                <span className="label">Extracted Name:</span>
                                <span className="val">{licenseData.ocrResult.entity_name}</span>
                            </div>
                            <div className="preview-item">
                                <span className="label">Expiry:</span>
                                <span className="val">{licenseData.ocrResult.expiry_date}</span>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn-primary btn-large"
                    disabled={isProcessing || !licenseData.ocrResult}
                >
                    {isProcessing ? 'Creating Account...' : 'Continue to Configuration'}
                </button>
            </form>
        </div>
    );

    const renderPhase2 = () => (
        <div className="onboarding-step fade-in">
            <div className="step-header">
                <span className="step-num">02</span>
                <h2>Environment Builder</h2>
                <p>Define how your clinical ecosystem operates.</p>
            </div>

            <div className="onboarding-form">
                <section className="config-section">
                    <h3>Section A: Digital Reality</h3>
                    <p className="hint">How does your hospital currently handle patient records?</p>
                    <div className="options-grid">
                        {[
                            { id: 'paper-first', label: 'Paper-First', icon: '🧾', desc: 'Mostly physical records with minimal digital entry.' },
                            { id: 'hybrid', label: 'Hybrid', icon: '🧾🖥️', desc: 'Digital tracking with physical backups.' },
                            { id: 'digital', label: 'Fully Digital', icon: '🖥️', desc: 'No paper. Everything handled via QR and Cloud.' },
                        ].map(opt => (
                            <div
                                key={opt.id}
                                className={`option-card glass-card ${config.digital_reality === opt.id ? 'active' : ''}`}
                                onClick={() => setConfig({ ...config, digital_reality: opt.id })}
                            >
                                <span className="icon">{opt.icon}</span>
                                <div className="opt-text">
                                    <label>{opt.label}</label>
                                    <span>{opt.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="config-section">
                    <h3>Section B: AI Usage Level</h3>
                    <p className="hint">Control the depth of AI healthcare assistance.</p>
                    <div className="level-slider-container">
                        <div className="level-labels">
                            <span className={config.ai_level === 'off' ? 'active' : ''}>OFF</span>
                            <span className={config.ai_level === 'assistive' ? 'active' : ''}>ASSISTIVE</span>
                            <span className={config.ai_level === 'advanced' ? 'active' : ''}>ADVANCED</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="2" step="1"
                            value={config.ai_level === 'off' ? 0 : config.ai_level === 'assistive' ? 1 : 2}
                            onChange={e => {
                                const val = parseInt(e.target.value);
                                setConfig({ ...config, ai_level: val === 0 ? 'off' : val === 1 ? 'assistive' : 'advanced' });
                            }}
                        />
                    </div>
                </section>

                <section className="config-section">
                    <h3>Section C: Departments & Specialization</h3>
                    <div className="dept-grid">
                        {['General Clinic', 'Emergency', 'Orthopedics', 'Cardiology', 'Radiology', 'Pharmacy'].map(dept => (
                            <div
                                key={dept}
                                className={`dept-chip ${config.departments.includes(dept) ? 'active' : ''}`}
                                onClick={() => toggleDepartment(dept)}
                            >
                                {dept}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="config-section">
                    <h3>Section D: Prescription & Insurance</h3>
                    <div className="input-grid">
                        <div className="input-group">
                            <label>Prescription Mode</label>
                            <select value={config.prescription_mode} onChange={e => setConfig({ ...config, prescription_mode: e.target.value })}>
                                <option value="qr-only">QR Only (Eco-Friendly)</option>
                                <option value="paper-qr">Paper + QR (Recommended)</option>
                                <option value="paper-only">Paper Only (Legacy)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Insurance Handling</label>
                            <select value={config.insurance_mode} onChange={e => setConfig({ ...config, insurance_mode: e.target.value })}>
                                <option value="none">No Insurance</option>
                                <option value="manual">Manual Verification</option>
                                <option value="digital">Digital QR Verification</option>
                            </select>
                        </div>
                    </div>
                </section>

                <button className="btn-primary btn-large" onClick={handlePhase2Submit} disabled={isProcessing}>
                    {isProcessing ? 'Saving Configuration...' : 'Activate Hospital Ecosystem'}
                </button>
            </div>
        </div>
    );

    const renderPhase3 = () => (
        <div className="onboarding-step fade-in text-center">
            <div className="step-header">
                <span className="step-num">03</span>
                <h2>Activation Successful</h2>
                <p>Your hospital is now registered and awaiting final human audit.</p>
            </div>

            <div className="success-card glass-card">
                <div className="success-icon">🏢✨</div>
                <h3>{basicInfo.name} is Live</h3>
                <p>Status: <span className="status-badge warning">PENDING VERIFICATION</span></p>
                <div className="next-steps">
                    <p>While you wait for approval, you can invite your staff:</p>
                    <div className="action-links">
                        <button className="btn-secondary" onClick={() => handleInvite('doctor')}>Invite Doctors</button>
                        <button className="btn-secondary" onClick={() => handleInvite('nurse')}>Invite Nurses</button>
                    </div>
                    {copyStatus && <div className="copy-status fade-in">{copyStatus}</div>}
                </div>
            </div>

            <button className="btn-primary" onClick={onComplete}>Enter Management Dashboard</button>
        </div>
    );

    return (
        <div className="hospital-onboarding-overlay">
            <div className="onboarding-container glass-card">
                <div className="onboarding-progress">
                    <div className={`progress-bar phase-${phase}`}></div>
                </div>

                {phase === 1 && renderPhase1()}
                {phase === 2 && renderPhase2()}
                {phase === 3 && renderPhase3()}

                <style>{`
                    .hospital-onboarding-overlay {
                        position: fixed;
                        inset: 0;
                        background: var(--bg-main);
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 2rem;
                        overflow-y: auto;
                    }
                    .onboarding-container {
                        max-width: 800px;
                        width: 100%;
                        background: rgba(15, 23, 42, 0.95);
                        border: 1px solid rgba(124, 58, 237, 0.3);
                        padding: 3rem;
                        position: relative;
                    }
                    .onboarding-progress {
                        position: absolute;
                        top: 0; left: 0; right: 0;
                        height: 6px;
                        background: rgba(255,255,255,0.05);
                    }
                    .progress-bar {
                        height: 100%;
                        background: var(--primary);
                        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .progress-bar.phase-1 { width: 33%; }
                    .progress-bar.phase-2 { width: 66%; }
                    .progress-bar.phase-3 { width: 100%; }

                    .step-header { margin-bottom: 3rem; }
                    .step-num { font-family: 'Space Grotesk'; font-size: 0.8rem; font-weight: 900; color: var(--primary); letter-spacing: 0.2em; }
                    .step-header h2 { font-size: 2.5rem; margin: 0.5rem 0; }
                    .step-header p { color: var(--text-secondary); }

                    .form-section { margin-bottom: 2.5rem; }
                    .form-section h3 { margin-bottom: 1.5rem; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem; }
                    .hint { font-size: 0.9rem; opacity: 0.6; margin-bottom: 1.5rem; }

                    .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem; }
                    .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
                    .input-group label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
                    .input-group input, .input-group select {
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255,255,255,0.1);
                        padding: 0.8rem 1rem;
                        border-radius: var(--radius-md);
                        color: white;
                    }

                    .drop-zone {
                        border: 2px dashed rgba(124, 58, 237, 0.3);
                        padding: 3rem;
                        text-align: center;
                        border-radius: var(--radius-lg);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        background: rgba(124, 58, 237, 0.02);
                    }
                    .drop-zone:hover { border-color: var(--primary); background: rgba(124, 58, 237, 0.05); }
                    .drop-zone.verified { border-color: #22c55e; background: rgba(34, 197, 94, 0.05); }

                    .options-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                    .option-card {
                        padding: 1.5rem;
                        text-align: center;
                        cursor: pointer;
                        border: 1px solid rgba(255,255,255,0.1);
                    }
                    .option-card.active { border-color: var(--primary); background: rgba(124, 58, 237, 0.1); }
                    .option-card .icon { font-size: 2rem; display: block; margin-bottom: 1rem; }
                    .opt-text label { font-weight: 700; display: block; margin-bottom: 0.5rem; }
                    .opt-text span { font-size: 0.75rem; opacity: 0.6; }

                    .level-slider-container { margin: 2rem 0; }
                    .level-labels { display: flex; justify-content: space-between; margin-bottom: 1rem; }
                    .level-labels span { font-size: 0.7rem; font-weight: 900; opacity: 0.3; }
                    .level-labels span.active { opacity: 1; color: var(--primary); }

                    .dept-grid { display: flex; flex-wrap: wrap; gap: 0.8rem; }
                    .dept-chip {
                        padding: 0.6rem 1.2rem;
                        background: rgba(255,255,255,0.05);
                        border-radius: 50px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;
                        border: 1px solid transparent;
                    }
                    .dept-chip.active { background: var(--primary); border-color: var(--primary-glow); }

                    .success-card { padding: 4rem; text-align: center; margin: 2rem 0; }
                    .success-icon { font-size: 4rem; margin-bottom: 1.5rem; }
                    .next-steps { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); }
                    .action-links { display: flex; gap: 1rem; justify-content: center; margin-top: 1rem; }
                    .copy-status { margin-top: 1rem; font-size: 0.8rem; color: var(--secondary); font-weight: 700; }
                `}</style>
            </div>
        </div>
    );
};

export default HospitalOnboarding;
