-- Verified Seller System
-- Run this in Supabase SQL Editor (Primary Database, postgres role)

-- 1. Add is_verified column to stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- 2. Create verification_applications table
CREATE TABLE IF NOT EXISTS public.verification_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'info_requested')),
  full_legal_name text NOT NULL,
  phone_number text NOT NULL,
  business_name text,
  id_document_url text,
  bank_account_name text NOT NULL,
  bank_account_number text NOT NULL,
  bank_name text NOT NULL,
  admin_notes text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security
ALTER TABLE public.verification_applications ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own applications
CREATE POLICY "Sellers can view own verification applications"
  ON public.verification_applications FOR SELECT
  USING (user_id = auth.uid());

-- Sellers can submit new applications
CREATE POLICY "Sellers can submit verification applications"
  ON public.verification_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Sellers can update their own pending or info-requested applications
CREATE POLICY "Sellers can update own pending applications"
  ON public.verification_applications FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('pending', 'info_requested'));

-- 4. Trigger: auto-update stores.is_verified when status changes
CREATE OR REPLACE FUNCTION public.sync_store_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    UPDATE public.stores SET is_verified = true WHERE id = NEW.store_id;
  END IF;
  IF NEW.status = 'rejected' AND OLD.status = 'verified' THEN
    UPDATE public.stores SET is_verified = false WHERE id = NEW.store_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_verification_status_change ON public.verification_applications;
CREATE TRIGGER on_verification_status_change
  AFTER UPDATE ON public.verification_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_store_verification();
