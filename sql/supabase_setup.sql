-- 1. Create enum types
CREATE TYPE user_role AS ENUM ('doctor', 'secretary', 'it', 'admin', 'user');
CREATE TYPE doctor_status AS ENUM ('Available', 'Busy', 'Vacation');
CREATE TYPE urgency_tier AS ENUM ('IMMEDIATE', 'NEXT HOUR', 'SCHEDULED');
CREATE TYPE request_status AS ENUM ('PENDING_SECRETARY', 'ROUTED_TO_DOCTOR', 'COMPLETED');
CREATE TYPE log_level AS ENUM ('INFO', 'ERROR', 'WARN');

-- 2. Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'user',
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create doctors metadata table
CREATE TABLE doctors_meta (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  specialty TEXT,
  hospital_name TEXT,
  status doctor_status DEFAULT 'Available',
  bio TEXT,
  followers INT DEFAULT 0,
  rating FLOAT DEFAULT 5.0,
  surgery_count INT DEFAULT 0
);

-- 4. Create clinical requests table
CREATE TABLE requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  hospital TEXT NOT NULL,
  section TEXT,
  diagnosis TEXT,
  urgency urgency_tier DEFAULT 'NEXT HOUR',
  status request_status DEFAULT 'PENDING_SECRETARY',
  assigned_doctor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create system logs table
CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  level log_level DEFAULT 'INFO',
  analyzed_by_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Doctors Meta: Everyone can read status, only the doctor can update their own data
CREATE POLICY "Doctor info is viewable by everyone" ON doctors_meta FOR SELECT USING (true);
CREATE POLICY "Doctors can update own metadata" ON doctors_meta FOR UPDATE USING (auth.uid() = id);

-- Requests Policies
CREATE POLICY "Clinical staff can see all requests" ON requests FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('secretary', 'doctor', 'admin', 'it')));

CREATE POLICY "Patients can submit requests" ON requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Secretaries can update any request" ON requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('secretary', 'admin')));

CREATE POLICY "Doctors can update assigned requests" ON requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'doctor' AND assigned_doctor_id = auth.uid()));

-- System Logs Policies
CREATE POLICY "IT and Admins can see logs" ON system_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('it', 'admin')));

CREATE POLICY "AI and System can insert logs" ON system_logs FOR INSERT WITH CHECK (true);
