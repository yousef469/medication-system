import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useClinical } from '../../context/ClinicalContext';
import { useAuth } from '../../context/useAuth';

const AppointmentScheduler = ({ onBookNew }) => {
    const { user } = useAuth();
    const { fetchAppointments, fetchDoctors, appointments, doctors } = useClinical();
    const [selectedClinic, setSelectedClinic] = useState('Outpatient');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [contextMenu, setContextMenu] = useState(null);
    const containerRef = useRef(null);

    // Initial Data Sync
    useEffect(() => {
        if (user?.hospital_id) {
            fetchDoctors(user.hospital_id);
            fetchAppointments(user.hospital_id);
        }
    }, [user?.hospital_id, fetchDoctors, fetchAppointments]);

    const clinics = ['Outpatient', 'Emergency', 'Cardiology', 'Pediatrics', 'Radiology', 'Neurology'];

    const filteredDoctors = useMemo(() => {
        return doctors.filter(d =>
            (d.specialty?.toLowerCase().includes(selectedClinic.toLowerCase()) || selectedClinic === 'Outpatient') &&
            d.hospital_id === user?.hospital_id
        );
    }, [doctors, selectedClinic, user?.hospital_id]);

    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
    ];

    const getAppointmentAt = (time) => {
        return appointments.find(app =>
            app.appointment_date === viewDate &&
            app.appointment_time === time &&
            (!selectedDoctor || app.doctor_id === selectedDoctor)
        );
    };

    const handleContextMenu = (e, time) => {
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        setContextMenu({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            time: time
        });
    };

    const closeContextMenu = () => setContextMenu(null);

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="scheduler-container fade-in" ref={containerRef} style={{ position: 'relative' }}>
            <style>{`
                .scheduler-header { display: flex; gap: 1rem; margin-bottom: 2rem; background: var(--bg-surface); padding: 1rem; border-radius: 12px; border: 1px solid var(--glass-border); flex-wrap: wrap; }
                .scheduler-filter { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; min-width: 150px; }
                .scheduler-filter label { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                
                .shift-grid { background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--glass-border); overflow: hidden; display: flex; flex-direction: column; }
                .grid-row { display: grid; grid-template-columns: 80px 1fr; border-bottom: 1px solid var(--glass-border); min-height: 50px; transition: background 0.2s; }
                .grid-row:hover { background: rgba(0,0,0,0.02); }
                .grid-row:last-child { border-bottom: none; }
                .time-label { padding: 1rem; font-size: 0.75rem; font-weight: 700; background: var(--bg-app); border-right: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; color: var(--text-primary); }
                .slot-area { display: flex; align-items: center; padding: 0 1rem; cursor: pointer; transition: 0.2s; position: relative; min-height: 60px; }
                .slot-area:hover { background: var(--glass-highlight); }
                
                .appointment-block { background: var(--primary); color: white; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; box-shadow: var(--shadow-main); width: 100%; border-left: 4px solid #0369a1; }
                .slot-empty { color: var(--text-muted); font-size: 0.65rem; font-style: italic; opacity: 0.5; }

                .context-menu { position: absolute; background: white; border: 1px solid var(--glass-border); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 100; min-width: 160px; padding: 0.5rem 0; overflow: hidden; }
                .menu-item { padding: 0.6rem 1rem; font-size: 0.75rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 0.75rem; color: #1e293b; }
                .menu-item:hover { background: #f1f5f9; color: var(--primary); }
            `}</style>

            <div className="scheduler-header">
                <div className="scheduler-filter">
                    <label>Clinic / Department</label>
                    <select className="search-field" value={selectedClinic} onChange={(e) => setSelectedClinic(e.target.value)}>
                        {clinics.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="scheduler-filter">
                    <label>Assigned Specialist</label>
                    <select className="search-field" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                        <option value="">All Hospital Doctors</option>
                        {filteredDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="scheduler-filter">
                    <label>Appointment Date</label>
                    <input type="date" className="search-field" value={viewDate} onChange={(e) => setViewDate(e.target.value)} />
                </div>
            </div>

            <div className="shift-grid">
                {timeSlots.map(time => {
                    const app = getAppointmentAt(time);
                    return (
                        <div className="grid-row" key={time} onContextMenu={(e) => handleContextMenu(e, time)}>
                            <div className="time-label">{time}</div>
                            <div className="slot-area">
                                {app ? (
                                    <div className="appointment-block">
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{app.patient_name}</span>
                                            <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>{app.type || 'General'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="slot-empty">Empty slot • Right-click to book</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {contextMenu && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="menu-item" onClick={() => {
                        onBookNew({
                            time: contextMenu.time,
                            date: viewDate,
                            doctorId: selectedDoctor,
                            clinic: selectedClinic
                        });
                        closeContextMenu();
                    }}>
                        <span>➕</span> New Appointment
                    </div>
                    <div className="menu-item">
                        <span>📋</span> View Details
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentScheduler;
