
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase Diagnostic Tool ---');
console.log('URL:', url ? url.substring(0, 20) + '...' : 'MISSING');
console.log('KEY:', key ? key.substring(0, 10) + '...' : 'MISSING');

if (!url || !key) {
    console.error('ERROR: Environment variables missing in .env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function runDiagnostics() {
    console.log('\n[1] Testing basic connectivity...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);

    if (pError) {
        console.error('FAILED: Profiles check. Error:', JSON.stringify(pError, null, 2));
    } else {
        console.log('SUCCESS: Connected to profiles table.');
    }

    console.log('\n[2] Testing Auth service...');
    // Trying a fake login to see if the auth server responds with "No API key"
    const { data: auth, error: aError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
    });

    if (aError) {
        if (aError.message.includes('apikey')) {
            console.error('CRITICAL: Auth server rejected the API key header!');
        } else {
            console.log('SUCCESS: Auth server is reachable (returned expected error: ' + aError.message + ')');
        }
    } else {
        console.log('SUCCESS: Auth server is reachable.');
    }
}

runDiagnostics();
