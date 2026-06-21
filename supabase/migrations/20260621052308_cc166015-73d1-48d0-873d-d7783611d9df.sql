ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dana_number text,
  ADD COLUMN IF NOT EXISTS dana_holder_name text,
  ADD COLUMN IF NOT EXISTS dana_qr_url text,
  ADD COLUMN IF NOT EXISTS dana_active boolean NOT NULL DEFAULT false;