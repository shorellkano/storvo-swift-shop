-- Media Commerce System
-- Run in Supabase SQL Editor

-- Add negotiation and download control to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_negotiable boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_media_download boolean NOT NULL DEFAULT false;

-- Product Videos table
CREATE TABLE IF NOT EXISTS public.product_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_videos_public_read" ON public.product_videos
  FOR SELECT USING (true);

CREATE POLICY "product_videos_owner_insert" ON public.product_videos
  FOR INSERT WITH CHECK (
    product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))
  );

CREATE POLICY "product_videos_owner_delete" ON public.product_videos
  FOR DELETE USING (
    product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()))
  );

-- Price Offers (Negotiation)
CREATE TABLE IF NOT EXISTS public.price_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_phone text NOT NULL,
  offered_price numeric NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  counter_price numeric,
  seller_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_offers_insert_public" ON public.price_offers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "price_offers_owner_select" ON public.price_offers
  FOR SELECT USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

CREATE POLICY "price_offers_owner_update" ON public.price_offers
  FOR UPDATE USING (
    store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_videos_product_id ON public.product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_store_id ON public.price_offers(store_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_product_id ON public.price_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_price_offers_status ON public.price_offers(status);

-- Storage bucket for product videos (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('product-videos', 'product-videos', true) ON CONFLICT DO NOTHING;

CREATE POLICY "product_videos_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-videos');

CREATE POLICY "product_videos_storage_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "product_videos_storage_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-videos' AND auth.uid() IS NOT NULL);
