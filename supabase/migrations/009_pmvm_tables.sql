-- ============================================
-- PMVM Dashboard tables — run in forja Supabase
-- Allows PMVM admin dashboard to share this DB
-- ============================================

-- ─── 1. profiles (unified: PMVM client management + role) ───
-- Note: MetodoR3SET keeps its own `user_profiles` for fitness-specific fields.
-- `profiles` is the shared identity + admin record.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  phone text,
  goal text,              -- user's fitness objective e.g. "bajar 5kg"
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  locale text DEFAULT 'es',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── 2. plans (subscription tiers) ───

CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,          -- 'monthly' | 'quarterly' | 'semiannual'
  name text NOT NULL,
  description text,
  price_ars numeric(10,2) NOT NULL,
  duration_days int NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Plans are readable by all authenticated users
CREATE POLICY "Authenticated can read plans"
  ON public.plans FOR SELECT USING (auth.role() = 'authenticated');
-- Admins can modify plans
CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed default plans
INSERT INTO public.plans (id, name, description, price_ars, duration_days)
VALUES
  ('monthly',    'Plan Mensual',     'Acceso completo por 1 mes',    15000, 30),
  ('quarterly',  'Plan Trimestral',  'Acceso completo por 3 meses',  39000, 90),
  ('semiannual', 'Plan Semestral',   'Acceso completo por 6 meses',  69000, 180)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. subscriptions ───

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id text REFERENCES public.plans(id) NOT NULL,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  mp_payment_id text,
  mp_preference_id text,
  mp_status text,
  started_at timestamptz,
  expires_at timestamptz,
  locale text DEFAULT 'es',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 4. routines ───

CREATE TABLE IF NOT EXISTS public.routines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  days_per_week int DEFAULT 3,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own routines"
  ON public.routines FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Admins can manage all routines"
  ON public.routines FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 5. routine_exercises ───

CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id uuid REFERENCES public.routines(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sets int,
  reps text,              -- e.g. "8-10" or "al fallo"
  rest_secs int,
  notes text,
  order_index int DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exercises for own routines"
  ON public.routine_exercises FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.routines WHERE id = routine_id AND client_id = auth.uid())
  );
CREATE POLICY "Admins can manage all exercises"
  ON public.routine_exercises FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 6. messages ───

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'trainer')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_client ON public.messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(client_id, read);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Admins can view all messages"
  ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can send messages"
  ON public.messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins can update messages (mark read)"
  ON public.messages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ─── 7. Grant admin access to goal_templates ───
-- Admins can fully manage goal templates

-- Drop existing policy if any, and add admin write policy
DO $$
BEGIN
  -- Add admin write policy to goal_templates if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'goal_templates' AND policyname = 'Admins can manage templates'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage templates"
      ON public.goal_templates FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;
END $$;
