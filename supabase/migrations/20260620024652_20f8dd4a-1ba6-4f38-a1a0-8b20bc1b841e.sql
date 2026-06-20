
-- Payment requests (bills via Flip Accept Payment)
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flip_link_id BIGINT,
  flip_link_url TEXT,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL DEFAULT 'SINGLE',
  step INT NOT NULL DEFAULT 2,
  sender_name TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  bill_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own payment_requests"
  ON public.payment_requests FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER payment_requests_touch BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Disbursements (withdrawals via Flip Disbursement)
CREATE TABLE public.disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flip_id BIGINT,
  idempotency_key TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  recipient_name TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fee NUMERIC NOT NULL DEFAULT 0,
  remark TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  raw JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.disbursements TO authenticated;
GRANT ALL ON public.disbursements TO service_role;

ALTER TABLE public.disbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own disbursements"
  ON public.disbursements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER disbursements_touch BEFORE UPDATE ON public.disbursements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
