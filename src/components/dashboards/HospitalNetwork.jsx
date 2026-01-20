import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import DoctorProfile from '../doctors/DoctorProfile';
import { useClinical } from '../../context/ClinicalContext';

const HospitalNetwork = () => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const { doctors } = useClinical();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, emergency, announcements
    const [selectedDoctor, setSelectedDoctor] = useState(null);

    useEffect(() => {
        fetchPosts();

        // Real-time subscription
        const channel = supabase
            .channel('public:posts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
                setPosts(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
          *,
          comments (count)
        `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim() || !user) return;

        try {
            const { error } = await supabase
                .from('posts')
                .insert([{
                    user_id: user.id || 'anonymous', // Handle offline/guest in real app differently
                    user_name: user.name || 'Dr. Guest',
                    user_role: user.role || 'Doctor',
                    content: newPost,
                    hospital_name: 'St. Mary Setup', // Can be dynamic
                    category: activeTab === 'all' ? 'general' : activeTab
                }]);

            if (error) throw error;
            setNewPost('');
        } catch (err) {
            alert("Failed to post: " + err.message);
        }
    };

    const handleLike = async (postId, currentLikes) => {
        try {
            await supabase
                .from('posts')
                .update({ likes: currentLikes + 1 })
                .eq('id', postId);

            // Optimistic update
            setPosts(prev => prev.map(p =>
                p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
            ));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className={`network-container ${isRTL ? 'rtl' : 'ltr'}`}>
            <div className="network-header">
                <div className="header-titles">
                    <h2>🏥 {t('hospital_network') || "The Network"}</h2>
                    <p>{t('connect_msg') || "Connect with doctors across all facilities."}</p>
                </div>
                <div className="network-tabs">
                    <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
                    <button className={`tab-btn ${activeTab === 'emergency' ? 'active' : ''}`} onClick={() => setActiveTab('emergency')}>🚨 Emergencies</button>
                    <button className={`tab-btn ${activeTab === 'announcement' ? 'active' : ''}`} onClick={() => setActiveTab('announcement')}>📢 Announcements</button>
                </div>
            </div>

            <div className="network-feed">
                {/* Create Post Area */}
                <div className="create-post-card glass-card">
                    <div className="cp-header">
                        <div className="avatar">{user?.name?.charAt(0) || 'D'}</div>
                        <textarea
                            placeholder={t('whats_happening') || "Share an update, case, or alert..."}
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                        />
                    </div>
                    <div className="cp-actions">
                        <span className="posting-as">Posting as <strong>{user?.name}</strong></span>
                        <button className="post-btn" onClick={handlePost} disabled={!newPost.trim()}>Post</button>
                    </div>
                </div>

                {/* Feed */}
                {selectedDoctor ? (
                    <div className="profile-overlay fade-in">
                        <button className="btn-back" onClick={() => setSelectedDoctor(null)}>← Back to Feed</button>
                        <DoctorProfile doctor={selectedDoctor} />
                    </div>
                ) : loading ? (
                    <div className="loading-spinner">Loading network...</div>
                ) : (
                    <div className="posts-list">
                        {posts
                            .filter(p => activeTab === 'all' || p.category === activeTab)
                            .map(post => {
                                const docData = doctors.find(d => d.id === post.user_id);
                                return (
                                    <div key={post.id} className="post-card glass-card fade-in">
                                        <div className="post-header">
                                            <div className="author-info">
                                                <div className="avatar-small">{post.user_name?.charAt(0)}</div>
                                                <div className="author-text">
                                                    <span className="author-name" onClick={() => docData && setSelectedDoctor(docData)}>
                                                        {post.user_name}
                                                    </span>
                                                    <span className={`role-badge ${post.user_role?.toLowerCase()}`}>{post.user_role}</span>
                                                    {docData && <span className="specialty-mini">{docData.specialty}</span>}
                                                </div>
                                                <span className="hospital-tag">@{post.hospital_name || 'Hospital'}</span>
                                            </div>
                                            <span className="time-ago">{new Date(post.created_at).toLocaleTimeString()}</span>
                                        </div>

                                        <div className="post-content">
                                            {post.content}
                                        </div>

                                        <div className="post-footer">
                                            <button className="action-btn" onClick={() => handleLike(post.id, post.likes)}>
                                                ❤️ {post.likes || 0}
                                            </button>
                                            <button className="action-btn">
                                                💬 {post.comments?.count || 0} Comments
                                            </button>
                                            {post.category === 'emergency' && <span className="urgent-badge">URGENT</span>}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            <style>{`
        .network-container {
            max-width: 800px;
            margin: 0 auto;
            padding-bottom: 4rem;
        }
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }

        .network-header {
            margin-bottom: 2rem;
            text-align: center;
        }
        .header-titles h2 { font-size: 2rem; margin-bottom: 0.5rem; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-titles p { color: var(--text-muted); }
        
        .network-tabs {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        .tab-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--glass-border);
            color: var(--text-secondary);
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .tab-btn.active, .tab-btn:hover {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .create-post-card {
            padding: 1.5rem;
            margin-bottom: 2rem;
            background: rgba(30, 41, 59, 0.7);
        }
        .cp-header {
            display: flex;
            gap: 1rem;
        }
        .avatar {
            width: 40px; height: 40px;
            background: var(--primary);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; color: white;
        }
        textarea {
            flex: 1;
            background: transparent;
            border: none;
            color: white;
            resize: none;
            min-height: 60px;
            font-family: inherit;
            font-size: 1rem;
        }
        textarea:focus { outline: none; }
        .cp-actions {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 1rem;
            margin-top: 1rem;
            border-top: 1px solid var(--glass-border);
            padding-top: 1rem;
        }
        .posting-as { font-size: 0.8rem; color: var(--text-muted); }
        .post-btn {
            background: var(--accent);
            color: white;
            border: none;
            padding: 0.5rem 1.5rem;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }
        .post-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .posts-list { display: flex; flex-direction: column; gap: 1rem; }
        .post-card { padding: 1.5rem; border-left: 3px solid var(--glass-border); }
        .post-card:hover { border-left-color: var(--primary); background: rgba(30, 41, 59, 0.9); }

        .profile-overlay {
            position: relative;
            z-index: 100;
            background: var(--bg-dark);
            min-height: 500px;
        }
        .btn-back {
            background: var(--glass-highlight);
            color: white;
            border: 1px solid var(--glass-border);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 2rem;
            font-weight: 600;
        }
        
        .author-text { display: flex; flex-direction: column; line-height: 1.2; }
        .author-name { cursor: pointer; font-weight: 700; color: white; }
        .author-name:hover { text-decoration: underline; color: var(--primary); }
        .specialty-mini { font-size: 0.65rem; color: var(--accent); font-weight: 700; text-transform: uppercase; }

        .post-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.75rem;
        }
        .author-info { display: flex; align-items: center; gap: 1rem; }
        .avatar-small { width: 32px; height: 32px; background: var(--glass-highlight); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; border: 1px solid var(--glass-border); }
        .role-badge { 
            font-size: 0.6rem; padding: 1px 4px; border-radius: 4px; text-transform: uppercase; width: fit-content;
        }
        .role-badge.doctor { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .role-badge.admin { background: rgba(244, 63, 94, 0.2); color: #f43f5e; }
        .role-badge.coordinator { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        
        .hospital-tag { color: var(--text-muted); font-size: 0.8rem; }
        .time-ago { color: var(--text-muted); font-size: 0.8rem; }

        .post-content { color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem; white-space: pre-wrap; }

        .post-footer { display: flex; gap: 1rem; }
        .action-btn {
            background: transparent;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 0.9rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(255,255,255,0.05); color: white; }
        .urgent-badge {
            margin-left: auto;
            background: #ef4444; color: white;
            font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: bold;
        }
      `}</style>
        </div>
    );
};

export default HospitalNetwork;
