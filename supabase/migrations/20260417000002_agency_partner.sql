-- Agency Applications
CREATE TABLE public.agency_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  agency_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  website text,
  country text NOT NULL,
  clients_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Approved Agency Partners
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  application_id uuid REFERENCES public.agency_applications(id),
  agency_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  website text,
  country text NOT NULL,
  slug text NOT NULL UNIQUE,
  commission_rate numeric NOT NULL DEFAULT 20.0,
  is_active boolean NOT NULL DEFAULT true,
  total_earnings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Stores referred or created by agencies
CREATE TABLE public.agency_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  referred_via text NOT NULL DEFAULT 'link' CHECK (referred_via IN ('link', 'direct')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

-- Commission records
CREATE TABLE public.agency_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  subscription_period text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_commissions ENABLE ROW LEVEL SECURITY;

-- agency_applications: public insert (anyone can apply); owner can view their own
CREATE POLICY "agency_applications_insert" ON public.agency_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "agency_applications_select_own" ON public.agency_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "agency_applications_update_own" ON public.agency_applications
  FOR UPDATE USING (user_id = auth.uid());

-- agencies: public read needed for slug lookup during signup referral; owner can update their own
CREATE POLICY "agencies_select_public" ON public.agencies
  FOR SELECT USING (true);

CREATE POLICY "agencies_update_own" ON public.agencies
  FOR UPDATE USING (user_id = auth.uid());

-- agency_referrals: agency owner can view referrals; authenticated users can insert
CREATE POLICY "agency_referrals_select_own" ON public.agency_referrals
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "agency_referrals_insert" ON public.agency_referrals
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- agency_commissions: agency owner can view commissions; system inserts via trigger (SECURITY DEFINER)
CREATE POLICY "agency_commissions_select_own" ON public.agency_commissions
  FOR SELECT USING (
    agency_id IN (SELECT id FROM public.agencies WHERE user_id = auth.uid())
  );

CREATE POLICY "agency_commissions_insert" ON public.agency_commissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-commission trigger: fires when a store subscription changes to pro
CREATE OR REPLACE FUNCTION public.handle_pro_subscription_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agency_id uuid;
  v_commission_rate numeric;
  v_commission_amount numeric;
BEGIN
  IF NEW.plan = 'pro' AND (TG_OP = 'INSERT' OR OLD.plan IS DISTINCT FROM 'pro') THEN
    SELECT ar.agency_id, a.commission_rate
    INTO v_agency_id, v_commission_rate
    FROM public.agency_referrals ar
    JOIN public.agencies a ON a.id = ar.agency_id
    WHERE ar.store_id = NEW.store_id
    LIMIT 1;

    IF v_agency_id IS NOT NULL THEN
      -- 20% of 5000 NGN Pro plan price = 1000 NGN default
      v_commission_amount := 5000 * (v_commission_rate / 100.0);

      INSERT INTO public.agency_commissions (agency_id, store_id, amount, subscription_period, status)
      VALUES (v_agency_id, NEW.store_id, v_commission_amount, to_char(now(), 'YYYY-MM'), 'pending');

      UPDATE public.agencies
      SET total_earnings = total_earnings + v_commission_amount,
          updated_at = now()
      WHERE id = v_agency_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_subscription_pro_commission
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_pro_subscription_commission();

-- Indexes
CREATE INDEX idx_agencies_user_id ON public.agencies(user_id);
CREATE INDEX idx_agencies_slug ON public.agencies(slug);
CREATE INDEX idx_agency_referrals_agency_id ON public.agency_referrals(agency_id);
CREATE INDEX idx_agency_referrals_store_id ON public.agency_referrals(store_id);
CREATE INDEX idx_agency_commissions_agency_id ON public.agency_commissions(agency_id);
CREATE INDEX idx_agency_applications_user_id ON public.agency_applications(user_id);
