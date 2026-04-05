-- ============================================
-- Hydration + Body Measurements for Método R3SET
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

-- ── HYDRATION LOGS ──────────────────────────
-- One row per user per day (upsert by date)
create table if not exists public.hydration_logs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null default current_date,
  total_ml    int not null default 0 check (total_ml >= 0),
  goal_ml     int not null default 3000,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null,

  unique(user_id, date)
);

create index if not exists idx_hydration_user_date
  on public.hydration_logs(user_id, date desc);

alter table public.hydration_logs enable row level security;

create policy "hydration: select own"
  on public.hydration_logs for select using (auth.uid() = user_id);
create policy "hydration: insert own"
  on public.hydration_logs for insert with check (auth.uid() = user_id);
create policy "hydration: update own"
  on public.hydration_logs for update using (auth.uid() = user_id);
create policy "hydration: delete own"
  on public.hydration_logs for delete using (auth.uid() = user_id);

create trigger on_hydration_updated
  before update on public.hydration_logs
  for each row execute function public.handle_updated_at();

-- ── BODY MEASUREMENTS ───────────────────────
-- One row per user per day (upsert by date)
create table if not exists public.body_measurements (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null default current_date,
  gender       text check (gender in ('male', 'female')),
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  chest_cm     numeric(5,1),
  waist_cm     numeric(5,1),
  hips_cm      numeric(5,1),
  arms_cm      numeric(5,1),
  legs_cm      numeric(5,1),
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,

  unique(user_id, date)
);

create index if not exists idx_body_measurements_user_date
  on public.body_measurements(user_id, date desc);

alter table public.body_measurements enable row level security;

create policy "measurements: select own"
  on public.body_measurements for select using (auth.uid() = user_id);
create policy "measurements: insert own"
  on public.body_measurements for insert with check (auth.uid() = user_id);
create policy "measurements: update own"
  on public.body_measurements for update using (auth.uid() = user_id);
create policy "measurements: delete own"
  on public.body_measurements for delete using (auth.uid() = user_id);

create trigger on_measurements_updated
  before update on public.body_measurements
  for each row execute function public.handle_updated_at();
