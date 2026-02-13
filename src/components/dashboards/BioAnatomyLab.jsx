import React, { useState, useEffect } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';
import Humanoid3D from '../visual/Humanoid3D';
import ThemeToggle from '../shared/ThemeToggle';

const BioAnatomyLab = ({ patientId = null, patientName = null }) => {
    const { user } = useAuth();
    const { fetchDiagnoses, uploadDiagnosis, fetchPatientHistory, deleteDiagnosis, isBackendOnline } = useClinical();

    const [diagnosesVault, setDiagnosesVault] = useState([]);
    const [medicalHistory, setMedicalHistory] = useState([]);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        loadData();
    }, [user?.id, patientId]);

    const loadData = async () => {
        const targetId = patientId || user?.id;
        if (!targetId) return;

        setIsLoading(true);
        try {
            const [history, vault] = await Promise.all([
                fetchPatientHistory(targetId),
                fetchDiagnoses(targetId)
            ]);
            setMedicalHistory(history || []);
            setDiagnosesVault(vault || []);
        } catch (err) {
            console.error("Data Load Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVaultUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await uploadDiagnosis(file, file.name);
            await loadData();
            alert("✅ Neural analysis complete. Findings mapped to 3D structure.");
        } catch (err) {
            console.error("Upload Error:", err);
            alert("❌ AI Error: " + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteDiagnosis = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Permanently archive this bio-scan result?")) return;
        try {
            await deleteDiagnosis(id);
            if (selectedDiagnosis?.id === id) setSelectedDiagnosis(null);
            await loadData();
        } catch (err) {
            alert("Delete failed: " + err.message);
        }
    };

    const allMarkers = [
        ...medicalHistory.flatMap(r => r.ai_humanoid_markers || []),
        ...diagnosesVault.flatMap(d => d.ai_markers || [])
    ];

    const allHighlightedParts = [
        ...(selectedDiagnosis?.ai_raw_analysis?.mesh_names || []),
        ...diagnosesVault.flatMap(d => d.ai_raw_analysis?.mesh_names || [])
    ];

    return (
        <div className="bio-lab-page fade-in" style={{
            padding: 'clamp(1rem, 5vw, 2rem)',
            minHeight: '100vh',
            background: '#020617',
            color: '#f8fafc'
        }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', margin: 0 }}>
                        {patientName ? `${patientName}'s Bio-Anatomy Lab` : 'Personal Bio-Anatomy Laboratory'}
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '0.8rem', marginTop: '0.4rem' }}>
                        Advanced AI Diagnostic Environment • {isBackendOnline ? '🔬 NEURAL LINK ACTIVE' : '⚠️ SYSTEM OFFLINE'}
                    </p>
                </div>
                <ThemeToggle />
            </header>

            <div className="lab-grid" style={{
                display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 350px', gap: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(124, 68, 237, 0.4)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10, maxWidth: '300px' }}>
                        {selectedDiagnosis && (
                            <div className="fade-in" style={{
                                background: 'rgba(239, 68, 68, 0.1)', padding: '1.2rem', borderRadius: '18px', border: '1px solid #ef444455', backdropFilter: 'blur(20px)'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 900 }}>AI CLINICAL CONCLUSION</h4>
                                <p style={{ fontSize: '0.85rem', margin: '0 0 1rem', fontWeight: 600 }}>{selectedDiagnosis.title || selectedDiagnosis.report_name}</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                    {selectedDiagnosis.ai_conclusion || "Analyzing scan for anatomical anomalies..."}
                                </p>
                                <button
                                    onClick={() => setSelectedDiagnosis(null)}
                                    style={{ background: '#ef4444', border: 'none', color: 'white', fontSize: '0.65rem', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, width: '100%', marginTop: '1rem' }}
                                >
                                    ✕ CLOSE ANALYSIS
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ height: window.innerWidth < 768 ? '50vh' : '75vh' }}>
                        <Humanoid3D markers={allMarkers} highlightedParts={allHighlightedParts} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <section className="glass-card" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', maxHeight: '85vh', border: '1px solid rgba(124, 68, 237, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>📁 Neural Records</h3>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{diagnosesVault.length} Scans</span>
                        </div>

                        {!patientId && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '10px' }}
                                >
                                    {isUploading ? '🧬 ANALYZING...' : '🔬 UPLOAD NEW SCAN'}
                                </button>
                                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleVaultUpload} accept="image/*,.pdf" />
                            </div>
                        )}

                        {isLoading ? (
                            <p style={{ textAlign: 'center', opacity: 0.5 }}>Syncing records...</p>
                        ) : diagnosesVault.length === 0 ? (
                            <p style={{ textAlign: 'center', opacity: 0.3, padding: '2rem' }}>No scans available for this patient.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {diagnosesVault.map(diag => (
                                    <div
                                        key={diag.id}
                                        onClick={() => setSelectedDiagnosis(diag)}
                                        style={{
                                            padding: '1rem', cursor: 'pointer', borderRadius: '12px', transition: '0.3s',
                                            background: selectedDiagnosis?.id === diag.id ? 'rgba(124, 68, 237, 0.15)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${selectedDiagnosis?.id === diag.id ? 'var(--primary)' : 'transparent'}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>BIO-SCAN</span>
                                            {!patientId && <button onClick={(e) => handleDeleteDiagnosis(diag.id, e)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{diag.report_name}</div>
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.2rem' }}>{new Date(diag.created_at).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default BioAnatomyLab;
