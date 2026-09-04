-- =====================================================================
-- Uji fungsional: trigger, RPC publik, dan aturan validasi.
-- =====================================================================
\set ON_ERROR_STOP on
-- Buang keluaran baris hasil query; yang penting hanya NOTICE pass/FAIL.
\o /dev/null

-- ---------------------------------------------------------- data awal
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'ayu@example.com', '{"name":"Ayu"}');

select public.assert(
  (select count(*) from public.users where email = 'ayu@example.com') = 1,
  'signup membuat baris public.users lewat trigger');

insert into public.weddings (id, owner_user_id, groom_name, bride_name, wedding_date)
values ('22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111', 'Rizky', 'Ayu', '2026-11-20');

select public.assert(
  (select count(*) from public.wedding_members
    where wedding_id = '22222222-2222-2222-2222-222222222222' and role = 'owner') = 1,
  'pembuat wedding otomatis jadi member owner');

insert into public.invitations (id, wedding_id, slug, groom_nickname, bride_nickname,
                                akad_datetime, is_published)
values ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
        'rizky-ayu', 'Rizky', 'Ayu', now() + interval '30 days', true);

insert into public.guests (wedding_id, name, category, unique_slug)
values ('22222222-2222-2222-2222-222222222222', 'Budi Santoso', 'kantor', 'k7m2xq9p');

-- --------------------------------------------------- link personal tamu
select public.assert(
  (select guest_name from public.get_public_guest('rizky-ayu', 'k7m2xq9p')) = 'Budi Santoso',
  'link personal menampilkan nama tamu');

select public.assert(
  (select count(*) from public.get_public_guest('rizky-ayu', 'tidakada')) = 0,
  'slug tamu yang salah tidak membocorkan data');

-- ----------------------------------------------------------- kunjungan
select public.register_invitation_visit('rizky-ayu', 'k7m2xq9p', 'https://wa.me', 'test-agent');

select public.assert(
  (select view_count from public.invitations where slug = 'rizky-ayu') = 1
  and (select is_opened from public.guests where unique_slug = 'k7m2xq9p'),
  'kunjungan menaikkan view_count dan menandai tamu sudah membuka');

select public.register_invitation_visit('slug-tidak-ada', null, null, null);
select public.assert(true, 'kunjungan ke slug tak dikenal diabaikan tanpa error');

-- ---------------------------------------------------------------- RSVP
select public.submit_rsvp('rizky-ayu', 'k7m2xq9p', true, 3, 'Alergi seafood');
select public.submit_rsvp('rizky-ayu', 'k7m2xq9p', true, 2, 'Bawa anak');

select public.assert(
  (select count(*) from public.rsvps r join public.guests g on g.id = r.guest_id
    where g.unique_slug = 'k7m2xq9p') = 1
  and (select guest_count from public.rsvps r join public.guests g on g.id = r.guest_id
        where g.unique_slug = 'k7m2xq9p') = 2,
  'RSVP kedua memperbarui, bukan menduplikasi');

select public.submit_rsvp('rizky-ayu', 'k7m2xq9p', false, 5, null);
select public.assert(
  (select guest_count from public.rsvps r join public.guests g on g.id = r.guest_id
    where g.unique_slug = 'k7m2xq9p') = 0,
  'menyatakan tidak hadir memaksa jumlah tamu jadi 0');

select public.submit_rsvp('rizky-ayu', 'k7m2xq9p', true, 999, null);
select public.assert(
  (select guest_count from public.rsvps r join public.guests g on g.id = r.guest_id
    where g.unique_slug = 'k7m2xq9p') = 20,
  'jumlah tamu dibatasi maksimal 20');

-- ----------------------------------------------------------- buku tamu
select public.submit_guestbook_entry('rizky-ayu', 'Budi Santoso',
                                     'Selamat menempuh hidup baru!', 'k7m2xq9p');
select public.assert(
  (select count(*) from public.guestbook_entries
    where invitation_id = '33333333-3333-3333-3333-333333333333') = 1,
  'ucapan dari tamu tersimpan');

do $$
begin
  perform public.submit_guestbook_entry('rizky-ayu', '   ', '   ');
  raise exception 'FAIL: ucapan kosong seharusnya ditolak';
exception when sqlstate '22023' then
  raise notice 'pass  ucapan kosong ditolak';
end $$;

-- --------------------------------------------- undangan draft tertutup
insert into auth.users (id, email) values ('44444444-4444-4444-4444-444444444444', 'draft@example.com');
insert into public.weddings (id, owner_user_id, groom_name, bride_name)
values ('55555555-5555-5555-5555-555555555555',
        '44444444-4444-4444-4444-444444444444', 'Cakra', 'Dinda');
insert into public.invitations (wedding_id, slug, groom_nickname, bride_nickname, is_published)
values ('55555555-5555-5555-5555-555555555555', 'draft-couple', 'Cakra', 'Dinda', false);
insert into public.guests (wedding_id, name, unique_slug)
values ('55555555-5555-5555-5555-555555555555', 'Tamu Draft', 'zzz11111');

do $$
begin
  perform public.submit_guestbook_entry('draft-couple', 'X', 'Halo');
  raise exception 'FAIL: undangan draft seharusnya menolak ucapan';
exception when sqlstate 'P0002' then
  raise notice 'pass  undangan draft menolak ucapan';
end $$;

do $$
begin
  perform public.submit_rsvp('draft-couple', 'zzz11111', true, 1, null);
  raise exception 'FAIL: undangan draft seharusnya menolak RSVP';
exception when sqlstate 'P0002' then
  raise notice 'pass  undangan draft menolak RSVP';
end $$;

-- --------------------------------------------------- constraint & cascade
do $$
begin
  insert into public.invitations (wedding_id, slug, groom_nickname, bride_nickname)
  values ('22222222-2222-2222-2222-222222222222', 'undangan-kedua', 'X', 'Y');
  raise exception 'FAIL: satu wedding seharusnya hanya punya satu undangan';
exception when unique_violation then
  raise notice 'pass  satu wedding hanya boleh punya satu undangan';
end $$;

delete from public.weddings where id = '55555555-5555-5555-5555-555555555555';
select public.assert(
  (select count(*) from public.invitations where slug = 'draft-couple') = 0
  and (select count(*) from public.guests where unique_slug = 'zzz11111') = 0,
  'menghapus wedding ikut menghapus undangan & tamunya');
