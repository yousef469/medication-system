import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Safety timeout to prevent permanent blank screen (e.g. if Supabase hangs)
        const safetyTimeout = setTimeout(() => {
            if (!isInitialized) {
                console.warn('Auth initialization timed out. Checking connectivity...');
                setIsInitialized(true);
            }
        }, 5000);

        // 1. Check active sessions and enforce persistence rules
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await fetchProfile(session.user);
                } else {
                    setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                    setIsInitialized(true);
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            }
        };

        initAuth();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                await fetchProfile(session.user);
            } else {
                setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            }
        });

        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (supabaseUser) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (data) {
                // Enforce Professional Session Rule
                const isProfessional = ['doctor', 'secretary', 'it', 'admin'].includes(data.role);
                const hasSessionFlag = sessionStorage.getItem(`medi_pro_session_${supabaseUser.id}`);

                if (isProfessional && !hasSessionFlag) {
                    // If professional but no session flag (browser restart), log out
                    await supabase.auth.signOut();
                    setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                    return;
                }

                setUser({
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: data.role || 'user',
                    name: data.name || supabaseUser.email.split('@')[0],
                    isAuthenticated: true
                });

                // Ensure flag is set if they are professional
                if (isProfessional) {
                    sessionStorage.setItem(`medi_pro_session_${supabaseUser.id}`, 'true');
                }
            } else {
                setUser({
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: 'user',
                    name: supabaseUser.email.split('@')[0],
                    isAuthenticated: true
                });
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setIsInitialized(true);
        }
    };

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;

        // Fetch profile to set the session flag immediately on login
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile && ['doctor', 'secretary', 'it', 'admin'].includes(profile.role)) {
            sessionStorage.setItem(`medi_pro_session_${data.user.id}`, 'true');
        }

        return data;
    };

    const logout = async () => {
        if (user?.id) {
            sessionStorage.removeItem(`medi_pro_session_${user.id}`);
        }
        await supabase.auth.signOut();
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
