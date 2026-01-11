import { useClinical } from '../../context/ClinicalContext';

const LandingPage = ({ onGetStarted }) => {
    const { hospitals } = useClinical();

    return (
        <div className="landing-page">
            <section className="hero-section fade-in">
                <div className="hero-content">
                    <h1 className="hero-title text-gradient">The Future of Egyptian Healthcare</h1>
                    <p className="hero-subtitle">
                        Advanced AI Diagnostics. Global Clinical Standards. Unified for Egypt.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary btn-large" onClick={onGetStarted}>
                            Explore Discovery Hub
                        </button>
                        <button className="btn-secondary btn-large" onClick={() => document.getElementById('discovery-hub').scrollIntoView({ behavior: 'smooth' })}>
                            View Hospital Network
                        </button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="floating-card discovery-node">
                        <span className="node-icon">🧬</span>
                        <div className="node-info">
                            <label>AI Analysis</label>
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
                <p className="section-subtitle">Discover top-tier facilities participating in our advanced triage system</p>

                <div className="hospitals-preview-grid">
                    {hospitals.map(h => (
                        <div key={h.id} className="glass-card hospital-preview-card">
                            <div className="preview-image" style={{ backgroundImage: `url(${h.image})` }}>
                                <span className={`status-badge ${h.busyStatus}`}>{h.busyStatus.toUpperCase()}</span>
                            </div>
                            <div className="preview-info">
                                <h3>{h.name}</h3>
                                <p className="loc">📍 {h.location}</p>
                                <p className="desc">{h.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="discovery-cta">
                    <button className="btn-primary btn-large" onClick={onGetStarted}>Sign In to Book Appointment</button>
                </div>
            </section>

            <section id="features" className="features-section">
                <h2 className="section-title text-gradient">Revolutionary Medical Access</h2>
                <div className="features-grid">
                    <div className="glass-card feature-card">
                        <div className="feat-icon">⚡</div>
                        <h3>Instant Triage</h3>
                        <p>Submit your symptoms or files for immediate AI-powered clinical routing across Egypt's top hospitals.</p>
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

            <section className="impact-section glass-card">
                <div className="impact-info">
                    <h2>Our Mission in Egypt</h2>
                    <p>
                        We are bridging the gap between advanced clinical AI and everyday patient care.
                        By localizing the world's most sophisticated medical models for the Egyptian context,
                        we ensure every citizen has access to elite diagnostics.
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

            <style jsx>{`
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
                    font-size: 4.5rem;
                    line-height: 1.1;
                    margin-bottom: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                .hero-subtitle {
                    font-size: 1.25rem;
                    color: var(--text-secondary);
                    margin-bottom: 3rem;
                    line-height: 1.6;
                }

                .hero-actions {
                    display: flex;
                    gap: 1.5rem;
                }

                .btn-large {
                    padding: 1.2rem 2.5rem;
                    font-size: 1.1rem;
                }

                .hero-visual {
                    flex: 1;
                    height: 500px;
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
                    grid-template-columns: repeat(3, 1fr);
                    gap: 2.5rem;
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
                .preview-info .desc { font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); }

                .discovery-cta { text-align: center; }

                @media (max-width: 1024px) {
                    .hero-section { flex-direction: column; text-align: center; }
                    .features-grid { grid-template-columns: 1fr; }
                    .impact-section { flex-direction: column; padding: 2rem; }
                    .hero-title { font-size: 3rem; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
