-- ============================================
-- Meal Logs for Método R3SET
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

create table if not exists public.meal_logs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null default current_date,
  meal_type   text not null check (meal_type in ('DES', 'ALM', 'MER', 'CEN')),
  title       text,
  photo_url   text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists idx_meal_logs_user_date
  on public.meal_logs(user_id, date desc);

alter table public.meal_logs enable row level security;

create policy "meal_logs: select own"
  on public.meal_logs for select using (auth.uid() = user_id);
create policy "meal_logs: insert own"
  on public.meal_logs for insert with check (auth.uid() = user_id);
create policy "meal_logs: update own"
  on public.meal_logs for update using (auth.uid() = user_id);
create policy "meal_logs: delete own"
  on public.meal_logs for delete using (auth.uid() = user_id);

create trigger on_meal_logs_updated
  before update on public.meal_logs
  for each row execute function public.handle_updated_at();
