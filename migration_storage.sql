-- ============================================================
-- Migratie: Supabase Storage bucket voor receptfotos
-- Plak dit in de Supabase SQL Editor en klik op "Run"
-- ============================================================

-- Publieke bucket aanmaken
insert into storage.buckets (id, name, public)
values ('recepten-fotos', 'recepten-fotos', true)
on conflict (id) do nothing;

-- Iedereen mag fotos lezen (publieke bucket)
create policy "fotos_select"
  on storage.objects for select
  using (bucket_id = 'recepten-fotos');

-- Ingelogde gebruikers mogen fotos uploaden
create policy "fotos_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'recepten-fotos'
    and auth.role() = 'authenticated'
  );

-- Ingelogde gebruikers mogen fotos verwijderen
create policy "fotos_delete"
  on storage.objects for delete
  using (
    bucket_id = 'recepten-fotos'
    and auth.role() = 'authenticated'
  );
