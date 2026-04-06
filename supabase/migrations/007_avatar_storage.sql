-- ============================================
-- Avatar Storage bucket policies for Método R3SET
-- 1. Create the bucket in Supabase Dashboard → Storage → New bucket
--    Name: avatars | Public: true
-- 2. Then run these policies:
-- ============================================

-- Users can upload their own avatar
create policy "avatars: upload own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update (overwrite) their own avatar
create policy "avatars: update own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
create policy "avatars: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');
