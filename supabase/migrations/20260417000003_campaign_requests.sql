CREATE TABLE public.campaign_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('local_visibility', 'product_launch', 'whatsapp_lead')),
  store_name text NOT NULL,
  product_name text,
  target_location text,
  radius_km integer,
  campaign_goal text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'active', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_requests_select_own" ON public.campaign_requests
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

CREATE POLICY "campaign_requests_insert" ON public.campaign_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_campaign_requests_store_id ON public.campaign_requests(store_id);
CREATE INDEX idx_campaign_requests_user_id ON public.campaign_requests(user_id);
