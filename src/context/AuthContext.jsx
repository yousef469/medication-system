/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const fetchProfile = useCallback(async (authUser) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error('[Auth] Profile fetch error:', error);
                setUser({ ...authUser, role: 'user', name: authUser.email, isAuthenticated: true });
            } else {
                setUser({ ...authUser, ...data, isAuthenticated: true });
            }
        } catch (error) {
            console.error('[Auth] profile fetch exception:', error);
            setUser({ ...authUser, role: 'user', name: authUser.email, isAuthenticated: true });
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const safetyTimer = setTimeout(() => {
                if (!isInitialized) {
                    console.warn('[Auth] Initialization safety timeout hit.');
                    setIsInitialized(true);
                }
            }, 5000);

            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    await fetchProfile(session.user);
                } else {
                    setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                    setIsInitialized(true);
                }
            } catch (error) {
                console.error('[Auth] Hard initialization failure:', error);
                setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            } finally {
                clearTimeout(safetyTimer);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            } else if (session) {
                await fetchProfile(session.user);
            } else {
                setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            }
        });

        initAuth();
        return () => subscription.unsubscribe();
    }, [fetchProfile, isInitialized]);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
    };

    const refreshUser = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await fetchProfile(session.user);
        }
    }, [fetchProfile]);

    const value = useMemo(() => ({
        user,
        login,
        logout,
        isInitialized,
        refreshUser,
        isLocked,
        setIsLocked,
        lockSession: () => setIsLocked(true),
        unlockSession: () => setIsLocked(false)
    }), [user, isInitialized, isLocked, refreshUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
