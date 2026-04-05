-- ============================================
-- Progress Photos table for Método R3SET
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================

-- Storage bucket for photos (run once in the Supabase dashboard or via CLI)
-- insert into storage.buckets (id, name, public)
-- values ('progress-photos', 'progress-photos', false);

-- Progress photos table
create table if not exists public.progress_photos (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  position       text not null check (position in ('frente', 'perfil', 'espalda')),
  photo_url      text not null,
  week_number    int not null,
  recorded_at    date not null default current_date,
  created_at     timestamptz default now() not null,

  -- One photo per position per day per user (same day = overwrite, new day = new record)
  unique(user_id, position, recorded_at)
);

-- Index for fast lookups by user
create index if not exists idx_progress_photos_user on public.progress_photos(user_id, recorded_at desc);

-- Enable Row Level Security
alter table public.progress_photos enable row level security;

-- RLS Policies: users can only access their own photos
create policy "Users can view own photos"
  on public.progress_photos for select
  using (auth.uid() = user_id);

create policy "Users can insert own photos"
  on public.progress_photos for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own photos"
  on public.progress_photos for delete
  using (auth.uid() = user_id);

-- Storage RLS: users can only access their own folder
-- Run these in the Supabase Dashboard → Storage → Policies
-- Policy name: "Users can upload own photos"
--   on storage.objects for insert
--   with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- Policy name: "Users can view own photos"
--   on storage.objects for select
--   using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- Policy name: "Users can delete own photos"
--   on storage.objects for delete
--   using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
