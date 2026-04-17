-- ================================================================
-- Link System: Collections + Link Click Tracking
-- ================================================================

-- Collections
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  cover_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections_select" ON public.collections
  FOR SELECT USING (true);

CREATE POLICY "collections_owner_all" ON public.collections
  FOR ALL USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

-- Collection Products
CREATE TABLE IF NOT EXISTS public.collection_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  UNIQUE (collection_id, product_id)
);

ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_products_select" ON public.collection_products
  FOR SELECT USING (true);

CREATE POLICY "collection_products_owner_all" ON public.collection_products
  FOR ALL USING (
    collection_id IN (
      SELECT c.id FROM public.collections c
      JOIN public.stores s ON c.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Link Click Tracking
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  link_type text NOT NULL DEFAULT 'product',
  referrer text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "link_clicks_insert" ON public.link_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "link_clicks_owner_select" ON public.link_clicks
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );
