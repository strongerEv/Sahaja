-- =====================================================================
-- Uji Row Level Security: isolasi antar pengguna, akses publik anonim,
-- dan hak admin platform. Dijalankan setelah 01_smoke.sql.
-- =====================================================================
\set ON_ERROR_STOP on
-- Buang keluaran baris hasil query; yang penting hanya NOTICE pass/FAIL.
\o /dev/null

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Pengguna kedua dengan wedding-nya sendiri.
insert into auth.users (id, email) values ('66666666-6666-6666-6666-666666666666', 'lain@example.com');
insert into public.weddings (id, owner_user_id, groom_name, bride_name)
values ('77777777-7777-7777-7777-777777777777',
        '66666666-6666-6666-6666-666666666666', 'Eka', 'Fitri');

-- --------------------------------------------------- sebagai pemilik
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';

select public.assert(
  (select count(*) from public.weddings) = 1
  and (select id from public.weddings) = '22222222-2222-2222-2222-222222222222',
  'pemilik hanya melihat wedding miliknya');
select public.assert((select count(*) from public.guests) = 1,
  'pemilik melihat daftar tamunya sendiri');
select public.assert((select count(*) from public.invitations) = 1,
  'pemilik melihat undangannya sendiri');
commit;

-- ----------------------------------------------- sebagai pengguna lain
begin;
set local role authenticated;
set local test.uid = '66666666-6666-6666-6666-666666666666';

select public.assert(
  (select count(*) from public.weddings) = 1
  and (select id from public.weddings) = '77777777-7777-7777-7777-777777777777',
  'pengguna lain tidak melihat wedding orang');
select public.assert((select count(*) from public.guests) = 0,
  'daftar tamu tidak bocor ke pengguna lain');
select public.assert((select count(*) from public.rsvps) = 0,
  'RSVP tidak bocor ke pengguna lain');
select public.assert((select count(*) from public.invitation_visits) = 0,
  'statistik kunjungan tidak bocor ke pengguna lain');
select public.assert((select count(*) from public.checklists) = 0,
  'tabel checklist (fase 3) ikut terlindungi');
select public.assert((select count(*) from public.budget_expenses) = 0,
  'tabel budget (fase 3) ikut terlindungi');

-- RLS menyaring baris, jadi UPDATE ini mengenai 0 baris (bukan error).
update public.weddings set groom_name = 'Dibajak'
 where id = '22222222-2222-2222-2222-222222222222';
commit;

-- Dibuktikan dari sisi pemilik: namanya harus tetap utuh.
begin;
set local role authenticated;
set local test.uid = '11111111-1111-1111-1111-111111111111';
select public.assert(
  (select groom_name from public.weddings
    where id = '22222222-2222-2222-2222-222222222222') = 'Rizky',
  'pengguna lain tidak bisa mengubah wedding orang');
commit;

-- ------------------------------------------------- sebagai tamu anonim
begin;
set local role anon;
set local test.uid = '';

select public.assert(
  (select bool_and(is_published) from public.invitations),
  'publik hanya melihat undangan yang sudah dipublikasikan');
select public.assert((select count(*) from public.guests) = 0,
  'daftar tamu tertutup dari publik');
select public.assert((select count(*) from public.rsvps) = 0,
  'data RSVP tertutup dari publik');
select public.assert((select count(*) from public.users) = 0,
  'data pengguna tertutup dari publik');
commit;

-- Ucapan yang disembunyikan tidak boleh tampil di halaman undangan.
update public.guestbook_entries set is_hidden = true;
begin;
set local role anon;
set local test.uid = '';
select public.assert((select count(*) from public.guestbook_entries) = 0,
  'ucapan yang disembunyikan tidak tampil ke publik');
commit;
update public.guestbook_entries set is_hidden = false;

-- ------------------------------------------------- sebagai admin platform
update public.users set role_platform = 'platform_admin'
 where id = '66666666-6666-6666-6666-666666666666';

begin;
set local role authenticated;
set local test.uid = '66666666-6666-6666-6666-666666666666';
select public.assert((select count(*) from public.weddings) = 2,
  'admin platform melihat semua wedding');
select public.assert((select count(*) from public.users) >= 3,
  'admin platform melihat semua pengguna');
commit;
