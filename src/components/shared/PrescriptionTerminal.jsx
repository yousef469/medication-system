import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useClinical } from '../../context/ClinicalContext';

const PrescriptionTerminal = () => {
    const { token } = useParams();
    const { scanPrescription, hospitals, doctors } = useClinical();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPrescription = async () => {
            try {
                const data = await scanPrescription(token);
                setPrescription(data);
            } catch (err) {
                console.error("Terminal Load Error:", err);
                setError(err.message || "Unable to retrieve clinical document.");
            } finally {
                setLoading(false);
            }
        };
        if (token) loadPrescription();
    }, [token, scanPrescription]);

    if (loading) {
        return (
            <div className="terminal-container loading">
                <div className="pulse-loader"></div>
                <p>Authenticating Digital Token...</p>
                <style>{`
                    .terminal-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617; color: white; font-family: 'Inter', sans-serif; }
                    .pulse-loader { width: 40px; height: 40px; border-radius: 50%; background: #10b981; animation: pulse 1.5s infinite; }
                    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
                `}</style>
            </div>
        );
    }

    if (error || !prescription) {
        return (
            <div className="terminal-container error">
                <div className="error-icon">⚠️</div>
                <h2>Security Alert</h2>
                <p>{error || "Prescription not found or expired."}</p>
                <Link to="/" className="btn-home">Return to Portal</Link>
                <style>{`
                    .terminal-container { padding: 2rem; text-align: center; background: #020617; color: white; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .error-icon { font-size: 3rem; margin-bottom: 1rem; }
                    .btn-home { margin-top: 2rem; padding: 0.8rem 1.5rem; background: #7c3aed; color: white; text-decoration: none; borderRadius: 12px; font-weight: 700; }
                `}</style>
            </div>
        );
    }

    const hospital = hospitals.find(h => h.id === prescription.hospital_id);
    const doctor = doctors.find(d => d.id === prescription.doctor_id);

    return (
        <div className="prescription-document">
            <div className="document-paper">
                {/* Header: Hospital Info */}
                <header className="doc-header">
                    <div className="hospital-brand">
                        <div className="hosp-logo">🏥</div>
                        <div className="hosp-info">
                            <h1>{hospital?.name || "Egyptian Medical Center"}</h1>
                            <p>{hospital?.address || "Clinical Network Node"}</p>
                        </div>
                    </div>
                    <div className="status-badge" data-status={prescription.status}>
                        {prescription.status}
                    </div>
                </header>

                <div className="divider"></div>

                {/* Patient & Case Info */}
                <section className="meta-section">
                    <div className="meta-item">
                        <label>Patient ID</label>
                        <p className="monospace">{prescription.patient_id?.slice(0, 8) || "N/A"}</p>
                    </div>
                    <div className="meta-item">
                        <label>Patient Name</label>
                        <p>{prescription.patient_name}</p>
                    </div>
                    <div className="meta-item">
                        <label>Date Issued</label>
                        <p>{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="meta-item">
                        <label>Document ID</label>
                        <p className="monospace">{token.slice(0, 8).toUpperCase()}</p>
                    </div>
                </section>

                <div className="divider"></div>

                {/* Medication List */}
                <section className="medication-section">
                    <h2>℞ Medication Schedule</h2>
                    <div className="med-grid">
                        {prescription.medications && prescription.medications.length > 0 ? (
                            prescription.medications.map((med, idx) => (
                                <div key={idx} className="med-item">
                                    <div className="med-head">
                                        <span className="med-name">{med.name}</span>
                                        <span className="med-dose">{med.dosage}</span>
                                    </div>
                                    <div className="med-instructions">{med.instructions}</div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-meds">No medications listed on this digital order.</p>
                        )}
                    </div>
                </section>

                <div className="divider"></div>

                {/* Doctor Note & Signature */}
                <footer className="doc-footer">
                    <div className="physician-sign">
                        <label>Prescribing Physician</label>
                        <p className="dr-name">Dr. {doctor?.name || "Medical Specialist"}</p>
                        <div className="signature-line">
                            <span className="sign-swash">Clinically Verified</span>
                        </div>
                    </div>
                    <div className="security-footer">
                        <p>This is a secure digital document. Tampering is a federal clinical offense.</p>
                        <p className="validity">Valid for 24 hours from issuance.</p>
                    </div>
                </footer>
            </div>

            <style>{`
                .prescription-document {
                    background: #f1f5f9;
                    min-height: 100vh;
                    padding: 2rem 1rem;
                    display: flex;
                    justify-content: center;
                    color: #1e293b;
                    font-family: 'Inter', sans-serif;
                }
                .document-paper {
                    background: white;
                    width: 100%;
                    max-width: 800px;
                    padding: 3rem;
                    border-radius: 4px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    position: relative;
                }
                .doc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }
                .hospital-brand { display: flex; gap: 1rem; align-items: center; }
                .hosp-logo { font-size: 2.5rem; }
                .hosp-info h1 { margin: 0; font-size: 1.5rem; font-weight: 900; color: #0f172a; text-transform: uppercase; }
                .hosp-info p { margin: 0; font-size: 0.8rem; color: #64748b; }
                
                .status-badge {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .status-badge[data-status='ACTIVE'] { background: #dcfce7; color: #166534; }
                .status-badge[data-status='DISPENSED'] { background: #f1f5f9; color: #475569; }

                .divider { height: 2px; background: #e2e8f0; margin: 2rem 0; }

                .meta-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1.5rem;
                }
                .meta-item label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.3rem; }
                .meta-item p { margin: 0; font-weight: 700; font-size: 0.95rem; }
                .monospace { font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em; }

                .medication-section h2 { font-size: 1rem; font-weight: 900; margin-bottom: 1.5rem; color: #0f172a; display: flex; align-items: center; gap: 0.5rem; }
                .med-grid { display: flex; flex-direction: column; gap: 1rem; }
                .med-item { padding: 1rem; background: #f8fafc; border-radius: 8px; border-left: 4px solid #10b981; }
                .med-head { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
                .med-name { font-weight: 800; font-size: 1rem; }
                .med-dose { color: #10b981; font-weight: 900; font-size: 0.8rem; }
                .med-instructions { font-size: 0.85rem; color: #475569; line-height: 1.5; }

                .doc-footer { margin-top: 4rem; display: flex; justify-content: space-between; align-items: flex-end; }
                .dr-name { font-weight: 900; font-size: 1.1rem; margin: 0.2rem 0; }
                .signature-line { border-top: 1px solid #64748b; margin-top: 1rem; padding-top: 0.5rem; width: 180px; }
                .sign-swash { font-family: 'Petit Formal Script', cursive; font-size: 0.8rem; color: #10b981; }

                .security-footer { text-align: right; max-width: 250px; }
                .security-footer p { font-size: 0.6rem; color: #94a3b8; margin: 0.2rem 0; line-height: 1.4; }
                .validity { font-weight: 900; color: #ef4444; }

                @media (max-width: 600px) {
                    .document-paper { padding: 1.5rem; }
                    .doc-header { flex-direction: column; gap: 1rem; }
                    .doc-footer { flex-direction: column; align-items: flex-start; gap: 2rem; }
                    .security-footer { text-align: left; max-width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default PrescriptionTerminal;
