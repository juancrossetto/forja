-- ============================================
-- Daily Goals table for Método R3SET
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- Daily goals table
create table if not exists public.daily_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  text text not null,
  completed boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- One goal text per user per date
  unique(user_id, date, text)
);

-- Index for fast lookups by user + date
create index if not exists idx_daily_goals_user_date on public.daily_goals(user_id, date);

-- Enable Row Level Security
alter table public.daily_goals enable row level security;

-- RLS Policies: users can only see/modify their own goals
create policy "Users can view own goals"
  on public.daily_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.daily_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.daily_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.daily_goals for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_daily_goals_updated
  before update on public.daily_goals
  for each row execute function public.handle_updated_at();
