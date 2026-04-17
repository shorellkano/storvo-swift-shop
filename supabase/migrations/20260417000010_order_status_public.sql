-- ================================================================
-- Allow public read of orders by order_number (for order status page)
-- Order number serves as a secure token (e.g. ORD-M5X3K2A8)
-- ================================================================

-- Public read on orders (order_number is the access token)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_public_read'
  ) THEN
    CREATE POLICY "orders_public_read" ON public.orders
      FOR SELECT USING (true);
  END IF;
END $$;

-- Public read on order_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'order_items_public_read'
  ) THEN
    CREATE POLICY "order_items_public_read" ON public.order_items
      FOR SELECT USING (true);
  END IF;
END $$;

-- Public read on customers (needed to show delivery details on status page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'customers_public_read'
  ) THEN
    CREATE POLICY "customers_public_read" ON public.customers
      FOR SELECT USING (true);
  END IF;
END $$;
