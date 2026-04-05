-- ============================================
-- Workout Logs for Método R3SET
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

-- ── WORKOUT LOGS ──────────────────────────
-- One row per completed workout session
create table if not exists public.workout_logs (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  date          date not null default current_date,
  workout_name  text not null default '',
  workout_type  text,                           -- e.g. 'fuerza', 'cardio', 'movilidad'
  duration_min  int check (duration_min >= 0),
  rpe           int check (rpe between 1 and 10),  -- Rate of Perceived Exertion
  comments      text,
  completed     boolean not null default true,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create index if not exists idx_workout_logs_user_date
  on public.workout_logs(user_id, date desc);

alter table public.workout_logs enable row level security;

create policy "workout_logs: select own"
  on public.workout_logs for select using (auth.uid() = user_id);
create policy "workout_logs: insert own"
  on public.workout_logs for insert with check (auth.uid() = user_id);
create policy "workout_logs: update own"
  on public.workout_logs for update using (auth.uid() = user_id);
create policy "workout_logs: delete own"
  on public.workout_logs for delete using (auth.uid() = user_id);

create trigger on_workout_logs_updated
  before update on public.workout_logs
  for each row execute function public.handle_updated_at();
