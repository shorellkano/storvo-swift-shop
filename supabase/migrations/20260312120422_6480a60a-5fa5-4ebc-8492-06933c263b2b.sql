
CREATE TABLE public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(domain)
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage custom domains"
  ON public.custom_domains FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = custom_domains.store_id
    AND stores.user_id = auth.uid()
  ));

CREATE POLICY "Public can view verified domains"
  ON public.custom_domains FOR SELECT
  USING (status = 'verified');
