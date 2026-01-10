import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize auth state - Normal User is persistent, others require login per session
    useEffect(() => {
        const savedUser = sessionStorage.getItem('medi_auth_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            // Only keep professional roles if they were logged in during this session
            setUser(parsedUser);
        } else {
            // Default to unauthenticated Normal User if no session exists
            setUser({ role: 'user', name: 'Guest Patient' });
        }
        setIsInitialized(true);
    }, []);

    const login = (role, name, password) => {
        // Basic mock authentication
        if (name && password) {
            const newUser = { role, name, isAuthenticated: true };
            setUser(newUser);
            sessionStorage.setItem('medi_auth_user', JSON.stringify(newUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser({ role: 'user', name: 'Guest Patient' });
        sessionStorage.removeItem('medi_auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isInitialized }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
