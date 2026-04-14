-- ─────────────────────────────────────────────────────────────────────────────
-- 027_icons_storage.sql
-- Bucket público `icons` para assets estáticos de la app (trofeos, badges, etc.)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'icons',
  'icons',
  true,                          -- público: cualquiera puede leer sin token
  512000,                        -- 700 KB máximo por archivo
  ARRAY['image/png','image/webp','image/jpeg','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de lectura pública (GET sin autenticación)
CREATE POLICY "icons_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'icons');

-- 3. Solo service_role puede subir/modificar/borrar (assets gestionados por admin)
CREATE POLICY "icons_service_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'icons' AND auth.role() = 'service_role');

CREATE POLICY "icons_service_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'icons' AND auth.role() = 'service_role');

CREATE POLICY "icons_service_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'icons' AND auth.role() = 'service_role');
