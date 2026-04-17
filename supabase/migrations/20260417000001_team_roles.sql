-- Team Members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'customer_support', 'operations', 'developer_support')),
  invited_by uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- Team Invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'customer_support', 'operations', 'developer_support')),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Activity Log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- team_members: store owners can manage all members
CREATE POLICY "team_members_owner_all" ON public.team_members
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

-- team_members: members can view their own record
CREATE POLICY "team_members_self_select" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

-- team_members: authenticated users can insert their own record (must have a pending invitation for that store)
CREATE POLICY "team_members_accept_invite" ON public.team_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_invitations
      WHERE store_id = team_members.store_id
        AND status = 'pending'
        AND expires_at > now()
    )
  );

-- team_invitations: store owners can manage invitations
CREATE POLICY "team_invitations_owner_all" ON public.team_invitations
  USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

-- team_invitations: public read by token for invite acceptance page
CREATE POLICY "team_invitations_public_read" ON public.team_invitations
  FOR SELECT USING (true);

-- team_invitations: authenticated users can update to mark as accepted
CREATE POLICY "team_invitations_update_accept" ON public.team_invitations
  FOR UPDATE USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- activity_log: store owners can view their log
CREATE POLICY "activity_log_owner_select" ON public.activity_log
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

-- activity_log: authenticated users can insert their own entries
CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_team_members_store_id ON public.team_members(store_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_invitations_store_id ON public.team_invitations(store_id);
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_activity_log_store_id ON public.activity_log(store_id);
