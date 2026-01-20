import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../supabaseClient';

const ProfessionalSidebar = ({ activeTab, onTabChange }) => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [showSettings, setShowSettings] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        if (window.confirm('Terminate secure clinical session?')) {
            await logout();
        }
    };

    return (
        <>
            <button
                className="mobile-toggle"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 2000,
                    display: window.innerWidth > 1024 ? 'none' : 'flex',
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px'
                }}
            >
                {isOpen ? '✕' : '☰'}
            </button>

            <aside className={`prof-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="prof-brand">
                    <div className="prof-logo">M</div>
                    <span className="prof-title">MediSystem Pro</span>
                </div>

                <nav className="prof-nav">
                    <div
                        className={`prof-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => { onTabChange('dashboard'); setIsOpen(false); }}
                    >
                        <span className="icon">📊</span>
                        <span className="label">Dashboard</span>
                    </div>
                    <div
                        className={`prof-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                        onClick={() => { onTabChange('chat'); setIsOpen(false); }}
                    >
                        <span className="icon">💬</span>
                        <span className="label">Hospital Chat</span>
                    </div>
                    <div
                        className={`prof-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => { onTabChange('profile'); setIsOpen(false); }}
                    >
                        <span className="icon">👤</span>
                        <span className="label">My Profile</span>
                    </div>
                </nav>

                <div className="prof-footer">
                    <div className="prof-nav-item" onClick={() => setShowSettings(!showSettings)}>
                        <span className="icon">⚙️</span>
                        <span className="label">Settings</span>
                    </div>
                    <div className="prof-nav-item lang-selector">
                        <span className="icon">🌐</span>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="en">English</option>
                            <option value="ar">العربية (Arabic)</option>
                        </select>
                    </div>
                    <div className="prof-nav-item" onClick={toggleTheme}>
                        <span className="icon">{theme === 'light' ? '🌙' : '☀️'}</span>
                        <span className="label">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className="prof-nav-item logout" onClick={handleLogout}>
                        <span className="icon">🚪</span>
                        <span className="label">Sign Out</span>
                    </div>
                </div>

                {showSettings && (
                    <div className="prof-settings-modal glass-card">
                        <h3>System Settings</h3>
                        <div className="setting-row">
                            <span>Notifications</span>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div className="setting-row">
                            <span>Dark Mode</span>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <button className="btn-secondary btn-xs mt-1" onClick={() => setShowSettings(false)}>Close</button>
                    </div>
                )}

                <style>{`
                    .prof-sidebar {
                        width: 260px;
                        background: var(--bg-glass);
                        backdrop-filter: blur(20px);
                        border-right: 1px solid var(--glass-border);
                        display: flex;
                        flex-direction: column;
                        padding: 1.5rem;
                        height: 100vh;
                        position: sticky;
                        top: 0;
                        transition: transform 0.3s ease;
                        z-index: 1500;
                    }
                    
                    @media (max-width: 1024px) {
                        .prof-sidebar {
                            position: fixed;
                            transform: translateX(-100%);
                        }
                        .prof-sidebar.open {
                            transform: translateX(0);
                        }
                        .prof-title { font-size: 0.9rem; }
                    }

                    .prof-brand { display: flex; align-items: center; gap: 1rem; margin-bottom: 3rem; }
                    .prof-logo { width: 32px; height: 32px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: white; }
                    .prof-title { font-weight: 700; font-size: 1.1rem; letter-spacing: -0.02em; }
                    
                    .prof-nav { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
                    .prof-nav-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 0.8rem 1rem;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.2s;
                        color: var(--text-secondary);
                    }
                    .prof-nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
                    .prof-nav-item.active { background: var(--primary); color: white; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3); }
                    
                    .prof-footer { border-top: 1px solid var(--glass-border); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
                    .lang-selector select { background: transparent; border: none; color: inherit; font-size: 0.85rem; outline: none; width: 100%; cursor: pointer; }
                    .logout:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                    
                    .prof-settings-modal {
                        position: absolute;
                        bottom: 80px;
                        left: 20px;
                        right: 20px;
                        padding: 1.5rem;
                        z-index: 100;
                        border: 1px solid var(--primary-glow);
                    }
                    .setting-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 0.85rem; }
                    .mt-1 { margin-top: 1rem; }
                `}</style>
            </aside>
        </>
    );
};

export default ProfessionalSidebar;
