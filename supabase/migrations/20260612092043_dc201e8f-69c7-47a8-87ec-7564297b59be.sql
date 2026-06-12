
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS transport_mode TEXT NOT NULL DEFAULT 'land',
  ADD COLUMN IF NOT EXISTS crypto_currency TEXT;

ALTER TABLE public.hold_settings
  ADD COLUMN IF NOT EXISTS default_payment_mode TEXT DEFAULT 'Crypto',
  ADD COLUMN IF NOT EXISTS default_crypto_currency TEXT DEFAULT 'Bitcoin',
  ADD COLUMN IF NOT EXISTS default_btc_wallet TEXT,
  ADD COLUMN IF NOT EXISTS default_eth_wallet TEXT,
  ADD COLUMN IF NOT EXISTS default_usdt_wallet TEXT,
  ADD COLUMN IF NOT EXISTS support_email TEXT;
