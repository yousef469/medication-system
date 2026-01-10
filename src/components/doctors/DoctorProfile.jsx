import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClinical } from '../../context/ClinicalContext';

const DoctorProfile = ({ doctor }) => {
    const { user } = useAuth();
    const { requests } = useClinical();

    // Filter cases routed specifically to this doctor
    const myCases = requests.filter(r => r.status === 'ROUTED_TO_DOCTOR' && r.assignedDoctorId === 'doc-1'); // Mocking doc-1 for Demo
    const { name, specialty, bio, followers, rating, surgeryCount, posts } = doctor;

    return (
        <div className="doctor-profile-system">
            <header className="glass-card profile-header">
                <div className="profile-cover"></div>
                <div className="profile-info-grid">
                    <div className="profile-avatar-large"></div>
                    <div className="profile-text">
                        <h1 className="text-gradient">Dr. {name}</h1>
                        <p className="specialty-tag">{specialty}</p>
                        <p className="bio-text">{bio}</p>
                    </div>
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{followers}</span>
                            <span className="stat-label">Followers</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{rating}</span>
                            <span className="stat-label">Rating</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{surgeryCount}</span>
                            <span className="stat-label">Surgeries</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="profile-content-grid">
                <aside className="profile-sidebar">
                    <div className="glass-card sidebar-card active-cases">
                        <h3>Routed Clinical Cases</h3>
                        <p className="card-subtitle">AI-Triaged patients assigned by Coordination Hub</p>
                        <div className="case-list">
                            {myCases.length === 0 ? (
                                <p className="empty-state">No active clinical cases.</p>
                            ) : (
                                myCases.map(c => (
                                    <div key={c.id} className={`case-item ${c.urgency.toLowerCase().replace(' ', '')}`}>
                                        <div className="case-header">
                                            <span className="case-patient">{c.patient}</span>
                                            <span className="case-tier">{c.urgency}</span>
                                        </div>
                                        <p className="case-diagnosis">{c.diagnosis}</p>
                                        <button className="btn-primary btn-xs mt-05">Open Medical Record</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-card sidebar-card mt-2">
                        <h3>Specializations</h3>
                        <div className="tag-cloud">
                            <span className="skill-tag">Neuro-Robotics</span>
                            <span className="skill-tag">Deep Brain Stimulation</span>
                            <span className="skill-tag">AI Pathology</span>
                        </div>
                    </div>
                </aside>

                <section className="profile-feed">
                    <div className="glass-card feed-composer">
                        <div className="composer-row">
                            <div className="avatar-small"></div>
                            <input type="text" placeholder={`What's on your mind, Dr. ${name}?`} />
                        </div>
                    </div>

                    <div className="posts-container">
                        {posts.map((post, idx) => (
                            <div key={idx} className="glass-card post-card">
                                <div className="post-header">
                                    <div className="avatar-small"></div>
                                    <div className="post-meta">
                                        <span className="post-author">Dr. {name}</span>
                                        <span className="post-date">{post.date}</span>
                                    </div>
                                </div>
                                <div className="post-content">
                                    <p>{post.content}</p>
                                    {post.image && <div className="post-image-placeholder"></div>}
                                </div>
                                <div className="post-actions">
                                    <button className="action-btn">❤️ {post.likes}</button>
                                    <button className="action-btn">💬 Comment</button>
                                    <button className="action-btn">🔗 Share</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <style jsx>{`
        .doctor-profile-system { display: flex; flex-direction: column; gap: 2rem; }
        .profile-header { padding: 0; overflow: hidden; border-radius: var(--radius-lg); }
        .profile-cover { height: 240px; background: linear-gradient(to right, #1e293b, var(--primary)); position: relative; }
        
        .profile-info-grid { 
          display: grid; 
          grid-template-columns: 180px 1fr 340px; 
          gap: 2rem; 
          padding: 0 2rem 2rem; 
          margin-top: -60px;
          align-items: flex-end;
        }

        .profile-avatar-large { 
          width: 160px; 
          height: 160px; 
          border-radius: 50%; 
          background: #475569; 
          border: 6px solid #000212;
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
          z-index: 10;
        }

        .profile-text h1 { font-size: 2rem; margin-bottom: 0.25rem; }
        .specialty-tag { color: var(--primary); font-weight: 700; font-size: 0.9rem; margin-bottom: 0.75rem; }
        .bio-text { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.5; max-width: 600px; }

        .profile-stats { display: flex; justify-content: space-around; background: var(--glass-highlight); padding: 1.5rem; border-radius: var(--radius-md); }
        .stat-item { text-align: center; }
        .stat-value { display: block; font-size: 1.25rem; font-weight: 800; color: white; }
        .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }

        .profile-content-grid { display: grid; grid-template-columns: 340px 1fr; gap: 2rem; }
        .sidebar-card { padding: 1.5rem; }
        .card-subtitle { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1.25rem; }

        .case-list { display: flex; flex-direction: column; gap: 1rem; }
        .case-item { padding: 1rem; background: var(--glass-highlight); border-radius: var(--radius-md); border-left: 3px solid var(--primary); }
        .case-item.immediate { border-left-color: #ef4444; }
        .case-item.nexthour { border-left-color: var(--accent); }
        
        .case-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .case-patient { font-weight: 700; font-size: 0.9rem; }
        .case-tier { font-size: 0.65rem; font-weight: 800; color: var(--primary); }
        .case-diagnosis { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }

        .tag-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .skill-tag { font-size: 0.75rem; background: var(--glass-highlight); padding: 0.3rem 0.75rem; border-radius: var(--radius-full); border: 1px solid var(--glass-border); }

        .feed-composer { padding: 1.5rem; margin-bottom: 1.5rem; }
        .composer-row { display: flex; gap: 1rem; align-items: center; }
        .composer-row input { flex: 1; background: var(--glass-highlight); border: none; padding: 0.75rem 1.25rem; border-radius: var(--radius-full); color: white; outline: none; }

        .post-card { padding: 1.5rem; margin-bottom: 1.5rem; }
        .post-header { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
        .post-author { display: block; font-weight: 700; }
        .post-date { font-size: 0.75rem; color: var(--text-muted); }
        .post-content { color: var(--text-secondary); line-height: 1.6; }
        .post-image-placeholder { height: 300px; background: #1e293b; border-radius: var(--radius-md); margin-top: 1rem; }
        
        .post-actions { display: flex; gap: 1rem; margin-top: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem; }
        .action-btn { background: transparent; border: none; color: var(--text-secondary); font-size: 0.875rem; cursor: pointer; }
        .action-btn:hover { color: white; }

        .avatar-small { width: 40px; height: 40px; border-radius: 50%; background: #475569; }
        .btn-xs { font-size: 0.7rem; padding: 0.2rem 0.6rem; }
        .mt-05 { margin-top: 0.5rem; }
        .mt-2 { margin-top: 2rem; }
        .empty-state { text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem; font-style: italic; }
      `}</style>
        </div>
    );
};

export default DoctorProfile;
