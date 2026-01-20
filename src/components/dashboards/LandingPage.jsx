import { useState, useEffect } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const LandingPage = ({ onGetStarted }) => {
    const { hospitals } = useClinical();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect if running as PWA (standalone)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            setIsStandalone(true);
        }

        const handler = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert("To install, please use your browser's menu (⋮ or Share) and select 'Add to Home Screen'. See the guide below!");
            return;
        }

        // Show the prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    return (
        <div className="landing-page">
            <section className="hero-section fade-in">
                {/* ... existing hero content ... */}
                <div className="hero-content">
                    <h1 className="hero-title text-gradient">The Future of Egyptian Healthcare</h1>
                    <p className="hero-subtitle">
                        Advanced Clinical Solutions. Global Medical Standards. Unified for Egypt.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary btn-large" onClick={onGetStarted}>
                            Explore Discovery Hub
                        </button>
                        <button className="btn-secondary btn-large" onClick={() => document.getElementById('discovery-hub').scrollIntoView({ behavior: 'smooth' })}>
                            View Hospital Network
                        </button>
                    </div>
                    <div style={{ marginTop: '1rem', opacity: 0.5, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                        System v2.0 • Mobile Config: {window.location.hostname}
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="floating-card discovery-node">
                        <span className="node-icon">🧬</span>
                        <div className="node-info">
                            <label>Expert Analysis</label>
                            <span>99.2% Accuracy</span>
                        </div>
                    </div>
                    <div className="floating-card clinical-node">
                        <span className="node-icon">🏥</span>
                        <div className="node-info">
                            <label>Network</label>
                            <span>50+ Centers</span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="discovery-hub" className="discovery-hub-section">
                <h2 className="section-title text-gradient">Our Elite Medical Network</h2>
                <p className="section-subtitle">Discover top-tier facilities participating in our secure healthcare ecosystem.</p>

                <div className="hospitals-preview-grid">
                    {hospitals.map(h => (
                        <div key={h.id} className="glass-card hospital-preview-card">
                            <div className="preview-image" style={{ backgroundImage: `url(${h.cover_image_url})` }}>
                                <div className="overlay-grad"></div>
                                <span className="status-badge moderate">ACTIVE NODE</span>
                                <div className="hospital-brand-float">
                                    <span className="brand-logo">{h.logo_url}</span>
                                </div>
                            </div>
                            <div className="preview-info">
                                <h3>{h.name}</h3>
                                <p className="loc">📍 {h.address}</p>
                                <p className="desc">{h.description}</p>
                                <div className="specialty-tags">
                                    {h.specialty_tags?.map(tag => (
                                        <span key={tag} className="s-tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {hospitals.length === 0 && <p style={{ opacity: 0.5, gridColumn: '1/-1', textAlign: 'center', padding: '4rem' }}>Initializing Medical Network Nodes...</p>}
                </div>

                <div className="discovery-cta">
                    <button className="btn-primary btn-large" style={{ boxShadow: '0 0 30px var(--primary-glow)' }} onClick={onGetStarted}>
                        Begin Professional Onboarding
                    </button>
                </div>
            </section>

            <section id="features" className="features-section">
                <h2 className="section-title text-gradient">Revolutionary Medical Access</h2>
                <div className="features-grid">
                    <div className="glass-card feature-card">
                        <div className="feat-icon">⚡</div>
                        <h3>Instant Triage</h3>
                        <p>Submit your symptoms or files for immediate clinical routing across Egypt's top hospitals.</p>
                    </div>
                    <div className="glass-card feature-card">
                        <div className="feat-icon">🏛️</div>
                        <h3>Top Centers</h3>
                        <p>Direct access to Kasr Al-Ainy, Hospital 57357, and Magdi Yacoub Heart Foundation at your fingertips.</p>
                    </div>
                    <div className="glass-card feature-card">
                        <div className="feat-icon">🔒</div>
                        <h3>Differentiated Security</h3>
                        <p>Enterprise-grade security for medical professionals and seamless, persistent access for patients.</p>
                    </div>
                </div>
            </section>

            {/* Always show install section (User Request) */}
            <section className="mobile-app-section glass-card fade-in">

                <div className="mobile-content">
                    <span className="platform-badge">NOW AVAILABLE AS PWA</span>
                    <h2 className="text-gradient">Clinical Care on Any Device</h2>
                    <p>
                        Experience our high-fidelity 3D Bio-Anatomy Lab and AI diagnostics directly in your pocket.
                        No downloads required—simply add the app to your home screen for a native experience.
                    </p>
                    <ul className="mobile-features">
                        <li><span>✓</span> Instant Installation (No APK)</li>
                        <li><span>✓</span> Native 3D Humanoid Engine</li>
                        <li><span>✓</span> Automatic Cloud Updates</li>
                    </ul>

                    {/* Premium Install Button */}
                    <div className="download-actions" style={{ marginBottom: '2rem' }}>
                        <button
                            className="btn-primary btn-large download-btn"
                            onClick={handleInstallClick}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            <span className="icon">📲</span>
                            <div className="btn-text">
                                <label>{deferredPrompt ? 'Install Now' : 'Tap to Install'}</label>
                                <span>Install Clinical Hub App</span>
                            </div>
                        </button>
                        {!deferredPrompt && (
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.5rem', textAlign: 'center' }}>
                                If nothing happens, see the guide below.
                            </p>
                        )}
                    </div>

                    <div className="installation-guide glass-card">
                        <h4>📲 Fallback Guide</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                            <div>
                                <h5 style={{ color: 'white', marginBottom: '0.5rem' }}>🤖 Android (Chrome)</h5>
                                <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
                                    <li>Open this page in Chrome</li>
                                    <li>Tap the <strong>three dots (⋮)</strong></li>
                                    <li>Select <strong>"Install App"</strong></li>
                                </ol>
                            </div>
                            <div>
                                <h5 style={{ color: 'white', marginBottom: '0.5rem' }}>🍎 iPhone (Safari)</h5>
                                <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem' }}>
                                    <li>Open this page in Safari</li>
                                    <li>Tap the <strong>Share</strong> button</li>
                                    <li>Select <strong>"Add to Home Screen"</strong></li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mobile-preview">
                    <div className="phone-mockup">
                        <div className="phone-screen">
                            <div className="screen-content">
                                <div className="pulse-circle"></div>
                                <span className="anatomy-symbol">🧬</span>
                                <div className="scan-line"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            <section className="impact-section glass-card">
                <div className="impact-info">
                    <h2>Our Mission in Egypt</h2>
                    <p>
                        We are bridging the gap between advanced clinical solutions and everyday patient care.
                        By localizing the world's most sophisticated medical standards for the Egyptian context,
                        we ensure every citizen has access to elite healthcare.
                    </p>
                </div>
                <div className="impact-stats">
                    <div className="stat-item">
                        <span className="stat-value">5M+</span>
                        <span className="stat-label">Scans Analyzed</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">120+</span>
                        <span className="stat-label">Specialists</span>
                    </div>
                </div>
            </section>

            <style>{`
                .landing-page {
                    padding-top: 4rem;
                }

                .hero-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 80vh;
                    gap: 4rem;
                    padding: 0 2rem;
                    margin-bottom: 6rem;
                }

                .hero-content {
                    flex: 1;
                    max-width: 650px;
                }

                .hero-title {
                    font-size: var(--font-size-2xl);
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .hero-subtitle {
                    font-size: var(--font-size-lg);
                    color: var(--text-secondary);
                    margin-bottom: 3rem;
                    line-height: 1.6;
                }

                .hero-actions {
                    display: flex;
                    gap: 1.5rem;
                }

                .btn-large {
                    padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1.5rem, 4vw, 2.5rem);
                    font-size: clamp(0.9rem, 1.1vw, 1.1rem);
                }

                .hero-visual {
                    flex: 1;
                    height: clamp(300px, 50vh, 500px);
                    background: radial-gradient(circle at center, var(--primary-glow-low), transparent 70%);
                    position: relative;
                }

                .floating-card {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 1.5rem;
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    animation: float 6s ease-in-out infinite;
                }

                .discovery-node { top: 20%; right: 10%; }
                .clinical-node { bottom: 30%; left: 10%; animation-delay: -3s; }

                .node-icon { font-size: 2rem; }
                .node-info label { display: block; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
                .node-info span { font-weight: 600; color: white; }

                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-30px) rotate(2deg); }
                }

                .features-section {
                    margin-bottom: 10rem;
                    text-align: center;
                }

                .section-title {
                    font-size: 3rem;
                    margin-bottom: 4rem;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                }

                .feature-card {
                    padding: 3rem 2rem;
                    text-align: left;
                    transition: transform 0.3s ease;
                }

                .feature-card:hover {
                    transform: translateY(-10px);
                }

                .feat-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1.5rem;
                    background: var(--glass-highlight);
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: var(--radius-md);
                }

                .feature-card h3 { margin-bottom: 1rem; }
                .feature-card p { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; }

                .impact-section {
                    padding: 4rem;
                    display: flex;
                    align-items: center;
                    gap: 4rem;
                }

                .impact-info { flex: 2; }
                .impact-info h2 { font-size: 2.5rem; margin-bottom: 1.5rem; }
                .impact-info p { color: var(--text-secondary); line-height: 1.8; font-size: 1.1rem; }

                .impact-stats {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .stat-item {
                    border-left: 4px solid var(--primary);
                    padding-left: 1.5rem;
                }

                .stat-value { font-size: 2.5rem; font-weight: 800; display: block; color: var(--primary); }
                .stat-label { color: var(--text-muted); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.1em; font-weight: 700; }

                .mobile-app-section {
                    margin-bottom: 8rem;
                    padding: 5rem;
                    display: flex;
                    align-items: center;
                    gap: 5rem;
                    background: linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(0, 0, 0, 0.2));
                    border: 1px solid rgba(124, 58, 237, 0.2);
                    position: relative;
                    overflow: hidden;
                }

                .mobile-content { flex: 1.5; }
                .platform-badge { 
                    font-size: 0.7rem; font-weight: 900; background: var(--primary); color: white; 
                    padding: 4px 12px; borderRadius: 4px; display: inline-block; margin-bottom: 1.5rem;
                    letter-spacing: 0.1em;
                }
                .mobile-content h2 { font-size: 3rem; margin-bottom: 1.5rem; line-height: 1.1; }
                .mobile-content p { color: var(--text-secondary); font-size: 1.1rem; line-height: 1.7; margin-bottom: 2rem; }
                
                .mobile-features { list-style: none; padding: 0; margin-bottom: 3rem; }
                .mobile-features li { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; font-weight: 600; color: #f8fafc; }
                .mobile-features li span { color: var(--primary); font-weight: 900; }

                .download-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 1.5rem;
                    text-decoration: none;
                    text-align: left;
                    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.3);
                }
                .download-btn .icon { font-size: 1.8rem; }
                .download-btn label { display: block; font-size: 0.7rem; opacity: 0.7; text-transform: uppercase; font-weight: 800; }
                .download-btn span { font-size: 1.1rem; font-weight: 700; }

                .download-btn.disabled {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-muted);
                    box-shadow: none;
                    filter: grayscale(1);
                    opacity: 0.5;
                }

                .install-note { font-size: 0.75rem; color: var(--text-muted); margin-top: 1rem; font-weight: 500; }

                .installation-guide {
                    margin-top: 2rem;
                    padding: 1.5rem;
                    text-align: left;
                    border: 1px solid rgba(124, 58, 237, 0.1);
                    background: rgba(15, 23, 42, 0.5);
                }
                .installation-guide h4 { font-size: 0.9rem; color: var(--primary); margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
                .installation-guide ol { padding-left: 1.2rem; margin-bottom: 1.5rem; }
                .installation-guide li { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
                .installation-guide li strong { color: white; }
                
                .security-note { 
                    font-size: 0.75rem; line-height: 1.5; color: var(--text-muted); 
                    border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;
                }
                .security-note strong { color: #f59e0b; }
                .security-note code { background: rgba(0,0,0,0.3); padding: 2px 4px; border-radius: 4px; color: var(--primary); }

                .mobile-preview { flex: 1; display: flex; justify-content: center; position: relative; }
                .phone-mockup {
                    width: 280px;
                    height: 560px;
                    background: #1e293b;
                    border: 8px solid #334155;
                    border-radius: 40px;
                    padding: 12px;
                    box-shadow: 0 50px 100px rgba(0,0,0,0.5);
                    position: relative;
                }
                .phone-screen {
                    width: 100%;
                    height: 100%;
                    background: #020617;
                    border-radius: 28px;
                    overflow: hidden;
                    position: relative;
                }
                .screen-content {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .pulse-circle {
                    width: 150px; height: 150px;
                    border: 2px solid var(--primary);
                    border-radius: 50%;
                    position: absolute;
                    animation: circlePulse 2s infinite;
                }
                .anatomy-symbol { font-size: 4rem; z-index: 2; position: relative; }
                .scan-line {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 2px;
                    background: linear-gradient(90deg, transparent, var(--primary), transparent);
                    box-shadow: 0 0 15px var(--primary);
                    animation: scanMove 4s infinite linear;
                }

                @keyframes circlePulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes scanMove {
                    0% { top: 0; }
                    100% { top: 100%; }
                }

                .discovery-hub-section {
                    padding: 6rem 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .section-subtitle {
                    color: var(--text-muted);
                    margin-bottom: 4rem;
                }

                .hospitals-preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 2rem;
                    margin-bottom: 4rem;
                }

                .hospital-preview-card {
                    padding: 0;
                    overflow: hidden;
                    text-align: left;
                    transition: transform 0.3s ease;
                }

                .hospital-preview-card:hover { transform: translateY(-10px); }

                .preview-image {
                    height: 200px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                }

                .status-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                }

                .status-badge.maximal { color: #ef4444; border: 1px solid #ef4444; }
                .status-badge.high { color: #f59e0b; border: 1px solid #f59e0b; }
                .status-badge.moderate { color: #10b981; border: 1px solid #10b981; }

                .preview-info { padding: 1.5rem; }
                .preview-info h3 { margin-bottom: 0.5rem; font-size: 1.25rem; }
                .preview-info .loc { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem; }
                .preview-info .desc { font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1.5rem; }

                .overlay-grad { 
                    position: absolute; inset: 0; 
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); 
                }

                .hospital-brand-float {
                    position: absolute; bottom: -1rem; left: 1.5rem;
                    width: 48px; height: 48px; background: var(--bg-dark);
                    border: 1px solid var(--glass-border); border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.5); z-index: 2;
                }
                .brand-logo { font-size: 1.5rem; }

                .specialty-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .s-tag { 
                    font-size: 0.65rem; padding: 2px 8px; border-radius: 4px;
                    background: rgba(124, 58, 237, 0.1); color: var(--primary);
                    border: 1px solid rgba(124, 58, 237, 0.2); font-weight: 700;
                }

                .discovery-cta { text-align: center; }

                    .hero-title { font-size: 3rem; }
                    /* Hide Professional Registration on Mobile */
                    .discovery-cta { display: none; }

                    .mobile-app-section {
                        padding: 3rem 1.5rem !important;
                        flex-direction: column !important;
                        gap: 3rem !important;
                        text-align: center;
                        margin-left: 0.5rem;
                        margin-right: 0.5rem;
                    }

                    .mobile-content h2 { font-size: 2.2rem; }
                    .mobile-content p { font-size: 1rem; }
                    .mobile-features { margin-bottom: 2rem; }
                    .mobile-features li { justify-content: center; font-size: 0.9rem; }
                    
                    .phone-mockup {
                        width: 240px;
                        height: 480px;
                    }

                    .installation-guide {
                        padding: 1rem;
                    }
                    .installation-guide h4 { font-size: 0.8rem; }
                    .installation-guide ol { text-align: left; }
                }

            `}</style>
        </div>
    );
};

export default LandingPage;
