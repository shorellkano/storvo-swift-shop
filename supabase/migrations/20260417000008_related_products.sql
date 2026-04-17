-- ================================================================
-- Related Products (Frequently Bought Together)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.product_related (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, related_product_id),
  CHECK (product_id != related_product_id)
);

ALTER TABLE public.product_related ENABLE ROW LEVEL SECURITY;

-- Public read (needed for storefront display)
CREATE POLICY "product_related_select" ON public.product_related FOR SELECT USING (true);

-- Only store owner can manage their own product relationships
CREATE POLICY "product_related_insert" ON public.product_related FOR INSERT WITH CHECK (
  product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.stores s ON p.store_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "product_related_delete" ON public.product_related FOR DELETE USING (
  product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.stores s ON p.store_id = s.id
    WHERE s.user_id = auth.uid()
  )
);
