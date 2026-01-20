-- 1. Create Invitations Table
CREATE TABLE IF NOT EXISTS hospital_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  hospital_id UUID REFERENCES hospitals(id) NOT NULL,
  role user_role NOT NULL,
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '48 hours'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE hospital_invites ENABLE ROW LEVEL SECURITY;

-- 3. Policies for Admins (Creators)
-- Allow Admins to see invites they created OR invites for their hospital (if we link them that way)
CREATE POLICY "Admins view generated invites" ON hospital_invites
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins generate invites" ON hospital_invites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 4. Secure Functions for Anonymous/Public Access (Consumption)

-- Function A: Validate Token (Read-Only, Safe for Login Page)
CREATE OR REPLACE FUNCTION validate_invite_token(lookup_token UUID)
RETURNS TABLE (
  valid BOOLEAN,
  hospital_name TEXT,
  target_hospital_id UUID,
  target_role user_role
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE,
    h.name::TEXT,
    i.hospital_id,
    i.role
  FROM hospital_invites i
  JOIN hospitals h ON h.id = i.hospital_id
  WHERE i.token = lookup_token
    AND i.used_at IS NULL
    AND i.expires_at > now();
END;
$$;

-- Function B: Claim Token (Mark as used upon registration success)
CREATE OR REPLACE FUNCTION claim_invite_token(claim_token UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  invite_id UUID;
BEGIN
  -- Find valid invite
  SELECT id INTO invite_id 
  FROM hospital_invites 
  WHERE token = claim_token 
    AND used_at IS NULL 
    AND expires_at > now();
  
  IF invite_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Mark as used
  UPDATE hospital_invites 
  SET used_at = now() 
  WHERE id = invite_id;
  
  RETURN TRUE;
END;
$$;
