import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/useAuth';

const ClinicalSocialFeed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPosts();

        // Subscription for real-time updates
        const subscription = supabase
            .channel('public:posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setPosts(data);
    };

    const handlePost = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    user_name: user.name,
                    user_role: user.role,
                    content: content,
                    category: category
                });

            if (error) throw error;
            setContent('');
        } catch (err) {
            console.error('Post failed:', err);
            alert('Security Error: Post could not be transmitted to the feed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="clinical-feed-container">
            <div className="glass-card feed-composer-v2">
                <textarea
                    placeholder="Share clinical research, findings, or system updates..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="composer-actions">
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="GENERAL">General Update</option>
                        <option value="RESEARCH">Research Finding</option>
                        <option value="CLINICAL_UPDATE">Clinical Case Study</option>
                        <option value="ANNOUNCEMENT">Official Announcement</option>
                    </select>
                    <button className="btn-primary btn-xs" onClick={handlePost} disabled={loading || !content.trim()}>
                        {loading ? 'Transmitting...' : 'Post to Clinical Network'}
                    </button>
                </div>
            </div>

            <div className="posts-list">
                {posts.map(post => (
                    <div key={post.id} className={`glass-card post-item-v2 ${post.category?.toLowerCase()}`}>
                        <div className="post-header-v2">
                            <div className="post-meta-v2">
                                <span className="auth-name">{post.user_name}</span>
                                <span className="auth-role">{post.user_role}</span>
                                <span className="post-time">{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="category-tag-v2">{post.category}</span>
                        </div>
                        <div className="post-body-v2">
                            {post.content}
                        </div>
                        <div className="post-footer-v2">
                            <button className="post-action-btn">❤️ {post.likes || 0}</button>
                            <button className="post-action-btn">💬 Comment</button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .clinical-feed-container { display: flex; flex-direction: column; gap: 2rem; max-width: 800px; margin: 0 auto; width: 100%; }
                .feed-composer-v2 { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
                .feed-composer-v2 textarea { 
                    width: 100%; height: 100px; background: rgba(255,255,255,0.05); 
                    border: 1px solid var(--glass-border); border-radius: 12px; padding: 1rem; 
                    color: var(--text-primary); outline: none; resize: none; font-size: 0.95rem;
                }
                .composer-actions { display: flex; justify-content: space-between; align-items: center; }
                .composer-actions select { 
                    background: var(--bg-surface); border: 1px solid var(--glass-border); 
                    color: var(--text-secondary); border-radius: 8px; padding: 0.4rem; font-size: 0.8rem;
                }

                .post-item-v2 { padding: 1.5rem; border-left: 4px solid var(--primary); }
                .post-item-v2.research { border-left-color: var(--accent); }
                .post-item-v2.announcement { border-left-color: var(--secondary); }

                .post-header-v2 { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
                .post-meta-v2 { display: flex; flex-direction: column; }
                .auth-name { font-weight: 700; color: var(--text-primary); }
                .auth-role { font-size: 0.75rem; color: var(--primary); text-transform: uppercase; font-weight: 800; }
                .post-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem; }
                .category-tag-v2 { font-size: 0.65rem; padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.05); color: var(--text-secondary); font-weight: 800; }

                .post-body-v2 { color: var(--text-secondary); line-height: 1.6; font-size: 1rem; white-space: pre-wrap; }
                .post-footer-v2 { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); display: flex; gap: 1.5rem; }
                .post-action-btn { background: transparent; border: none; color: var(--text-muted); font-size: 0.85rem; cursor: pointer; transition: color 0.2s; }
                .post-action-btn:hover { color: var(--text-primary); }
            `}</style>
        </div>
    );
};

export default ClinicalSocialFeed;
