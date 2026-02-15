import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import ProfessionalProfile from './ProfessionalProfile';

/**
 * ProfessionalProfileModal - Universal staff discovery overlay.
 * @param {string} userId - The UUID of the staff member to fetch.
 * @param {Object} initialProfile - Pre-loaded profile data (optional).
 * @param {function} onClose - Function to close the modal.
 */
const ProfessionalProfileModal = ({ userId, initialProfile = null, onClose }) => {
    const [profile, setProfile] = useState(initialProfile);
    const [loading, setLoading] = useState(!initialProfile);

    useEffect(() => {
        if (!initialProfile && userId) {
            fetchProfile();
        }
    }, [userId, initialProfile, fetchProfile]);

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            setProfile(data);
        } catch (err) {
            console.error('[Discovery] Failed to fetch staff identity:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    return (
        <div className="discovery-overlay" onClick={onClose}>
            <div className="discovery-modal-container glass-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-icon" onClick={onClose}>✕</button>

                {loading ? (
                    <div className="discovery-loading">
                        <div className="pulse-orb"></div>
                        <p>Accessing Clinical Registry...</p>
                    </div>
                ) : profile ? (
                    <div className="discovery-content">
                        {/* We use ProfessionalProfile in non-owner mode (isOwner=false) */}
                        <ProfessionalProfile profile={profile} isOwner={false} showFeed={true} />
                    </div>
                ) : (
                    <div className="discovery-error">
                        <p>Identity could not be retrieved. Security restriction active.</p>
                        <button className="btn-secondary" onClick={onClose}>Close</button>
                    </div>
                )}
            </div>

            <style>{`
                .discovery-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 2, 18, 0.85);
                    backdrop-filter: blur(12px);
                    z-index: 5000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    animation: fadeIn 0.3s ease;
                }
                
                .discovery-modal-container {
                    width: 100%;
                    max-width: 1000px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    padding: 1.5rem;
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 40px 100px rgba(0,0,0,0.8);
                    animation: slideUpModal 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .modal-close-icon {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    z-index: 6000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .modal-close-icon:hover { background: #ef4444; border-color: #ef4444; transform: rotate(90deg); }

                .discovery-loading { height: 400px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; }
                .pulse-orb { width: 60px; height: 60px; border-radius: 50%; background: var(--primary); animation: pulseScale 1.5s infinite; }
                
                @keyframes pulseScale {
                    0% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
                    70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 20px rgba(124, 58, 237, 0); }
                    100% { transform: scale(0.8); opacity: 0.5; box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
                }

                @keyframes slideUpModal {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ProfessionalProfileModal;
