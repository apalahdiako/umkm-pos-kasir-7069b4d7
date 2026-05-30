
-- Unique case-insensitive index for store_name
CREATE UNIQUE INDEX IF NOT EXISTS profiles_store_name_lower_unique
  ON public.profiles (lower(store_name))
  WHERE store_name IS NOT NULL;

-- Availability checkers (SECURITY DEFINER, no data leak)
CREATE OR REPLACE FUNCTION public.is_store_name_available(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(store_name) = lower(trim(_name))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_email_available(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_store_name_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_email_available(text) TO anon, authenticated;

-- Update handle_new_user to populate store_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, store_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(trim(NEW.raw_user_meta_data->>'store_name'), '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'owner');
  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
