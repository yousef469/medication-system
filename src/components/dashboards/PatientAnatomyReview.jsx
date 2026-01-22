import React, { useState, useEffect } from 'react';
import Humanoid3D from '../visual/Humanoid3D';
import { useClinical } from '../../context/ClinicalContext';

const PatientAnatomyReview = ({ request, diagnosis, onBack }) => {
    const { analyzeClinicalRequest, fetchPatientHistory } = useClinical();
    const [highlightedParts, setHighlightedParts] = useState([]);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Auto-detect body parts from diagnosis text for 3D highlighting
    useEffect(() => {
        if (!diagnosis) return;

        const keywords = [
            'head', 'skull', 'brain', 'face',
            'neck', 'cervical',
            'chest', 'thorax', 'rib', 'lung', 'heart',
            'abdomen', 'stomach', 'liver', 'kidney',
            'arm', 'shoulder', 'elbow', 'wrist', 'hand', 'humerus', 'radius', 'ulna',
            'leg', 'thigh', 'femur', 'knee', 'shin', 'tibia', 'ankle', 'foot',
            'spine', 'back', 'vertebrae', 'lumbar'
        ];

        const detected = keywords.filter(part =>
            diagnosis.toLowerCase().includes(part)
        );

        // If AI hasn't set parts yet, or if this is initial load, use simple keywords
        if (highlightedParts.length === 0) {
            setHighlightedParts(detected);
        }
    }, [diagnosis]);

    // Auto-Run Analysis on Mount
    useEffect(() => {
        runAiAnalysis();
    }, []);

    const runAiAnalysis = async () => {
        if (isAnalyzing || aiAnalysis) return;
        setIsAnalyzing(true);

        try {
            // 1. Fetch Patient History for Context
            const history = await fetchPatientHistory(request.patient_id);

            // 2. Prepare Context for AI
            // If request has a file_url (from Supabase), pass it.
            const fileUrl = request.file_url;

            // Construct a rich prompt
            const contextText = `
                Patient: ${request.patient_name}
                Age/Gender: ${request.patient_age || 'Unknown'} / ${request.patient_gender || 'Unknown'}
                
                Current Complaint: ${request.complaint || request.service_requested}
                Current Vitals: BP ${request.vitals_data?.systolicBP}/${request.vitals_data?.diastolicBP}, HR ${request.vitals_data?.heartRate}, Temp ${request.vitals_data?.temp}
                Current Diagnosis Breakdown: ${diagnosis}
            `;

            // 3. Call Backend
            const result = await analyzeClinicalRequest(contextText, history || [], null, fileUrl);

            if (result.error) {
                setAiAnalysis(`**Analysis Error**\n${result.error}`);
            } else {
                setAiAnalysis(result.conclusion);

                // If AI returned specific markers, use them to override or augment simple keywords
                if (result.markers && result.markers.length > 0) {
                    const aiParts = result.markers.map(m => m.part);
                    setHighlightedParts(prev => [...new Set([...prev, ...aiParts])]);
                    // You could also store the status (RED/ORANGE) for more advanced visualization if Humanoid3D supports it
                }
            }
        } catch (err) {
            console.error("Anatomy Analysis Error:", err);
            setAiAnalysis("**System Error**\nUnable to reach AI Brain.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="anatomy-review-container fade-in">
            <style>{`
                .anatomy-review-container { 
                    position: fixed; 
                    top: 0; left: 0; right: 0; bottom: 0; 
                    background: #020617; 
                    z-index: 2000; 
                    display: flex; 
                    flex-direction: column;
                    color: white;
                }
                .ar-header {
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(15, 23, 42, 0.8);
                    border-bottom: 1px solid #1e293b;
                    backdrop-filter: blur(10px);
                    flex-shrink: 0;
                }
                .ar-body {
                    flex: 1;
                    position: relative;
                    display: flex;
                    overflow: hidden;
                }
                .ar-sidebar {
                    width: 300px;
                    background: rgba(2, 6, 23, 0.9);
                    border-left: 1px solid #1e293b;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    z-index: 10;
                    overflow-y: auto;
                    flex-shrink: 0;
                }
                .ar-viewport {
                    flex: 1;
                    position: relative;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                }
                .analysis-card {
                    background: rgba(30, 41, 59, 0.6);
                    border: 1px solid #334155;
                    border-radius: 12px;
                    padding: 1.5rem;
                }
                .ai-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    border: none;
                    padding: 1rem;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: 0.3s;
                    box-shadow: 0 4px 15px rgba(124, 68, 237, 0.3);
                }
                .ai-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(124, 68, 237, 0.5);
                }
                .ai-btn:disabled {
                    opacity: 0.7;
                    cursor: wait;
                    transform: none;
                }
                .analysis-content {
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: #cbd5e1;
                    white-space: pre-wrap;
                }
            `}</style>

            <header className="ar-header">
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>3D Bio-Anatomy Review</h2>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Patient: {request.patient_name} • Diagnosis Context: {diagnosis || 'Pending Analysis'}</div>
                </div>
                <button
                    onClick={onBack}
                    style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Close Review
                </button>
            </header>

            <div className="ar-body">
                <div className="ar-viewport">
                    <Humanoid3D
                        role="DOCTOR"
                        highlightedParts={highlightedParts}
                        markers={[]} // Could populate with pain points if available in request.complaint
                    />

                    {/* Diagnosis Overlay in 3D Space (UI only) */}
                    <div style={{ position: 'absolute', top: '20px', left: '20px', pointerEvents: 'none' }}>
                        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '10px 15px', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>ACTIVE DIAGNOSIS</div>
                            <div style={{ color: 'white', fontWeight: 600 }}>{diagnosis || 'No Diagnosis Selected'}</div>
                        </div>
                    </div>
                </div>

                <div className="ar-sidebar">
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#e2e8f0' }}>Gemini Clinical Intelligence</h3>
                        <button className="ai-btn" onClick={runAiAnalysis} disabled={isAnalyzing}>
                            {isAnalyzing ? (
                                <><span>⚙️</span> ANALYZING RECORDS...</>
                            ) : (
                                <><span>✨</span> GENERATE CASE SUMMARY</>
                            )}
                        </button>
                    </div>

                    {aiAnalysis && (
                        <div className="analysis-card fade-in">
                            <div className="analysis-content">
                                {aiAnalysis.split('**').map((part, i) =>
                                    i % 2 === 1 ? <strong key={i} style={{ color: '#818cf8' }}>{part}</strong> : part
                                )}
                            </div>
                            <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: '#64748b', textAlign: 'right' }}>
                                Powered by Gemini 1.5 Pro
                            </div>
                        </div>
                    )}

                    {!aiAnalysis && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem', border: '1px dashed #334155', borderRadius: '8px' }}>
                            Click "Generate Case Summary" to have Gemini analyze the patient's vitals, history, and uploaded documents for clinical insights.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientAnatomyReview;
