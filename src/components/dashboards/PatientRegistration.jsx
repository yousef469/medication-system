import React, { useState, useRef } from 'react';
import { useClinical } from '../../context/ClinicalContext';

const PatientRegistration = ({ initialData = {}, onSave, onCancel }) => {
    const { registerPatient, saveAppointment, uploadFileToSupabase, doctors, patients } = useClinical();
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [formData, setFormData] = useState({
        uhid: 'NEW-' + Math.floor(Math.random() * 1000000),
        uhidDate: new Date().toISOString().split('T')[0],
        firstName: '', middleName: '', lastName: '',
        dob: '', age: '', gender: '',
        maritalStatus: '', occupation: '', language: 'English',
        religion: '', nationality: '', email: '',
        identityNo: '', visaValidity: '',
        address: '', province: '', district: '',
        postalCode: '', telephone: '',
        relativeName: '', relation: '', relativeTelephone: '',
        payerName: '', policyNo: '',
        photoUrl: '',
        ...initialData
    });

    const [showVisitModal, setShowVisitModal] = useState(false);
    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const url = await uploadFileToSupabase(file);
            setFormData(prev => ({ ...prev, photoUrl: url }));
        } catch (err) {
            console.error("Photo upload failed:", err);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let patient = null;

            // 1. Register Patient (if not existing)
            if (selectedPatientId) {
                patient = patients.find(p => p.id === selectedPatientId);
            } else {
                patient = await registerPatient(formData);
            }

            // 2. Save Appointment if exists
            if (formData.time && formData.date) {
                await saveAppointment({
                    patient_id: patient.id,
                    patient_name: `${formData.firstName} ${formData.lastName}`,
                    appointment_date: formData.date,
                    appointment_time: formData.time,
                    doctor_id: formData.doctorId,
                    clinic: formData.clinic,
                    type: 'Standard Visit',
                    status: 'BOOKED'
                });
            }

            if (onSave) onSave(patient);
            else onCancel(); // Default back to launchpad
        } catch (err) {
            alert("Failed to save record: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const selectExistingPatient = (p) => {
        setFormData(prev => ({
            ...prev,
            uhid: p.uhid,
            firstName: p.firstName,
            middleName: p.middleName || '',
            lastName: p.lastName,
            dob: p.dob,
            age: p.age,
            gender: p.gender,
            maritalStatus: p.maritalStatus,
            occupation: p.occupation,
            language: p.language,
            religion: p.religion,
            nationality: p.nationality,
            email: p.email,
            identityNo: p.identityNo,
            address: p.address,
            province: p.province,
            district: p.district,
            postalCode: p.postalCode,
            telephone: p.telephone,
            relativeName: p.relativeName,
            relation: p.relation,
            relativeTelephone: p.relativeTelephone,
            photoUrl: p.photoUrl
        }));
        setSelectedPatientId(p.id);
        setShowPatientList(false);
        setSearchTerm(`${p.firstName} ${p.lastName}`);
    };

    const filteredPatients = patients.filter(p =>
        p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.uhid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="registration-container fade-in">
            <style>{`
                .reg-section { background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--glass-border); padding: 1.5rem; margin-bottom: 1.5rem; }
                .reg-section-title { font-size: 0.85rem; font-weight: 800; color: var(--primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; }
                
                .reg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
                .reg-field { display: flex; flex-direction: column; gap: 0.4rem; }
                .reg-field label { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); opacity: 0.8; }
                
                .reg-input { border: 1px solid var(--glass-border); background: var(--bg-app); padding: 0.6rem 0.8rem; border-radius: 6px; font-size: 0.8rem; color: var(--text-primary); outline: none; transition: 0.2s; }
                .reg-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--glass-highlight); }
                
                .reg-actions { position: sticky; bottom: 0; background: var(--bg-app); padding: 1.5rem; border-top: 1px solid var(--glass-border); display: flex; gap: 1rem; justify-content: flex-end; z-index: 10; border-radius: 0 0 12px 12px; }

                .photo-uploader { width: 100px; height: 100px; border: 2px dashed var(--glass-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; background: var(--bg-app); transition: 0.3s; }
                .photo-uploader:hover { border-color: var(--primary); background: var(--glass-highlight); }
                .photo-preview { width: 100%; height: 100%; object-fit: cover; }

                .visit-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .visit-modal { background: white; width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
                .modal-header { background: var(--primary); color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.9rem; }
                .patient-search-item:hover { background: #f8fafc !important; }
            `}</style>

            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.25rem' }}>Patient Registration</h2>
                    {formData.time && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, marginTop: '0.25rem' }}>
                            🗓️ BOOKING APPOINTMENT: {formData.date} at {formData.time}
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative', marginRight: '1rem', width: '300px' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="reg-input"
                            style={{ width: '100%', paddingLeft: '2.5rem' }}
                            placeholder="Search Existing Patient (Name/UHID)..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowPatientList(true);
                                setSelectedPatientId(null); // Reset if user starts typing again
                            }}
                            onFocus={() => setShowPatientList(true)}
                        />
                        <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>
                    {showPatientList && searchTerm && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            background: 'white', border: '1px solid var(--glass-border)',
                            borderRadius: '8px', marginTop: '4px', maxHeight: '250px',
                            overflowY: 'auto', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }}>
                            {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                <div
                                    key={p.id}
                                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                    className="patient-search-item"
                                    onClick={() => selectExistingPatient(p)}
                                >
                                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)' }}>{p.firstName} {p.lastName}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>UHID: {p.uhid} | DOB: {p.dob}</div>
                                </div>
                            )) : (
                                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>No existing patients found.</div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary btn-sm" onClick={() => setShowVisitModal(true)}>+ Add Patient Visit</button>
                    <button className="btn-primary btn-sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : (selectedPatientId ? 'Update & Book' : 'Save Record')}
                    </button>
                    <button className="btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
                </div>
            </div>

            {/* Personal Details */}
            <div className="reg-section">
                <div className="reg-section-title">Personal Details <span>UHID: {formData.uhid}</span></div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: '0 0 120px' }}>
                        <div className="photo-uploader" onClick={() => fileInputRef.current.click()}>
                            {formData.photoUrl ? (
                                <img src={formData.photoUrl} className="photo-preview" />
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem' }}>👤</div>
                                    <div style={{ fontSize: '0.5rem', fontWeight: 800, textTransform: 'uppercase' }}>Upload Photo</div>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} hidden onChange={handlePhotoUpload} accept="image/*" />
                    </div>
                    <div className="reg-grid" style={{ flex: 1 }}>
                        <div className="reg-field">
                            <label>First Name*</label>
                            <input name="firstName" className="reg-input" value={formData.firstName} onChange={handleChange} placeholder="John" />
                        </div>
                        <div className="reg-field">
                            <label>Middle Name</label>
                            <input name="middleName" className="reg-input" value={formData.middleName} onChange={handleChange} />
                        </div>
                        <div className="reg-field">
                            <label>Last Name*</label>
                            <input name="lastName" className="reg-input" value={formData.lastName} onChange={handleChange} placeholder="Smith" />
                        </div>
                        <div className="reg-field">
                            <label>Date of Birth</label>
                            <input type="date" name="dob" className="reg-input" value={formData.dob} onChange={handleChange} />
                        </div>
                        <div className="reg-field">
                            <label>Age (Y-M-D)</label>
                            <input name="age" className="reg-input" value={formData.age} onChange={handleChange} placeholder="35Y 2M 10D" />
                        </div>
                        <div className="reg-field">
                            <label>Gender</label>
                            <select name="gender" className="reg-input" value={formData.gender} onChange={handleChange}>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Home Address */}
            <div className="reg-section">
                <div className="reg-section-title">Home Address</div>
                <div className="reg-grid">
                    <div className="reg-field" style={{ gridColumn: 'span 2' }}>
                        <label>Address / Village</label>
                        <input name="address" className="reg-input" value={formData.address} onChange={handleChange} />
                    </div>
                    <div className="reg-field">
                        <label>Province</label>
                        <input name="province" className="reg-input" value={formData.province} onChange={handleChange} />
                    </div>
                    <div className="reg-field">
                        <label>District / Khan</label>
                        <input name="district" className="reg-input" value={formData.district} onChange={handleChange} />
                    </div>
                    <div className="reg-field">
                        <label>Telephone</label>
                        <input name="telephone" className="reg-input" value={formData.telephone} onChange={handleChange} />
                    </div>
                </div>
            </div>

            {/* Nearest Relative */}
            <div className="reg-section">
                <div className="reg-section-title">Nearest Relative</div>
                <div className="reg-grid">
                    <div className="reg-field">
                        <label>Relative Name</label>
                        <input name="relativeName" className="reg-input" value={formData.relativeName} onChange={handleChange} />
                    </div>
                    <div className="reg-field">
                        <label>Relation</label>
                        <select name="relation" className="reg-input" value={formData.relation} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                        </select>
                    </div>
                    <div className="reg-field">
                        <label>Telephone</label>
                        <input name="relativeTelephone" className="reg-input" value={formData.relativeTelephone} onChange={handleChange} />
                    </div>
                </div>
            </div>

            {/* Add Visit Modal */}
            {showVisitModal && (
                <div className="visit-modal-overlay" onClick={() => setShowVisitModal(false)}>
                    <div className="visit-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span>Add Patient Visit</span>
                            <button onClick={() => setShowVisitModal(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <div className="reg-grid">
                                <div className="reg-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Visit Type</label>
                                    <select className="reg-input">
                                        <option>OPD Visit</option>
                                        <option>Emergency Visit</option>
                                        <option>Follow-up</option>
                                    </select>
                                </div>
                                <div className="reg-field" style={{ gridColumn: 'span 2' }}>
                                    <label>Chief Complaint</label>
                                    <textarea className="reg-input" style={{ minHeight: '80px' }} placeholder="Enter symptoms..."></textarea>
                                </div>
                                <div className="reg-field">
                                    <label>Clinic / Department</label>
                                    <select className="reg-input">
                                        <option>General Medicine</option>
                                        <option>Cardiology</option>
                                        <option>Pediatrics</option>
                                    </select>
                                </div>
                                <div className="reg-field">
                                    <label>Requested Doctor</label>
                                    <select className="reg-input">
                                        <option>Dr. Sarah Miller</option>
                                        <option>Dr. Alexander Vance</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={() => setShowVisitModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={() => setShowVisitModal(false)}>Confirm Visit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientRegistration;
