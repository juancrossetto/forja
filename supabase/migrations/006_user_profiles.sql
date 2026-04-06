-- ============================================
-- User Profiles for Método R3SET
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

create table if not exists public.user_profiles (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null unique,
  full_name       text,
  avatar_url      text,
  level           text not null default 'Principiante',  -- e.g. 'Principiante', 'Intermedio', 'Pro'
  plan_name       text,
  plan_duration_weeks  int,
  plan_current_week    int not null default 1,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

create index if not exists idx_user_profiles_user_id
  on public.user_profiles(user_id);

alter table public.user_profiles enable row level security;

create policy "profiles: select own"
  on public.user_profiles for select using (auth.uid() = user_id);
create policy "profiles: insert own"
  on public.user_profiles for insert with check (auth.uid() = user_id);
create policy "profiles: update own"
  on public.user_profiles for update using (auth.uid() = user_id);

create trigger on_user_profiles_updated
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();

-- Auto-create empty profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
