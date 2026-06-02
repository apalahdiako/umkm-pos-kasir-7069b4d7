
-- HPP Products table (advanced cost breakdown)
CREATE TABLE public.hpp_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Lainnya',
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  harga_beli NUMERIC NOT NULL DEFAULT 0,
  ongkir NUMERIC NOT NULL DEFAULT 0,
  kemasan NUMERIC NOT NULL DEFAULT 0,
  pajak NUMERIC NOT NULL DEFAULT 0,
  handling NUMERIC NOT NULL DEFAULT 0,
  shrinkage NUMERIC NOT NULL DEFAULT 0,
  packaging_final NUMERIC NOT NULL DEFAULT 0,
  biaya_lain JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_hpp NUMERIC NOT NULL DEFAULT 0,
  harga_jual NUMERIC NOT NULL DEFAULT 0,
  margin_target NUMERIC NOT NULL DEFAULT 30,
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, sku)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hpp_products TO authenticated;
GRANT ALL ON public.hpp_products TO service_role;
ALTER TABLE public.hpp_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY hpp_products_owner_all ON public.hpp_products
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_hpp_products_updated BEFORE UPDATE ON public.hpp_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_hpp_products_owner ON public.hpp_products(owner_id);

-- Channels per product
CREATE TABLE public.product_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.hpp_products(id) ON DELETE CASCADE,
  channel_name TEXT NOT NULL,
  harga_jual NUMERIC NOT NULL DEFAULT 0,
  fee_persen NUMERIC NOT NULL DEFAULT 0,
  fee_nominal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_channels TO authenticated;
GRANT ALL ON public.product_channels TO service_role;
ALTER TABLE public.product_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_channels_owner_all ON public.product_channels
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_product_channels_updated BEFORE UPDATE ON public.product_channels
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_product_channels_product ON public.product_channels(product_id);

-- Recipes (F&B)
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_hpp NUMERIC NOT NULL DEFAULT 0,
  yield_qty NUMERIC NOT NULL DEFAULT 1,
  hpp_per_porsi NUMERIC NOT NULL DEFAULT 0,
  prep_time INTEGER,
  difficulty TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY recipes_owner_all ON public.recipes
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_recipes_updated BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
