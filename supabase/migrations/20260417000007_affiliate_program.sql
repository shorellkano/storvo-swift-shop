-- ================================================================
-- Affiliate / Creator Rewards Program
-- ================================================================

-- 1. Affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  social_handle text,
  primary_platform text CHECK (primary_platform IN ('instagram','tiktok','youtube','twitter','whatsapp','marketplace')),
  bank_name text,
  account_number text,
  account_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended')),
  commission_rate numeric NOT NULL DEFAULT 30.0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Click tracking (anonymous, recorded from /ref page)
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Referral tracking (seller signed up via affiliate link)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_username text,
  signup_date timestamptz NOT NULL DEFAULT now(),
  has_trial boolean NOT NULL DEFAULT false,
  converted_to_pro boolean NOT NULL DEFAULT false,
  converted_at timestamptz
);

-- 4. Commission records (auto-created by webhook on each Pro payment)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  commission_amount numeric NOT NULL,
  period_month date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid')),
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referral_id, period_month)
);

-- 5. Payout records
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','paid')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

-- ================================================================
-- Row Level Security
-- ================================================================

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- affiliates: public SELECT (needed for /ref lookup by username), public INSERT (open signup)
CREATE POLICY "affiliates_select_all" ON public.affiliates FOR SELECT USING (true);
CREATE POLICY "affiliates_insert_public" ON public.affiliates FOR INSERT WITH CHECK (true);
CREATE POLICY "affiliates_update_own" ON public.affiliates FOR UPDATE USING (
  user_id = auth.uid()
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- affiliate_clicks: anyone can insert (from public /ref page), affiliate reads own
CREATE POLICY "affiliate_clicks_insert_public" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "affiliate_clicks_select_own" ON public.affiliate_clicks FOR SELECT USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates
    WHERE user_id = auth.uid()
       OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- affiliate_referrals: authenticated users can insert; affiliate reads own; referred user reads own
CREATE POLICY "affiliate_referrals_insert" ON public.affiliate_referrals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "affiliate_referrals_update_system" ON public.affiliate_referrals FOR UPDATE USING (true);
CREATE POLICY "affiliate_referrals_select_own" ON public.affiliate_referrals FOR SELECT USING (
  referred_user_id = auth.uid()
  OR affiliate_id IN (
    SELECT id FROM public.affiliates
    WHERE user_id = auth.uid()
       OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- affiliate_commissions: service role inserts via webhook; affiliate reads own
CREATE POLICY "affiliate_commissions_insert_service" ON public.affiliate_commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "affiliate_commissions_select_own" ON public.affiliate_commissions FOR SELECT USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates
    WHERE user_id = auth.uid()
       OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- affiliate_payouts: affiliate can insert (request) and read own
CREATE POLICY "affiliate_payouts_select_own" ON public.affiliate_payouts FOR SELECT USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates
    WHERE user_id = auth.uid()
       OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
CREATE POLICY "affiliate_payouts_insert_own" ON public.affiliate_payouts FOR INSERT WITH CHECK (
  affiliate_id IN (
    SELECT id FROM public.affiliates
    WHERE user_id = auth.uid()
       OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
