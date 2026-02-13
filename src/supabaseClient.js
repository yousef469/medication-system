import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const options = {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: { 'apikey': supabaseAnonKey, 'X-Client-Info': 'medication-system' }
    }
};

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL: Environment variables missing!');
} else {
    console.log('[Supabase] Client initialized with URL:', (supabaseUrl || '').substring(0, 20) + '...');
}

export const supabase = createClient(
    supabaseUrl || 'https://MISSING.supabase.co',
    supabaseAnonKey || 'MISSING',
    options
);
