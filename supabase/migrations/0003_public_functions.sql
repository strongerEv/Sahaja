-- =====================================================================
-- SAHAJA — RPC untuk halaman publik undangan.
-- Semua SECURITY DEFINER + validasi di dalam fungsi, supaya tamu anonim
-- bisa RSVP / kirim ucapan / tercatat kunjungannya TANPA perlu policy
-- insert terbuka dan TANPA service-role key di runtime publik.
-- =====================================================================

-- Data tamu untuk personalisasi "Kepada Yth." — hanya membocorkan nama
-- tamu yang slug-nya memang dipegang oleh si tamu itu sendiri.
create or replace function public.get_public_guest(p_invitation_slug text, p_guest_slug text)
returns table (guest_id uuid, guest_name text, category text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select g.id, g.name, g.category
  from public.guests g
  join public.invitations i on i.wedding_id = g.wedding_id
  where g.unique_slug = p_guest_slug
    and i.slug = p_invitation_slug
    and i.is_published;
end;
$$;

-- Catat kunjungan + tandai tamu sudah membuka undangan.
create or replace function public.register_invitation_visit(
  p_invitation_slug text,
  p_guest_slug text default null,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_inv    public.invitations%rowtype;
  v_guest_id uuid;
begin
  select * into v_inv from public.invitations
  where slug = p_invitation_slug and is_published;

  if v_inv.id is null then
    return;
  end if;

  if p_guest_slug is not null then
    select g.id into v_guest_id
    from public.guests g
    where g.unique_slug = p_guest_slug and g.wedding_id = v_inv.wedding_id;
  end if;

  insert into public.invitation_visits (invitation_id, guest_id, referrer, user_agent)
  values (v_inv.id, v_guest_id, left(p_referrer, 500), left(p_user_agent, 500));

  update public.invitations
  set view_count = view_count + 1
  where id = v_inv.id;

  if v_guest_id is not null then
    update public.guests
    set is_opened = true,
        opened_at = coalesce(opened_at, now()),
        open_count = open_count + 1
    where id = v_guest_id;
  end if;
end;
$$;

-- RSVP: satu tamu satu RSVP (boleh diubah selama undangan masih publish).
create or replace function public.submit_rsvp(
  p_invitation_slug text,
  p_guest_slug text,
  p_attending boolean,
  p_guest_count integer default 1,
  p_note text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_guest_id uuid;
  v_rsvp_id  uuid;
  v_count    integer;
begin
  select g.id into v_guest_id
  from public.guests g
  join public.invitations i on i.wedding_id = g.wedding_id
  where g.unique_slug = p_guest_slug
    and i.slug = p_invitation_slug
    and i.is_published;

  if v_guest_id is null then
    raise exception 'Tamu tidak ditemukan atau undangan belum dipublikasikan'
      using errcode = 'P0002';
  end if;

  v_count := greatest(0, least(coalesce(p_guest_count, 1), 20));
  if p_attending is false then
    v_count := 0;
  end if;

  insert into public.rsvps (guest_id, attending, guest_count, note)
  values (v_guest_id, p_attending, v_count, nullif(left(trim(p_note), 500), ''))
  on conflict (guest_id) do update
    set attending = excluded.attending,
        guest_count = excluded.guest_count,
        note = excluded.note,
        updated_at = now()
  returning id into v_rsvp_id;

  return v_rsvp_id;
end;
$$;

-- Buku tamu digital: tamu (dengan atau tanpa link personal) kirim ucapan.
create or replace function public.submit_guestbook_entry(
  p_invitation_slug text,
  p_name text,
  p_message text,
  p_guest_slug text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_inv_id   uuid;
  v_wedding  uuid;
  v_guest_id uuid;
  v_entry_id uuid;
  v_name     text := nullif(left(trim(p_name), 100), '');
  v_message  text := nullif(left(trim(p_message), 1000), '');
begin
  select i.id, i.wedding_id into v_inv_id, v_wedding
  from public.invitations i
  where i.slug = p_invitation_slug and i.is_published;

  if v_inv_id is null then
    raise exception 'Undangan tidak ditemukan' using errcode = 'P0002';
  end if;

  if v_name is null or v_message is null then
    raise exception 'Nama dan ucapan wajib diisi' using errcode = '22023';
  end if;

  if p_guest_slug is not null then
    select g.id into v_guest_id
    from public.guests g
    where g.unique_slug = p_guest_slug and g.wedding_id = v_wedding;
  end if;

  insert into public.guestbook_entries (invitation_id, guest_id, name, message)
  values (v_inv_id, v_guest_id, v_name, v_message)
  returning id into v_entry_id;

  return v_entry_id;
end;
$$;

-- Hak eksekusi untuk pengunjung anonim & user login.
grant execute on function public.get_public_guest(text, text)                     to anon, authenticated;
grant execute on function public.register_invitation_visit(text, text, text, text) to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, boolean, integer, text)   to anon, authenticated;
grant execute on function public.submit_guestbook_entry(text, text, text, text)    to anon, authenticated;
