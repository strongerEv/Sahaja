-- =====================================================================
-- SAHAJA — Storage bucket untuk galeri foto/video, musik, dan QRIS.
-- Path convention: <wedding_id>/<nama-file>
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('invitation-media', 'invitation-media', true)
on conflict (id) do nothing;

-- Siapa pun boleh melihat file (halaman undangan publik).
drop policy if exists "invitation media public read" on storage.objects;
create policy "invitation media public read" on storage.objects
  for select using (bucket_id = 'invitation-media');

-- Upload/ubah/hapus hanya oleh member wedding pemilik folder.
-- Folder pertama pada path harus berupa wedding_id.
drop policy if exists "invitation media member write" on storage.objects;
create policy "invitation media member write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'invitation-media'
    and public.is_wedding_member(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "invitation media member update" on storage.objects;
create policy "invitation media member update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'invitation-media'
    and public.is_wedding_member(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "invitation media member delete" on storage.objects;
create policy "invitation media member delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'invitation-media'
    and public.is_wedding_member(public.safe_uuid((storage.foldername(name))[1]))
  );
