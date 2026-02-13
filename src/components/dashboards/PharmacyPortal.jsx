import React, { useState } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const PharmacyPortal = () => {
    const { scanPrescription, dispensePrescription, loading } = useClinical();
    const [tokenInput, setTokenInput] = useState('');
    const [scannedData, setScannedData] = useState(null);
    const [error, setError] = useState('');
    const [dispenseStatus, setDispenseStatus] = useState('idle'); // idle, processing, success, fail

    const handleScan = async (e) => {
        e.preventDefault();
        setError('');
        setScannedData(null);
        setDispenseStatus('idle');
        try {
            const data = await scanPrescription(tokenInput);
            setScannedData(data);
        } catch (err) {
            setError(err.message || "Failed to scan prescription");
        }
    };

    const handleDispense = async () => {
        if (!scannedData || !tokenInput) return;
        setDispenseStatus('processing');
        try {
            await dispensePrescription({
                token: tokenInput,
                pharmacy_id: "PHARM-G01", // Mock Pharmacy ID
                pharmacist_id: "PHARM-USER-22"
            });
            setDispenseStatus('success');
            setScannedData(prev => ({ ...prev, status: 'DISPENSED' }));
        } catch (err) {
            setDispenseStatus('fail');
            setError("Dispense Failed: " + err.message);
        }
    };

    return (
        <div className="pharmacy-app">
            <style>{`
                .pharmacy-app { background: #f0fdf4; min-height: 100vh; padding: 2rem; font-family: 'Inter', sans-serif; display: flex; justify-content: center; }
                .pharmacy-container { width: 100%; max-width: 600px; background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; }
                .ph-header { background: #15803d; color: white; padding: 1.5rem; text-align: center; }
                .ph-header h1 { font-size: 1.5rem; margin: 0; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                
                .ph-body { padding: 2rem; }
                .scan-box { border: 2px dashed #bbf7d0; padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 2rem; }
                .scan-input { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; text-align: center; letter-spacing: 2px; margin-bottom: 1rem; font-family: monospace; }
                
                .rx-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; }
                .rx-status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 99px; font-weight: 900; font-size: 0.75rem; margin-bottom: 1rem; }
                .status-active { background: #dcfce7; color: #166534; }
                .status-dispensed { background: #fee2e2; color: #991b1b; }
                
                .patient-block { display: flex; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 1rem; }
                .label { font-size: 0.7rem; color: #6b7280; font-weight: 700; text-transform: uppercase; }
                .value { font-size: 1rem; font-weight: 600; color: #111827; }
                
                .med-list { list-style: none; padding: 0; margin: 0; }
                .med-item { background: #f9fafb; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
                .med-name { font-weight: 700; color: #1f2937; }
                .med-dose { font-size: 0.85rem; color: #4b5563; }
                
                .finance-block { background: #eff6ff; padding: 1rem; border-radius: 8px; margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
                .finance-status { font-weight: 800; color: #1d4ed8; }
                
                .btn-dispense { width: 100%; background: #16a34a; color: white; border: none; padding: 1rem; font-weight: 800; font-size: 1.1rem; border-radius: 12px; cursor: pointer; margin-top: 2rem; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.4); }
                .btn-dispense:disabled { background: #9ca3af; cursor: not-allowed; box-shadow: none; }
                
                .btn-scan { background: #15803d; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
                
                .error-msg { background: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; font-weight: 600; }
                .success-msg { background: #ecfccb; color: #3f6212; padding: 2rem; text-align: center; border-radius: 12px; margin-top: 2rem; font-weight: 800; font-size: 1.25rem; }
            `}</style>

            <div className="pharmacy-container">
                <header className="ph-header">
                    <h1>💊 GreenCross Pharmacy Portal</h1>
                </header>

                <div className="ph-body">
                    <form onSubmit={handleScan} className="scan-box">
                        <input
                            type="text"
                            className="scan-input"
                            placeholder="Enter Token or Scan QR..."
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                        />
                        <button type="submit" className="btn-scan" disabled={loading}>
                            {loading ? 'Scanning...' : 'SCAN PRESCRIPTION'}
                        </button>
                    </form>

                    {error && <div className="error-msg">⚠️ {error}</div>}

                    {/* DISPENSED SUCCESS STATE */}
                    {dispenseStatus === 'success' && (
                        <div className="success-msg">
                            ✅ PRESCRIPTION DISPENSED
                            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 'normal' }}>
                                Logs updated at {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    )}

                    {/* PRESCRIPTION DETAILS */}
                    {scannedData && dispenseStatus !== 'success' && (
                        <div className="rx-card fade-in">
                            <span className={`rx-status-badge status-${scannedData.status.toLowerCase()}`}>
                                {scannedData.status}
                            </span>

                            <div className="patient-block">
                                <div>
                                    <div className="label">Patient Name</div>
                                    <div className="value">{scannedData.patient_name}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="label">Prescribed By</div>
                                    <div className="value">Dr. {scannedData.doctor_id}</div>
                                </div>
                            </div>

                            <div className="label" style={{ marginBottom: '0.5rem' }}>Medications</div>
                            <ul className="med-list">
                                {scannedData.medications && scannedData.medications.length > 0 ? (
                                    scannedData.medications.map((med, idx) => (
                                        <li key={idx} className="med-item">
                                            <div className="med-name">{med.name || "Medicine " + (idx + 1)}</div>
                                            <div className="med-dose">{med.dosage || "1 tab"} • {med.freq || "OD"}</div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="med-item">Amoxicillin 500mg (Mock)</li> // Fallback for demo if empty
                                )}
                            </ul>

                            <div className="finance-block">
                                <div>
                                    <div className="label">Insurance Coverage</div>
                                    <div className="finance-status">{scannedData.insurance_status}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="label">Patient Copay</div>
                                    <div className="value" style={{ color: '#b91c1c' }}>${scannedData.copay.toFixed(2)}</div>
                                </div>
                            </div>

                            {scannedData.status === 'ACTIVE' ? (
                                <button className="btn-dispense" onClick={handleDispense} disabled={loading || dispenseStatus === 'processing'}>
                                    {dispenseStatus === 'processing' ? 'Processing...' : 'CONFIRM DISPENSE ($15.00)'}
                                </button>
                            ) : (
                                <div className="error-msg" style={{ marginTop: '1rem' }}>
                                    Token {scannedData.status} - Cannot Dispense
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PharmacyPortal;
