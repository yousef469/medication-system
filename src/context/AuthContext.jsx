import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // 1. Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                setUser({ role: 'user', name: 'Guest Patient' });
                setIsInitialized(true);
            }
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                setUser({ role: 'user', name: 'Guest Patient' });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (supabaseUser) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single();

            if (data) {
                setUser({
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: data.role || 'user',
                    name: data.name || supabaseUser.email.split('@')[0],
                    isAuthenticated: true
                });
            } else {
                // Fallback if profile doesn't exist yet
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
        return data;
    };

    const logout = async () => {
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
