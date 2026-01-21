import React, { useState, useEffect } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';
import Humanoid3D from '../visual/Humanoid3D';
import ThemeToggle from '../shared/ThemeToggle';

const BioAnatomyLab = () => {
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
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const [history, vault] = await Promise.all([
                fetchPatientHistory(user.id),
                fetchDiagnoses(user.id)
            ]);
            setMedicalHistory(history);
            setDiagnosesVault(vault);
        } catch (err) {
            console.error("Data Load Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVaultUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log("[BioAnatomyLab] File selected:", file.name, file.size);
        setIsUploading(true);
        try {
            console.log("[BioAnatomyLab] Initiating upload to AI Cerebral Link...");
            const result = await uploadDiagnosis(file, file.name);
            console.log("[BioAnatomyLab] Upload success, reloading data...");
            await loadData();
            if (result) setSelectedDiagnosis(result);
            alert("✅ Neural analysis complete. Findings mapped to 3D structure.");
        } catch (err) {
            console.error("[BioAnatomyLab] Upload Error:", err);
            alert("❌ AI Cerebral Link Error: " + err.message + "\n\nTip: Ensure your laptop is running 'python server.py'");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset for re-upload
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

    // AI MESH HIGHLIGHTING INTEGRATION
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
            <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                marginBottom: '2rem',
                gap: '1rem'
            }}>
                <div>
                    <h1 className="text-gradient" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', marginBottom: '0.5rem' }}>Bio-Anatomy Laboratory</h1>
                    <p style={{ opacity: 0.6, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Advanced AI Diagnostic Environment • Patent ID: {user?.id?.slice(0, 8)} •
                        <span style={{
                            color: isBackendOnline ? '#4ade80' : '#ef4444',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                background: isBackendOnline ? '#4ade80' : '#ef4444',
                                borderRadius: '50%',
                                boxShadow: isBackendOnline ? '0 0 10px #4ade80' : '0 0 10px #ef4444'
                            }}></span>
                            {isBackendOnline ? 'NEURAL LINK ACTIVE' : 'SYSTEM OFFLINE'}
                        </span>
                    </p>
                </div>
                <ThemeToggle />
            </div>

            <div className="lab-grid" style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1fr 350px',
                gap: '2rem'
            }}>
                {/* Left Col: 3D Visualization */}
                <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(124, 68, 237, 0.4)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedDiagnosis && (
                            <div className="fade-in" style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                padding: '1.2rem',
                                borderRadius: '18px',
                                border: '1px solid #ef444455',
                                backdropFilter: 'blur(20px)',
                                width: '320px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 900 }}>AI CLINICAL CONCLUSION</h4>
                                <p style={{ fontSize: '0.85rem', margin: '0 0 1rem', fontWeight: 600, color: 'white' }}>{selectedDiagnosis.title}</p>
                                <p style={{ fontSize: '0.8rem', margin: '0 0 1rem', opacity: 0.9, lineHeight: 1.5 }}>
                                    {selectedDiagnosis.ai_conclusion || selectedDiagnosis.ai_raw_analysis?.conclusion}
                                </p>

                                {selectedDiagnosis.ai_raw_analysis?.mesh_names?.length > 0 && (
                                    <div style={{ marginBottom: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>Precision Highlights</p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                                            {selectedDiagnosis.ai_raw_analysis.mesh_names.map((mn, idx) => (
                                                <span key={idx} style={{ fontSize: '0.6rem', color: 'white', background: 'rgba(239, 68, 68, 0.4)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {mn}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedDiagnosis(null)}
                                    style={{ background: '#ef4444', border: 'none', color: 'white', fontSize: '0.65rem', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 800, width: '100%' }}
                                >
                                    ✕ EXIT ANALYSIS
                                </button>
                            </div>
                        )}
                    </div>


                    <div style={{ height: window.innerWidth < 768 ? '50vh' : '75vh' }}>
                        <Humanoid3D markers={allMarkers} highlightedParts={allHighlightedParts} />
                    </div>
                </div>

                {/* Right Col: Diagnostics Vault */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto', maxHeight: '85vh', border: '1px solid rgba(124, 68, 237, 0.2)' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.2rem' }}>
                            <span style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 5px var(--primary))' }}>📁</span> Neural Records
                        </h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    alert("DEBUG: Upload Button Clicked. Signaling Android picker...");
                                    fileInputRef.current?.click();
                                }}
                                disabled={isUploading}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'center',
                                    padding: '1rem',
                                    cursor: isUploading ? 'not-allowed' : 'pointer',
                                    fontWeight: 800,
                                    letterSpacing: '0.05em',
                                    background: 'linear-gradient(45deg, #7c44ed, #8b5cf6)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    boxShadow: '0 4px 15px rgba(124, 68, 237, 0.4)'
                                }}
                            >
                                {isUploading ? '🧬 ANALYZING...' : '🔬 UPLOAD NEW BIO-SCAN'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                onChange={handleVaultUpload}
                                accept="image/*,.pdf"
                            />
                        </div>

                        {isLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Syncing local vault...</div>
                        ) : diagnosesVault.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Vault empty. Upload data to begin mapping.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {diagnosesVault.map((diag) => (
                                    <div
                                        key={diag.id}
                                        onClick={() => setSelectedDiagnosis(diag)}
                                        style={{
                                            padding: '1rem',
                                            background: selectedDiagnosis?.id === diag.id ? 'rgba(124, 68, 237, 0.15)' : 'rgba(255,255,255,0.03)',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            border: `1px solid ${selectedDiagnosis?.id === diag.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                                            transition: 'all 0.3s ease',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>SCAN RESULT</span>
                                            <button
                                                onClick={(e) => handleDeleteDiagnosis(diag.id, e)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer', padding: '4px' }}
                                                title="Delete Record"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                        <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem' }}>{diag.title}</h4>
                                        <p style={{ margin: '0 0 0.8rem', fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.4 }}>
                                            {diag.ai_conclusion?.slice(0, 80)}...
                                        </p>

                                        <div style={{ fontSize: '0.6rem', marginBottom: '0.5rem' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>SYSTEM: </span>
                                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontWeight: 800 }}>
                                                {diag.suggested_layer || 'SYSTEMIC'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {diag.ai_markers?.map((m, idx) => (
                                                <span key={idx} style={{
                                                    fontSize: '0.65rem',
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    background: m.status === 'RED' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                                    color: m.status === 'RED' ? '#ef4444' : '#4ade80',
                                                    border: `1px solid ${m.status === 'RED' ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
                                                    fontWeight: 800
                                                }}>
                                                    {m.part}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BioAnatomyLab;
