
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security-definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Bootstrap: first signed-up user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_bootstrap();

-- Shipments
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number TEXT UNIQUE NOT NULL,
  status TEXT,
  current_location TEXT,
  amount_due NUMERIC,
  payment_mode TEXT,
  comments TEXT,
  origin_label TEXT,
  origin_lat NUMERIC,
  origin_lng NUMERIC,
  current_stop_label TEXT,
  current_stop_lat NUMERIC,
  current_stop_lng NUMERIC,
  destination_label TEXT,
  destination_lat NUMERIC,
  destination_lng NUMERIC,
  package_type TEXT,
  weight TEXT,
  description TEXT,
  date_sent DATE,
  expected_delivery_date DATE,
  package_image_url TEXT,
  proof_of_delivery_url TEXT,
  show_image BOOLEAN DEFAULT TRUE,
  show_airport_step BOOLEAN DEFAULT FALSE,
  sender_name TEXT,
  sender_phone TEXT,
  sender_email TEXT,
  sender_address TEXT,
  sender_country TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  receiver_email TEXT,
  receiver_address TEXT,
  receiver_country TEXT,
  hold_headline TEXT,
  hold_body TEXT,
  hold_footer_note TEXT,
  hold_amount TEXT,
  hold_contact_email TEXT,
  crypto_wallet_address TEXT,
  payment_instruction_note TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  bank_instruction_note TEXT,
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shipments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shipments" ON public.shipments
  FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin insert shipments" ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update shipments" ON public.shipments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete shipments" ON public.shipments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Hold settings singleton
CREATE TABLE public.hold_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name TEXT,
  company_address TEXT,
  company_email TEXT,
  company_logo_url TEXT,
  default_hold_headline TEXT,
  default_hold_body TEXT,
  default_hold_footer TEXT,
  default_crypto_wallet TEXT,
  default_payment_note TEXT,
  default_bank_name TEXT,
  default_bank_account_number TEXT,
  default_bank_account_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hold_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hold_settings TO authenticated;
GRANT ALL ON public.hold_settings TO service_role;

ALTER TABLE public.hold_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read hold settings" ON public.hold_settings
  FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin manage hold settings" ON public.hold_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER hold_settings_updated_at
  BEFORE UPDATE ON public.hold_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.hold_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-images', 'package-images', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read package images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'package-images');

CREATE POLICY "Admin upload package images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'package-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update package images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'package-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete package images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'package-images' AND public.has_role(auth.uid(), 'admin'));
