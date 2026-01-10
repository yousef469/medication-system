-- 1. Profiles Table (Linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctors Meta Table
CREATE TABLE IF NOT EXISTS public.doctors_meta (
    id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    specialty TEXT,
    hospital_name TEXT,
    status TEXT DEFAULT 'Available',
    bio TEXT,
    followers TEXT DEFAULT '0',
    rating TEXT DEFAULT '5.0',
    surgery_count TEXT DEFAULT '0'
);

-- 3. Requests Table (Triage Feed)
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_name TEXT,
    hospital TEXT,
    section TEXT,
    diagnosis TEXT,
    urgency TEXT,
    status TEXT DEFAULT 'PENDING_SECRETARY',
    assigned_doctor_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT,
    level TEXT DEFAULT 'INFO',
    analyzed_by_ai BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Allow authenticated users access for demo)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Requests are viewable by authenticated" ON public.requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Requests can be created by anyone" ON public.requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Logs are viewable by IT" ON public.system_logs FOR SELECT USING (auth.role() = 'authenticated');
