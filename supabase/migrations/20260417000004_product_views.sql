CREATE TABLE public.product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous buyers) can record a product view
CREATE POLICY "product_views_insert_public" ON public.product_views
  FOR INSERT WITH CHECK (true);

-- Only the store owner can read their product views
CREATE POLICY "product_views_select_owner" ON public.product_views
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

CREATE INDEX idx_product_views_product_id ON public.product_views(product_id);
CREATE INDEX idx_product_views_store_id ON public.product_views(store_id);
