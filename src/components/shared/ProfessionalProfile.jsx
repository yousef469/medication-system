import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useClinical } from '../../context/ClinicalContext';
import { supabase } from '../../supabaseClient';
import ClinicalSocialFeed from '../dashboards/ClinicalSocialFeed';

/**
 * ProfessionalProfile component renders a premium clinical identity.
 * @param {Object} profile - The profile data to display.
 * @param {boolean} isOwner - Whether the current user is the owner of this profile.
 * @param {boolean} showFeed - Whether to show the clinical research feed.
 */
const ProfessionalProfile = ({ profile, isOwner = false, showFeed = true }) => {
    const { user } = useAuth();
    const { requests } = useClinical();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Profile State
    const [name, setName] = useState(profile?.name || '');
    const [specialty, setSpecialty] = useState(profile?.specialty || '');
    const [bio, setBio] = useState(profile?.bio_story || '');
    const [experience, setExperience] = useState(profile?.experience || '0');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

    // Profile Stats (Fallbacks for real sync)
    const rating = profile?.professional_rating || '5.0';
    const reviews = profile?.review_count || '0';
    const surgeryCount = profile?.surgery_count || 0;

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setSpecialty(profile.specialty || '');
            setBio(profile.bio_story || '');
            setExperience(profile.experience || '0');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) throw new Error('Select an image.');
            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = data.publicUrl;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;
            setAvatarUrl(publicUrl);
            alert('Identity Avatar Synchronized!');
        } catch (err) {
            console.error('Upload failed:', err);
            if (err.message === 'Bucket not found') {
                alert('Storage Error: "avatars" bucket missing. Control center must create it.');
            } else {
                alert('Upload failed: Security protocol active.');
            }
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: name,
                    specialty: specialty,
                    bio_story: bio,
                    experience: experience
                })
                .eq('id', user.id);

            if (error) throw error;
            setIsEditing(false);
            alert('Live Profile Synchronized!');
        } catch (err) {
            console.error('Update failed:', err);
            alert('Synchronization failed. Check secure connection.');
        } finally {
            setIsSaving(false);
        }
    };

    // Filter cases if user is viewing their OWN profile
    const myCases = requests.filter(r => r.assigned_doctor_id === profile?.id && r.status === 'ROUTED_TO_DOCTOR');

    return (
        <div className="unified-profile-engine fade-in">
            <header className="glass-card profile-banner">
                <div className="banner-visual">
                    {profile?.verification_status === 'APPROVED' && <div className="rank-badge">Clinical Silver-Rank</div>}
                </div>

                <div className="identity-sync-layer">
                    <div className="avatar-orb">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={name} className="unified-avatar" />
                        ) : (
                            <span className="unified-initial">{name?.charAt(0)}</span>
                        )}
                        {isOwner && (
                            <label className="orb-edit-label">
                                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} hidden />
                                <span>{uploading ? '...' : '📸'}</span>
                            </label>
                        )}
                    </div>

                    <div className="identity-text">
                        <div className="name-row">
                            <h1 className="text-gradient dynamic-title">{profile?.role === 'doctor' ? `Dr. ${name}` : name}</h1>
                            {isOwner && (
                                <button className="btn-secondary btn-xs" onClick={() => setIsEditing(true)}>Edit Clinical Identity</button>
                            )}
                        </div>
                        <p className="specialty-subtext">{specialty || (profile?.role === 'secretary' ? 'Head Clinical Operations' : profile?.role)} • {experience} Years Rank</p>
                        <p className="clinical-bio">{bio || 'Accessing encrypted profile data...'}</p>
                    </div>

                    <div className="identity-stats-grid">
                        <div className="stat-node">
                            <span className="node-value">⭐ {rating}</span>
                            <span className="node-label">{reviews} Reviews</span>
                        </div>
                        <div className="stat-node">
                            <span className="node-value">{profile?.followers || 0}</span>
                            <span className="node-label">Network</span>
                        </div>
                        <div className="stat-node">
                            <span className="node-value">{surgeryCount}</span>
                            <span className="node-label">Ops</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="profile-body-layout">
                <main className="profile-feed-column">
                    {showFeed && (
                        <>
                            <h3 className="section-header-styled">Clinical Research & System Activity</h3>
                            <ClinicalSocialFeed />
                        </>
                    )}
                </main>

                <aside className="profile-details-column">
                    {profile?.role === 'doctor' && isOwner && (
                        <div className="glass-card detail-card">
                            <h4>Active Routed Cases</h4>
                            <div className="mini-case-list">
                                {myCases.length === 0 ? (
                                    <p className="empty-hint">No patients currently routed to your terminal.</p>
                                ) : (
                                    myCases.map(c => (
                                        <div key={c.id} className="mini-case-item">
                                            <div className="case-top">
                                                <strong>{c.patient_name}</strong>
                                                <span className={`urgency-dot ${c.urgency.toLowerCase()}`}></span>
                                            </div>
                                            <p>{c.diagnosis}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="glass-card detail-card mt-1">
                        <h4>Clinical Clearances</h4>
                        <div className="clearance-tags">
                            <span className="c-tag">Digital Health Certified</span>
                            <span className="c-tag">Cross-Hospital Protocol</span>
                            <span className="c-tag">Operations Rank 3</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Editing Logic (Only for Owners) */}
            {isEditing && isOwner && (
                <div className="glass-card modal-overlay-v2">
                    <div className="modal-inner">
                        <div className="modal-top">
                            <h3>Sync Clinical Identity</h3>
                            <button className="btn-icon" onClick={() => setIsEditing(false)}>✕</button>
                        </div>
                        <div className="sync-fields">
                            <div className="field-block">
                                <label>Registry Name</label>
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="field-block">
                                <label>Clinical Specialty</label>
                                <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                            </div>
                            <div className="field-block">
                                <label>Years of Rank</label>
                                <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} />
                            </div>
                            <div className="field-block">
                                <label>Personal Medical Bio</label>
                                <textarea value={bio} onChange={(e) => setBio(e.target.value)}></textarea>
                            </div>
                            <button className="btn-primary w-full" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Syncing...' : 'Confirm Identity Sync'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .unified-profile-engine { display: flex; flex-direction: column; gap: 2rem; }
                .profile-banner { padding: 0; border-radius: 24px; overflow: hidden; position: relative; }
                .banner-visual { height: 220px; background: linear-gradient(135deg, var(--bg-surface), var(--primary)); opacity: 0.8; }
                .rank-badge { position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.75rem; font-weight: 800; }
                
                .identity-sync-layer { display: grid; grid-template-columns: 180px 1fr 300px; gap: 2.5rem; padding: 0 2.5rem 2.5rem; margin-top: -60px; align-items: flex-end; }
                
                .avatar-orb { width: 160px; height: 160px; border-radius: 50%; background: var(--bg-surface); border: 6px solid var(--bg-app); box-shadow: 0 10px 40px rgba(0,0,0,0.4); position: relative; overflow: hidden; z-index: 5; display: flex; align-items: center; justify-content: center; }
                .unified-avatar { width: 100%; height: 100%; object-fit: cover; }
                .unified-initial { font-size: 4rem; font-weight: 800; opacity: 0.2; }
                .orb-edit-label { position: absolute; bottom: 0; left: 0; right: 0; height: 35%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: 0.3s; }
                .avatar-orb:hover .orb-edit-label { opacity: 1; }
                
                .identity-text { padding-bottom: 0.5rem; }
                .name-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.5rem; }
                .dynamic-title { 
                    font-size: 2.8rem; 
                    padding: 0.2rem 0;
                    margin-bottom: 0.5rem;
                    line-height: 1.1; 
                    overflow: visible;
                    display: inline-block;
                }
                .specialty-subtext { color: var(--accent); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.85rem; margin-bottom: 1rem; }
                .clinical-bio { font-size: 1rem; color: var(--text-secondary); line-height: 1.6; max-width: 650px; opacity: 0.8; }
                
                .identity-stats-grid { background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 20px; padding: 1.5rem; display: flex; justify-content: space-around; backdrop-filter: blur(10px); }
                .stat-node { text-align: center; }
                .node-value { display: block; font-size: 1.4rem; font-weight: 900; color: white; }
                .node-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-top: 0.2rem; }
                
                .profile-body-layout { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; }
                .section-header-styled { font-size: 1.25rem; opacity: 0.8; margin-bottom: 1.5rem; }
                .detail-card { padding: 1.5rem; }
                .detail-card h4 { font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.1em; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; }
                
                .mini-case-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .mini-case-item { padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 12px; border-left: 3px solid var(--primary); }
                .case-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
                .urgency-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--secondary); }
                .urgency-dot.immediate { background: #ef4444; }
                .mini-case-item p { font-size: 0.8rem; opacity: 0.6; }
                
                .clearance-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
                .c-tag { font-size: 0.7rem; color: var(--text-secondary); background: rgba(124, 58, 237, 0.1); padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid rgba(124, 58, 237, 0.2); }
                
                .modal-overlay-v2 { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2000; width: 480px; padding: 2.5rem; box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
                .modal-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .sync-fields { display: flex; flex-direction: column; gap: 1.25rem; }
                .field-block label { display: block; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; }
                .field-block input, .field-block textarea { width: 100%; background: var(--bg-app); border: 1px solid var(--glass-border); padding: 0.8rem; color: white; border-radius: 10px; outline: none; }
                .field-block textarea { height: 100px; resize: none; }
                .btn-icon { background: transparent; border: none; color: white; font-size: 1.2rem; cursor: pointer; opacity: 0.5; }
                .btn-icon:hover { opacity: 1; }
                .empty-hint { font-size: 0.85rem; opacity: 0.4; font-style: italic; }
            `}</style>
        </div>
    );
};

export default ProfessionalProfile;
