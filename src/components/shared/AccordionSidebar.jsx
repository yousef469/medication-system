import React, { useState } from 'react';

const AccordionSidebar = ({
    menuGroups = [],
    topNavItems = [],
    bottomNavItems = [],
    activeTab,
    onTabChange,
    userRole = 'Staff',
    hospitalName = 'Hospital'
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (groupTitle) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupTitle]: !prev[groupTitle]
        }));
    };

    const handleTabClick = (id) => {
        if (onTabChange) onTabChange(id);
    };

    return (
        <div className={`sidebar-container ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <style>{`
                .sidebar-container {
                    width: 280px;
                    height: 100vh;
                    background: #0f172a; /* Slate 900 */
                    color: white;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid #1e293b;
                    transition: width 0.3s ease;
                    flex-shrink: 0;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .sidebar-container.collapsed {
                    width: 70px;
                }
                
                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #1e293b;
                    display: flex;
                    align-items: center;
                    justify-content: ${isSidebarCollapsed ? 'center' : 'space-between'};
                    height: 70px;
                }
                
                .logo-area {
                    display: ${isSidebarCollapsed ? 'none' : 'block'};
                }
                
                .toggle-btn {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                }
                .toggle-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }

                .nav-section {
                    padding: 0.5rem;
                }
                
                .nav-item {
                    display: flex;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    border-radius: 8px;
                    color: #cbd5e1;
                    transition: all 0.2s;
                    margin-bottom: 0.2rem;
                    text-decoration: none;
                }
                .nav-item:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .nav-item.active {
                    background: #0ea5e9;
                    color: white;
                    font-weight: 600;
                }
                
                .nav-icon {
                    font-size: 1.2rem;
                    margin-right: ${isSidebarCollapsed ? '0' : '0.8rem'};
                    width: 24px;
                    text-align: center;
                    display: flex;
                    justify-content: center;
                }
                
                .nav-label {
                    display: ${isSidebarCollapsed ? 'none' : 'block'};
                    white-space: nowrap;
                    flex: 1;
                }

                .sidebar-divider {
                    height: 1px;
                    background: #1e293b;
                    margin: 0.5rem 1rem;
                }

                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem 0;
                }
                
                /* Scrollbar styling */
                .sidebar-content::-webkit-scrollbar { width: 4px; }
                .sidebar-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

                .menu-group {
                    margin-bottom: 0.5rem;
                }
                
                .group-header {
                    padding: 0.8rem 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: ${isSidebarCollapsed ? 'center' : 'space-between'};
                    cursor: pointer;
                    color: #94a3b8;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    transition: color 0.2s;
                    user-select: none;
                }
                .group-header:hover {
                    color: white;
                }
                
                .group-title-text {
                    display: ${isSidebarCollapsed ? 'none' : 'block'};
                }
                
                .group-arrow {
                    transition: transform 0.3s;
                    font-size: 0.7rem;
                    display: ${isSidebarCollapsed ? 'none' : 'block'};
                }
                .group-arrow.rotated {
                    transform: rotate(180deg);
                }

                .sub-menu {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                    background: rgba(0,0,0,0.2);
                }
                .sub-menu.expanded {
                    max-height: 1000px;
                    transition: max-height 0.5s ease-in;
                }
                
                .menu-item {
                    padding: 0.7rem 1.5rem 0.7rem 3.5rem;
                    display: flex;
                    align-items: center;
                    color: #cbd5e1;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                    border-left: 3px solid transparent;
                }
                .menu-item:hover {
                    background: rgba(255,255,255,0.05);
                    color: white;
                }
                .menu-item.active {
                    color: #38bdf8;
                    border-left-color: #38bdf8;
                    background: rgba(56, 189, 248, 0.1);
                }
                
                .collapsed .menu-item {
                    padding: 0.7rem 0;
                    justify-content: center;
                }
                .collapsed .menu-text {
                    display: none;
                }
                .collapsed .menu-icon {
                    margin-right: 0;
                }

                .sidebar-footer {
                    padding: 0.5rem;
                    border-top: 1px solid #1e293b;
                    background: #0f172a;
                }
            `}</style>

            <div className="sidebar-header">
                <div className="logo-area">
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>{hospitalName}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>{userRole} Portal</div>
                </div>
                <button className="toggle-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
                    {isSidebarCollapsed ? '☰' : '◀'}
                </button>
            </div>

            {/* Top Navigation (Fixed) */}
            <div className="nav-section">
                {topNavItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeTab === item.id || item.active ? 'active' : ''}`}
                        onClick={() => item.onClick ? item.onClick() : handleTabClick(item.id)}
                        title={isSidebarCollapsed ? item.label : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </div>
                ))}
            </div>

            <div className="sidebar-divider"></div>

            {/* Scrollable Middle Section */}
            <div className="sidebar-content">
                {menuGroups.map((group, idx) => {
                    const isExpanded = isSidebarCollapsed ? false : (expandedGroups[group.title] !== false);

                    return (
                        <div key={idx} className="menu-group">
                            <div
                                className="group-header"
                                onClick={() => !isSidebarCollapsed && toggleGroup(group.title)}
                                title={isSidebarCollapsed ? group.title : ''}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="nav-icon" style={{ fontSize: '1rem', width: '20px', marginRight: isSidebarCollapsed ? 0 : '0.8rem' }}>{group.icon}</span>
                                    <span className="group-title-text">{group.title}</span>
                                </div>
                                <span className={`group-arrow ${isExpanded ? 'rotated' : ''}`}>▼</span>
                            </div>

                            <div className={`sub-menu ${isExpanded && !isSidebarCollapsed ? 'expanded' : ''}`}>
                                {group.items.map(item => (
                                    <div
                                        key={item.id}
                                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                                        onClick={() => handleTabClick(item.id)}
                                        title={isSidebarCollapsed ? item.label : ''}
                                    >
                                        <span className="menu-icon" style={{ marginRight: '0.5rem', opacity: 0.7 }}>{item.icon}</span>
                                        <span className="menu-text">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="sidebar-divider"></div>

            {/* Bottom Navigation (Fixed) */}
            <div className="sidebar-footer">
                {bottomNavItems.map(item => (
                    <div
                        key={item.id}
                        className="nav-item"
                        onClick={() => item.onClick ? item.onClick() : handleTabClick(item.id)}
                        style={{ color: '#ef4444' }} // Red for logout usually
                        title={isSidebarCollapsed ? item.label : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccordionSidebar;
