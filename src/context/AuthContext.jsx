import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { AuthContext } from './useAuth';

/**
 * AuthProvider component that manages the authentication state.
 * Strictly exports only the component to ensure Vite HMR stability.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    async function fetchProfile(supabaseUser) {
        try {
            // Step 1: Attempt DB Fetch with aggressive timeout (2s)
            // If DB is slow, we MUST fall back to metadata to avoid "Guest" state for valid users
            const dbFetchPromise = async () => {
                // Core Profile Data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, name, role, hospital_id, phone, bio_story, certifications, avatar_url')
                    .eq('id', supabaseUser.id)
                    .maybeSingle();

                if (profileError || !profile) throw new Error("Profile missing or DB error");

                return {
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: profile.role || 'user',
                    name: profile.name || supabaseUser.email.split('@')[0],
                    verification_status: 'APPROVED',
                    hospital_id: profile.hospital_id,
                    phone: profile.phone,
                    bio_story: profile.bio_story,
                    certifications: profile.certifications,
                    avatar_url: profile.avatar_url,
                    isAuthenticated: true
                };
            };

            // Race DB against a 2s timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("DB_TIMEOUT")), 5000)
            );

            try {
                const userData = await Promise.race([dbFetchPromise(), timeoutPromise]);
                setUser(userData);
            } catch (err) {
                console.warn("[Auth] DB Fetch stalled or failed, using Metadata Fallback:", err.message);
                // Metadata Fallback (Self-Healing)
                const metadata = supabaseUser.user_metadata || {};
                setUser({
                    id: supabaseUser.id,
                    email: supabaseUser.email,
                    role: metadata.role || 'user',
                    name: metadata.name || supabaseUser.email.split('@')[0],
                    verification_status: 'APPROVED',
                    hospital_id: metadata.hospital_id || null,
                    phone: metadata.phone || '',
                    isAuthenticated: true
                });
            }

        } catch (err) {
            setUser({ id: supabaseUser.id, email: supabaseUser.email, role: 'user', name: 'Guest', isAuthenticated: true });
        } finally {
            setIsInitialized(true);
        }
    }

    useEffect(() => {
        const initAuth = async () => {
            const safetyTimer = setTimeout(() => {
                console.warn('[Auth] Initialization safety timeout triggered');
                setUser(prev => prev || { role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            }, 5000);

            try {
                // Step 1: Handle stale URL fragments from old sessions
                if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=')) {
                    console.log('[Auth] Detected auth tokens in URL, cleaning up...');
                }

                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.warn('[Auth] Stale or invalid session detected, clearing:', error.message);
                    await supabase.auth.signOut();
                    // Clear URL hash to prevent infinite loop of stale initialization
                    window.history.replaceState(null, null, window.location.pathname + window.location.search);
                }

                if (session) {
                    await fetchProfile(session.user);
                    // Clear hash after successful login to prevent "stale URL" on next refresh
                    if (window.location.hash.includes('access_token=')) {
                        window.history.replaceState(null, null, window.location.pathname + window.location.search);
                    }
                } else {
                    setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                    setIsInitialized(true);
                }
            } catch (err) {
                console.error('[Auth] Hard initialization failure:', err);
                setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
                setIsInitialized(true);
            } finally {
                clearTimeout(safetyTimer);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Event: ${event}`);
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
    }, []);

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser({ role: 'user', name: 'Guest Patient', isAuthenticated: false });
    };

    const [isLocked, setIsLocked] = useState(false);
    const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    useEffect(() => {
        let idleTimer;

        const resetTimer = () => {
            if (isLocked) return;
            clearTimeout(idleTimer);
            if (user?.isAuthenticated && ['doctor', 'nurse', 'hospital_admin', 'secretary', 'it'].includes(user.role)) {
                idleTimer = setTimeout(() => setIsLocked(true), IDLE_TIMEOUT);
            }
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);

        // Initial start
        resetTimer();

        return () => {
            clearTimeout(idleTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
        };
    }, [user, isLocked]);

    const lockSession = () => setIsLocked(true);
    const unlockSession = () => setIsLocked(false);

    const value = useMemo(() => ({
        user, login, logout, isInitialized, isLocked, lockSession, unlockSession
    }), [user, isInitialized, isLocked]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// End of Provider
