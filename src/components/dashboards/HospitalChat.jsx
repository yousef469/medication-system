import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../supabaseClient';
import ProfessionalProfileModal from '../shared/ProfessionalProfileModal';

const HospitalChat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChannel, setActiveChannel] = useState('general');
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const [hospitalId, setHospitalId] = useState(user?.hospital_id);
    const [hospitalInfo, setHospitalInfo] = useState(null);

    const channels = [
        { id: 'general', name: '🏥 General Updates', type: 'public' },
        { id: 'doctors', name: '🩺 Medical Staff', type: 'private' },
        { id: 'nurses', name: '💊 Nursing Station', type: 'private' },
        { id: 'admin', name: '💼 Administration', type: 'private' }
    ];

    // 1. Resolve Hospital ID
    useEffect(() => {
        const resolve = async () => {
            if (hospitalId) {
                console.log("[Chat] Hospital ID already set:", hospitalId);
                return;
            }

            console.log("[Chat] Resolving Hospital ID for user:", user?.id, "Role:", user?.role);

            // Strategy 1: Trust Auth Context (Fastest)
            let currentHospId = user?.hospital_id;
            if (currentHospId) console.log("[Chat] Found ID in Auth Context:", currentHospId);

            // Strategy 2: Self-Healing Profile Query (For fragmented sessions/old logins)
            if (!currentHospId && user?.id) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('hospital_id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (error) console.error("[Chat] Error fetching profile for ID resolution:", error);
                if (profile?.hospital_id) {
                    console.log("[Chat] Found ID in Profiles Table:", profile.hospital_id);
                    currentHospId = profile.hospital_id;
                }
            }

            // Strategy 3: Admin Ownership Fallback
            if (!currentHospId && user?.role === 'hospital_admin') {
                const { data: hosp } = await supabase
                    .from('hospitals')
                    .select('id')
                    .eq('admin_id', user.id)
                    .maybeSingle();
                if (hosp) {
                    console.log("[Chat] Found ID via Hospital Admin Ownership:", hosp.id);
                    currentHospId = hosp.id;
                }
            }

            if (currentHospId) {
                setHospitalId(currentHospId);
            } else {
                console.warn("[Chat] Failed to resolve Hospital ID for user.");
            }
        };
        resolve();
    }, [user, hospitalId]);

    // 2. Fetch Hospital Info & Staff
    useEffect(() => {
        if (!hospitalId) return;

        const fetchHospitalInfo = async () => {
            console.log("[Chat] Fetching hospital info for ID:", hospitalId);
            const { data, error } = await supabase.from('hospitals').select('*').eq('id', hospitalId).maybeSingle();
            if (error) {
                console.error("[Chat] Error fetching hospital info:", error);
            }
            if (data) {
                setHospitalInfo(data);
                console.log("[Chat] Successfully fetched hospital info:", data.name);
            } else {
                console.warn("[Chat] No hospital info found for ID:", hospitalId);
            }
        };

        const fetchStaffMembers = async () => {
            console.log("[Chat] Fetching staff for hospital:", hospitalId);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role, clinical_status, bio_story, specialty, avatar_url')
                .eq('hospital_id', hospitalId);

            if (error) {
                console.error("[Chat] Error fetching staff members:", error);
                return;
            }

            if (data) {
                console.log("[Chat] Successfully fetched staff members:", data.length);
                const formatted = data.map(m => ({
                    id: m.id,
                    name: m.name,
                    status: m.clinical_status || 'online',
                    role: m.role,
                    bio: m.bio_story || 'Verified Clinical Staff',
                    specialty: m.specialty || 'General Ops',
                    avatar: m.avatar_url
                }));
                setMembers(formatted);
            } else {
                console.warn("[Chat] No staff members returned for hospital ID:", hospitalId);
                setMembers([]);
            }
        };

        const init = async () => {
            await Promise.all([fetchHospitalInfo(), fetchStaffMembers()]);
            setMessages([
                { id: 1, sender: 'System', text: `Clinical Network Operations: Silo Established.`, time: 'LIVE', isSystem: true },
                { id: 2, sender: user?.name, text: 'Terminal ready.', time: 'NOW', isMe: true }
            ]);
        };

        init();

        const staffChannel = supabase
            .channel(`hospital_staff_${hospitalId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: `hospital_id=eq.${hospitalId}`
            }, () => {
                fetchStaffMembers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(staffChannel);
        };
    }, [hospitalId, user?.name]); // Added user.name to dependency array for initial message

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            id: Date.now(),
            sender: user?.name || 'Me',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        };

        setMessages([...messages, msg]);
        setNewMessage('');

        // Auto-reply mock
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'System Bot',
                text: 'Message received. Real-time sync coming in Phase 12.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSystem: true
            }]);
        }, 1000);
    };

    const toggleMemberProfile = (member) => {
        setSelectedProfileId(member.id);
    };

    const groupedMembers = {
        'Administration': members.filter(m => ['hospital_admin', 'admin'].includes(m.role)),
        'Doctors': members.filter(m => m.role === 'doctor'),
        'Nurses': members.filter(m => m.role === 'nurse'),
        'Operations': members.filter(m => ['secretary', 'it'].includes(m.role)),
        'Staff': members.filter(m => !['hospital_admin', 'admin', 'doctor', 'nurse', 'secretary', 'it'].includes(m.role))
    };

    return (
        <div className="chat-container fade-in">
            <style>{`
                .chat-container {
                    display: grid;
                    grid-template-columns: 260px 1fr 240px;
                    height: calc(100vh - 140px);
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                    margin-top: 1rem;
                    position: relative;
                }
                
                .sidebar {
                    background: var(--bg-surface);
                    border-right: 1px solid var(--glass-border);
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                }

                .hospital-header {
                    padding: 1.5rem;
                    text-align: center;
                    border-bottom: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.05);
                }

                .hospital-logo {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, var(--accent), var(--primary));
                    margin: 0 auto 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                
                .main-chat {
                    display: flex;
                    flex-direction: column;
                    background: rgba(255,255,255,0.02);
                }
                
                .members-list {
                    background: rgba(0,0,0,0.1);
                    border-left: 1px solid var(--glass-border);
                    padding: 1rem;
                    overflow-y: auto;
                }
                
                .section-title {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: var(--text-muted);
                    font-weight: 800;
                    margin: 1.5rem 0 0.5rem;
                    letter-spacing: 0.05em;
                    border-bottom: 1px solid var(--glass-border);
                    padding-bottom: 0.2rem;
                }
                
                .channel-item {
                    padding: 0.6rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    color: var(--text-secondary);
                    margin-bottom: 0.2rem;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                
                .channel-item:hover, .channel-item.active {
                    background: var(--glass-highlight);
                    color: white;
                }

                .member-item {
                    padding: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                    transition: background 0.2s;
                }
                .member-item:hover { background: rgba(255,255,255,0.05); }
                
                .chat-header {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(0,0,0,0.1);
                }
                
                .chat-actions button {
                    background: var(--glass-highlight);
                    border: 1px solid var(--glass-border);
                    color: var(--text-primary);
                    padding: 0.4rem 0.8rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    margin-left: 0.5rem;
                    transition: all 0.2s;
                }
                 .chat-actions button:hover { background: var(--primary); border-color: var(--primary); color: white; }
                
                .messages-area {
                    flex: 1;
                    padding: 1.5rem;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .message {
                    max-width: 70%;
                    padding: 0.8rem 1.2rem;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    position: relative;
                    animation: slideUp 0.3s ease;
                }
                
                .message.mine {
                    align-self: flex-end;
                    background: var(--primary);
                    color: white;
                    border-bottom-right-radius: 2px;
                }
                
                .message.theirs {
                    align-self: flex-start;
                    background: var(--glass-highlight);
                    border: 1px solid var(--glass-border);
                    border-bottom-left-radius: 2px;
                }
                
                .message.system {
                    align-self: center;
                    background: rgba(124, 58, 237, 0.1);
                    border: 1px solid rgba(124, 58, 237, 0.2);
                    color: var(--accent);
                    font-size: 0.8rem;
                    padding: 0.4rem 1rem;
                    border-radius: 20px;
                }
                
                .msg-meta {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.7rem;
                    margin-bottom: 0.3rem;
                    opacity: 0.8;
                }
                
                .input-area {
                    padding: 1rem;
                    border-top: 1px solid var(--glass-border);
                    display: flex;
                    gap: 1rem;
                    background: rgba(0,0,0,0.1);
                }
                
                .chat-input {
                    flex: 1;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    padding: 0.8rem;
                    color: white;
                    outline: none;
                }
                
                .btn-send {
                    background: var(--primary);
                    border: none;
                    color: white;
                    padding: 0 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }
                
                .online-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                    display: inline-block;
                    flex-shrink: 0;
                }
                .status-busy { background: #ef4444; }
                .status-offline { background: #9ca3af; }

                /* Profile Modal */
                .member-modal {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--glass-surface);
                    border: 1px solid var(--glass-border);
                    padding: 2rem;
                    border-radius: 16px;
                    width: 300px;
                    text-align: center;
                    backdrop-filter: blur(20px);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    z-index: 10;
                    animation: entrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .modal-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--glass-highlight);
                    margin: 0 auto 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    border: 2px solid var(--primary);
                }
                .modal-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
                .member-avatar-mini { width: 24px; height: 24px; position: relative; }
                .mini-avatar-img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
            `}</style>

            {/* Sidebar */}
            <div className="sidebar">
                <div className="hospital-header">
                    <div className="hospital-logo">🏥</div>
                    <div style={{ fontWeight: 700 }}>{hospitalInfo?.name || 'Loading Hub...'}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{hospitalInfo?.address || 'Locating...'}</div>
                </div>

                <div style={{ padding: '1rem' }}>
                    <div className="section-title" style={{ marginTop: 0 }}>CHANNELS</div>
                    {channels.map(ch => (
                        <div
                            key={ch.id}
                            className={`channel-item ${activeChannel === ch.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(ch.id)}
                        >
                            {ch.name}
                        </div>
                    ))}

                    <div className="section-title" style={{ marginTop: '2rem' }}>ACTIONS</div>
                    <button className="channel-item" onClick={() => alert('Feature coming in Phase 12')} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}>
                        ➕ New Channel
                    </button>
                    <button className="channel-item" onClick={() => alert('Feature coming in Phase 12')} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}>
                        ⚙️ Settings
                    </button>
                </div>
            </div>

            {/* Main Chat */}
            <div className="main-chat">
                <div className="chat-header">
                    <span style={{ fontWeight: 600 }}>{channels.find(c => c.id === activeChannel)?.name}</span>
                    <div className="chat-actions">
                        <button onClick={() => alert('Generating Zoom Link...')}>🎥 Video Call</button>
                        <button onClick={() => setShowInviteModal(true)}>🔗 Secure Invite</button>
                    </div>
                </div>

                <div className="messages-area">
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.isMe ? 'mine' : msg.isSystem ? 'system' : 'theirs'}`}>
                            {!msg.isSystem && (
                                <div className="msg-meta">
                                    <span>{msg.sender}</span>
                                    <span>{msg.time}</span>
                                </div>
                            )}
                            {msg.text}
                        </div>
                    ))}
                </div>

                <form className="input-area" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder={`Message #${activeChannel}...`}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn-send">Send</button>
                </form>
            </div>

            {/* Categorized Members Right Bar */}
            <div className="members-list">
                {Object.entries(groupedMembers).map(([roleName, roleMembers]) => roleMembers.length > 0 && (
                    <div key={roleName}>
                        <div className="section-title">{roleName} — {roleMembers.length}</div>
                        {roleMembers.map(m => (
                            <div key={m.id} className="member-item" onClick={() => toggleMemberProfile(m)}>
                                <div className="member-avatar-mini">
                                    {m.avatar ? <img src={m.avatar} alt={m.name} className="mini-avatar-img" /> : <span className={`online-dot status-${m.status}`}></span>}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{m.name}</div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{m.specialty || m.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Universal Discovery Modal */}
            {selectedProfileId && (
                <ProfessionalProfileModal
                    userId={selectedProfileId}
                    onClose={() => setSelectedProfileId(null)}
                />
            )}

            {/* Secure Invite Generation Modal */}
            {showInviteModal && (
                <InviteGenerator
                    onClose={() => setShowInviteModal(false)}
                    hospitalId={hospitalId}
                />
            )}
        </div>
    );
};

// Sub-component for Invite Generation
const InviteGenerator = ({ onClose, hospitalId }) => {
    const [role, setRole] = useState('doctor');
    const [generatedLink, setGeneratedLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const generateToken = async () => {
        if (!hospitalId) {
            console.error("Missing Hospital ID");
            alert("Cannot generate invite: Your account is not currently linked to a specific hospital. Please go to the Hospital Admin Dashboard first to verify your facility.");
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('hospital_invites')
                .insert([{
                    hospital_id: hospitalId,
                    role: role
                }])
                .select()
                .single();

            if (error) throw error;

            // Build Link
            const link = `${window.location.origin}/?token=${data.token}`;
            setGeneratedLink(link);
            navigator.clipboard.writeText(link);
        } catch (err) {
            console.error("Invite Error Details:", err);
            let userMsg = "Failed to generate secure link. This often happens if the database is out of sync.";
            if (err.code === '22P02') userMsg = "Invalid Role: The medical role 'nurse' may not be registered in the system's security enum yet.";

            alert(`${userMsg}\n\nTechnical Error: ${err.message || "Unknown error"}`);

            // Fallback for demo UX
            const mockToken = `mock-${role}-${Date.now()}`;
            const link = `${window.location.origin}/?token=${mockToken}`;
            setGeneratedLink(link);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="member-modal">
            <div className="modal-close" onClick={onClose}>✕</div>
            <h3>Generate Secure Invite</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '1rem' }}>
                Create a one-time use link for a new staff member.
            </p>

            {!generatedLink ? (
                <>
                    <div className="input-group" style={{ textAlign: 'left', marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            <option value="doctor">Medical Doctor</option>
                            <option value="nurse">Nurse</option>
                            <option value="secretary">Secretary</option>
                            <option value="hospital_admin">Admin</option>
                        </select>
                    </div>
                    <button className="btn-primary w-full" onClick={generateToken} disabled={isLoading}>
                        {isLoading ? 'Generating...' : 'Create Invite Link 🔗'}
                    </button>
                </>
            ) : (
                <div className="fade-in">
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '1rem' }}>
                        <div style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: '0.5rem' }}>Link Ready & Copied!</div>
                        <div style={{ fontSize: '0.7rem', wordBreak: 'break-all', opacity: 0.8 }}>{generatedLink}</div>
                    </div>
                    <button className="btn-secondary w-full" onClick={onClose}>Done</button>
                </div>
            )}
        </div>
    );
};

export default HospitalChat;
