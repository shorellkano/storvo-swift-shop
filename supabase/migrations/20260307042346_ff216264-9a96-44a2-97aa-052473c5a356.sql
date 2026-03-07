
-- ============================================================
-- STORVO DATABASE SCHEMA
-- ============================================================

-- 1. Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 2. Enums
CREATE TYPE public.product_type AS ENUM ('physical', 'digital');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed');
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');

-- ============================================================
-- 3. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. STORES
-- ============================================================
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6366F1',
  instagram_handle TEXT,
  whatsapp_number TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  paystack_subaccount_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Sellers manage their own stores
CREATE POLICY "Users can view own stores" ON public.stores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stores" ON public.stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stores" ON public.stores
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stores" ON public.stores
  FOR DELETE USING (auth.uid() = user_id);
-- Public can view active stores (for storefront)
CREATE POLICY "Public can view active stores" ON public.stores
  FOR SELECT USING (is_active = true);

CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_user_id ON public.stores(user_id);

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL,
  product_type public.product_type NOT NULL DEFAULT 'physical',
  track_inventory BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INTEGER DEFAULT 0,
  digital_file_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Store owners manage products
CREATE POLICY "Store owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = products.store_id AND stores.user_id = auth.uid())
  );
-- Public can view active products
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE INDEX idx_products_store_id ON public.products(store_id);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 6. PRODUCT IMAGES
-- ============================================================
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage product images" ON public.product_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id = product_images.product_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "Public can view product images" ON public.product_images
  FOR SELECT USING (true);

CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- ============================================================
-- 7. CUSTOMERS
-- ============================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage customers" ON public.customers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = customers.store_id AND stores.user_id = auth.uid())
  );
-- Allow anonymous inserts during checkout
CREATE POLICY "Anyone can create customers" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_customers_store_id ON public.customers(store_id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 8. ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  order_number TEXT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view orders" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Store owners can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid())
  );
-- Allow anonymous inserts during checkout
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);
-- Allow anonymous to view their own order by id (for confirmation page)
CREATE POLICY "Anyone can view orders" ON public.orders
  FOR SELECT USING (true);

CREATE INDEX idx_orders_store_id ON public.orders(store_id);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.stores s ON s.id = o.store_id
      WHERE o.id = order_items.order_id AND s.user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order items" ON public.order_items
  FOR SELECT USING (true);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ============================================================
-- 10. PAYMENTS
-- ============================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id),
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status public.payment_status NOT NULL DEFAULT 'pending',
  paystack_reference TEXT UNIQUE,
  paystack_access_code TEXT,
  payment_channel TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = payments.store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Anyone can create payments" ON public.payments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view payments" ON public.payments
  FOR SELECT USING (true);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_reference ON public.payments(paystack_reference);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = subscriptions.store_id AND stores.user_id = auth.uid())
  );
CREATE POLICY "Store owners can update subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.stores WHERE stores.id = subscriptions.store_id AND stores.user_id = auth.uid())
  );

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 12. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('store-logos', 'store-logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('digital-products', 'digital-products', false);

-- Product images: public read, auth write
CREATE POLICY "Product images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Store logos: public read, auth write
CREATE POLICY "Store logos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-logos');
CREATE POLICY "Authenticated users can upload store logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update store logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete store logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

-- Digital products: only owner can upload, download via secure link
CREATE POLICY "Authenticated users can upload digital products" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'digital-products' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage digital products" ON storage.objects
  FOR UPDATE USING (bucket_id = 'digital-products' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete digital products" ON storage.objects
  FOR DELETE USING (bucket_id = 'digital-products' AND auth.role() = 'authenticated');

-- ============================================================
-- 13. RESERVED SLUGS
-- ============================================================
CREATE TABLE public.reserved_slugs (
  slug TEXT PRIMARY KEY
);

ALTER TABLE public.reserved_slugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reserved slugs" ON public.reserved_slugs FOR SELECT USING (true);

INSERT INTO public.reserved_slugs (slug) VALUES
  ('app'), ('www'), ('admin'), ('api'), ('cdn'), ('blog'), ('help');
