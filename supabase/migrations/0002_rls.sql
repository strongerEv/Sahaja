-- =====================================================================
-- SAHAJA — Row Level Security
-- Aturan utama: user hanya bisa akses `weddings` yang dia jadi member-nya
-- (via wedding_members). Fase 1 baru ada role 'owner', tapi policy sudah
-- ditulis generik supaya fase kolaborasi tinggal nambah baris member.
-- =====================================================================

-- ------------------------------------------------------ helper functions
-- SECURITY DEFINER supaya query ke wedding_members di dalam policy tidak
-- memicu rekursi RLS pada tabel itu sendiri.
-- Cast uuid yang aman: mengembalikan null (bukan error) untuk teks tak valid.
-- Dipakai policy storage yang membaca wedding_id dari folder pertama pada path.
create or replace function public.safe_uuid(value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return value::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.is_wedding_member(wid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = wid and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_wedding_role(wid uuid, roles wedding_member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.wedding_members m
    where m.wedding_id = wid
      and m.user_id = auth.uid()
      and m.role = any (roles)
  );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role_platform = 'platform_admin'
  );
$$;

-- wedding_id dari sebuah invitation (dipakai policy tabel turunan).
create or replace function public.invitation_wedding_id(inv uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select i.wedding_id from public.invitations i where i.id = inv;
$$;

create or replace function public.guest_wedding_id(g uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gs.wedding_id from public.guests gs where gs.id = g;
$$;

-- Undangan yang sudah dipublish boleh dibaca publik.
create or replace function public.invitation_is_published(inv uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select i.is_published from public.invitations i where i.id = inv), false);
$$;

-- ------------------------------------------------------------ enable RLS
alter table public.users                    enable row level security;
alter table public.weddings                 enable row level security;
alter table public.wedding_members          enable row level security;
alter table public.templates                enable row level security;
alter table public.packages                 enable row level security;
alter table public.invitations              enable row level security;
alter table public.invitation_media         enable row level security;
alter table public.digital_envelopes_config enable row level security;
alter table public.guests                   enable row level security;
alter table public.rsvps                    enable row level security;
alter table public.guestbook_entries        enable row level security;
alter table public.invitation_visits        enable row level security;
alter table public.checklists               enable row level security;
alter table public.vendors                  enable row level security;
alter table public.budget_allocations       enable row level security;
alter table public.budget_expenses          enable row level security;
alter table public.activity_logs            enable row level security;

-- ---------------------------------------------------------------- users
drop policy if exists users_self_select on public.users;
create policy users_self_select on public.users
  for select using (id = auth.uid() or public.is_platform_admin());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ------------------------------------------------------------- weddings
drop policy if exists weddings_member_select on public.weddings;
create policy weddings_member_select on public.weddings
  for select using (public.is_wedding_member(id) or public.is_platform_admin());

drop policy if exists weddings_insert_own on public.weddings;
create policy weddings_insert_own on public.weddings
  for insert with check (owner_user_id = auth.uid());

drop policy if exists weddings_owner_update on public.weddings;
create policy weddings_owner_update on public.weddings
  for update using (public.has_wedding_role(id, array['owner','partner']::wedding_member_role[]))
  with check (public.has_wedding_role(id, array['owner','partner']::wedding_member_role[]));

drop policy if exists weddings_owner_delete on public.weddings;
create policy weddings_owner_delete on public.weddings
  for delete using (owner_user_id = auth.uid());

-- ------------------------------------------------------- wedding_members
drop policy if exists members_select on public.wedding_members;
create policy members_select on public.wedding_members
  for select using (user_id = auth.uid() or public.is_wedding_member(wedding_id));

drop policy if exists members_owner_manage on public.wedding_members;
create policy members_owner_manage on public.wedding_members
  for all
  using (public.has_wedding_role(wedding_id, array['owner']::wedding_member_role[]))
  with check (public.has_wedding_role(wedding_id, array['owner']::wedding_member_role[]));

-- ------------------------------------------------- templates & packages
drop policy if exists templates_public_read on public.templates;
create policy templates_public_read on public.templates
  for select using (is_active or public.is_platform_admin());

drop policy if exists templates_admin_write on public.templates;
create policy templates_admin_write on public.templates
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists packages_public_read on public.packages;
create policy packages_public_read on public.packages
  for select using (is_active or public.is_platform_admin());

drop policy if exists packages_admin_write on public.packages;
create policy packages_admin_write on public.packages
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------- invitations
-- Publik boleh baca undangan yang sudah dipublish (halaman /u/[slug]).
drop policy if exists invitations_public_read on public.invitations;
create policy invitations_public_read on public.invitations
  for select using (is_published or public.is_wedding_member(wedding_id) or public.is_platform_admin());

drop policy if exists invitations_member_write on public.invitations;
create policy invitations_member_write on public.invitations
  for all
  using (public.has_wedding_role(wedding_id, array['owner','partner','planner']::wedding_member_role[]))
  with check (public.has_wedding_role(wedding_id, array['owner','partner','planner']::wedding_member_role[]));

drop policy if exists media_public_read on public.invitation_media;
create policy media_public_read on public.invitation_media
  for select using (
    public.invitation_is_published(invitation_id)
    or public.is_wedding_member(public.invitation_wedding_id(invitation_id))
  );

drop policy if exists media_member_write on public.invitation_media;
create policy media_member_write on public.invitation_media
  for all
  using (public.is_wedding_member(public.invitation_wedding_id(invitation_id)))
  with check (public.is_wedding_member(public.invitation_wedding_id(invitation_id)));

drop policy if exists envelope_public_read on public.digital_envelopes_config;
create policy envelope_public_read on public.digital_envelopes_config
  for select using (
    public.invitation_is_published(invitation_id)
    or public.is_wedding_member(public.invitation_wedding_id(invitation_id))
  );

drop policy if exists envelope_member_write on public.digital_envelopes_config;
create policy envelope_member_write on public.digital_envelopes_config
  for all
  using (public.is_wedding_member(public.invitation_wedding_id(invitation_id)))
  with check (public.is_wedding_member(public.invitation_wedding_id(invitation_id)));

-- --------------------------------------------------------------- guests
-- Daftar tamu TIDAK dibuka ke publik. Lookup tamu lewat unique_slug
-- ditangani server-side (service role) di API route, supaya tamu lain
-- tidak bisa meng-enumerate daftar undangan.
drop policy if exists guests_member_all on public.guests;
create policy guests_member_all on public.guests
  for all using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

drop policy if exists rsvps_member_all on public.rsvps;
create policy rsvps_member_all on public.rsvps
  for all using (public.is_wedding_member(public.guest_wedding_id(guest_id)))
  with check (public.is_wedding_member(public.guest_wedding_id(guest_id)));

-- Ucapan yang tidak di-hide boleh dibaca publik di undangan terpublish.
drop policy if exists guestbook_public_read on public.guestbook_entries;
create policy guestbook_public_read on public.guestbook_entries
  for select using (
    (is_hidden = false and public.invitation_is_published(invitation_id))
    or public.is_wedding_member(public.invitation_wedding_id(invitation_id))
  );

drop policy if exists guestbook_member_write on public.guestbook_entries;
create policy guestbook_member_write on public.guestbook_entries
  for all
  using (public.is_wedding_member(public.invitation_wedding_id(invitation_id)))
  with check (public.is_wedding_member(public.invitation_wedding_id(invitation_id)));

-- Insert ucapan dari tamu anonim divalidasi di API route (service role),
-- jadi tidak ada policy insert untuk anon di sini.

drop policy if exists visits_member_read on public.invitation_visits;
create policy visits_member_read on public.invitation_visits
  for select using (public.is_wedding_member(public.invitation_wedding_id(invitation_id)));

-- --------------------------------------- modul coming soon (fase 3)
drop policy if exists checklists_member_all on public.checklists;
create policy checklists_member_all on public.checklists
  for all using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

drop policy if exists vendors_member_all on public.vendors;
create policy vendors_member_all on public.vendors
  for all using (public.is_wedding_member(wedding_id))
  with check (public.is_wedding_member(wedding_id));

drop policy if exists allocations_member_all on public.budget_allocations;
create policy allocations_member_all on public.budget_allocations
  for all using (public.has_wedding_role(wedding_id, array['owner','partner','planner']::wedding_member_role[]))
  with check (public.has_wedding_role(wedding_id, array['owner','partner','planner']::wedding_member_role[]));

drop policy if exists expenses_member_all on public.budget_expenses;
create policy expenses_member_all on public.budget_expenses
  for all using (public.has_wedding_role(wedding_id, array['owner','partner','planner']::wedding_member_role[]))
  with check (public.has_wedding_role(wedding_id, array['owner','partner','planner']::wedding_member_role[]));

drop policy if exists activity_member_read on public.activity_logs;
create policy activity_member_read on public.activity_logs
  for select using (public.is_wedding_member(wedding_id));

drop policy if exists activity_member_insert on public.activity_logs;
create policy activity_member_insert on public.activity_logs
  for insert with check (public.is_wedding_member(wedding_id));
