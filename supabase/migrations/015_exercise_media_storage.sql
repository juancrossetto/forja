-- Public bucket for exercise GIFs/images/videos mirrored from external CDNs into Supabase Storage.
-- App clients load image_url from public.exercises; production uses stable first-party URLs.
--
-- Upload media via Dashboard or Supabase client; set public.exercises.image_url / video_url to the public object URL.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-media',
  'exercise-media',
  true,
  52428800,
  ARRAY[
    'image/gif'::text,
    'image/png'::text,
    'image/jpeg'::text,
    'image/webp'::text,
    'video/mp4'::text
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "exercise-media: public read" ON storage.objects;

CREATE POLICY "exercise-media: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'exercise-media');
