import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
            {theme === 'light' ? '🌙' : '☀️'}
            <style>{`
                .theme-toggle {
                    background: var(--glass-highlight);
                    border: 1px solid var(--glass-border);
                    color: var(--text-primary);
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                }
                .theme-toggle:hover {
                    background: var(--primary);
                    color: white;
                    transform: rotate(15deg);
                }
            `}</style>
        </button>
    );
};

export default ThemeToggle;
