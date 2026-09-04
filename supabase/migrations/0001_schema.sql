-- =====================================================================
-- SAHAJA — Skema inti
-- Prinsip: `weddings` adalah entitas pusat. Modul undangan (fase 1),
-- planner/budget/kolaborasi (fase 3) semuanya nempel ke wedding_id,
-- supaya aktivasi fase berikutnya tidak butuh migrasi besar.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
do $$ begin
  create type platform_role as enum ('user', 'platform_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wedding_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wedding_member_role as enum ('owner', 'partner', 'family', 'planner', 'vendor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_type as enum ('photo', 'video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invitation_language as enum ('id', 'en');
exception when duplicate_object then null; end $$;

do $$ begin
  create type checklist_status as enum ('todo', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vendor_status as enum ('shortlist', 'contacted', 'booked', 'paid', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- users
-- Mirror dari auth.users supaya bisa di-join & dipakai admin platform.
create table if not exists public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text,
  email         text unique,
  phone         text,
  role_platform platform_role not null default 'user',
  created_at    timestamptz not null default now()
);

-- Auto-provision baris users setiap ada signup baru di auth.users.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ------------------------------------------------------------- weddings
create table if not exists public.weddings (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  groom_name    text not null,
  bride_name    text not null,
  wedding_date  date,
  status        wedding_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists weddings_owner_idx on public.weddings (owner_user_id);

-- Disiapkan untuk fase kolaborasi multi-role. Fase 1 hanya diisi 'owner'.
create table if not exists public.wedding_members (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid not null references public.weddings (id) on delete cascade,
  user_id          uuid not null references public.users (id) on delete cascade,
  role             wedding_member_role not null default 'owner',
  permissions_json jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  unique (wedding_id, user_id)
);
create index if not exists wedding_members_user_idx on public.wedding_members (user_id);

-- ------------------------------------------------------------ templates
create table if not exists public.templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  category       text not null,          -- elegant | floral | minimalis | islami | adat | modern
  description    text,
  thumbnail_url  text,
  default_config jsonb not null default '{}'::jsonb,
  is_premium     boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists templates_category_idx on public.templates (category) where is_active;

-- Paket harga — strukturnya disiapkan, payment gateway baru fase 2.
create table if not exists public.packages (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,   -- free | premium | exclusive
  name           text not null,
  price_idr      integer not null default 0,
  features_json  jsonb not null default '[]'::jsonb,
  max_guests     integer,                -- null = tanpa batas
  has_watermark  boolean not null default true,
  custom_domain  boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------- invitations
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  package_id  uuid references public.packages (id) on delete set null,
  slug        text not null unique,
  language    invitation_language not null default 'id',

  -- Data mempelai (detail; nama ringkas ada di weddings)
  groom_nickname   text,
  groom_full_name  text,
  groom_child_order text,
  groom_father     text,
  groom_mother     text,
  bride_nickname   text,
  bride_full_name  text,
  bride_child_order text,
  bride_father     text,
  bride_mother     text,

  -- Tema & layout
  theme_color  text not null default '#A6753F',
  font         text not null default 'display',
  sections_config_json jsonb not null default '{}'::jsonb,

  -- Acara
  akad_datetime    timestamptz,
  akad_location    text,
  akad_address     text,
  akad_maps_url    text,
  resepsi_datetime timestamptz,
  resepsi_location text,
  resepsi_address  text,
  resepsi_maps_url text,

  -- Konten
  love_story_json  jsonb not null default '[]'::jsonb,
  quote_text       text,
  closing_text     text,
  music_url        text,
  cover_image_url  text,

  is_published boolean not null default false,
  published_at timestamptz,
  view_count   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists invitations_wedding_idx on public.invitations (wedding_id);
create index if not exists invitations_published_idx on public.invitations (slug) where is_published;

create table if not exists public.invitation_media (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  type          media_type not null default 'photo',
  url           text not null,
  caption       text,
  order_index   integer not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists invitation_media_inv_idx on public.invitation_media (invitation_id, order_index);

create table if not exists public.digital_envelopes_config (
  id              uuid primary key default gen_random_uuid(),
  invitation_id   uuid not null unique references public.invitations (id) on delete cascade,
  is_enabled      boolean not null default true,
  bank_name       text,
  account_number  text,
  account_holder  text,
  bank_name_2     text,
  account_number_2 text,
  account_holder_2 text,
  ewallet_qris_url text,
  gift_address     text,
  note             text,
  updated_at      timestamptz not null default now()
);

-- --------------------------------------------------------------- guests
-- unique_slug = short random string (bukan nama), supaya link tamu lain
-- tidak bisa ditebak-tebak.
create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  name        text not null,
  category    text not null default 'umum',   -- keluarga | teman | kantor | umum
  unique_slug text not null unique,
  phone       text,
  address     text,
  is_opened   boolean not null default false,
  opened_at   timestamptz,
  open_count  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists guests_wedding_idx on public.guests (wedding_id);

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null unique references public.guests (id) on delete cascade,
  attending   boolean not null,
  guest_count integer not null default 1 check (guest_count >= 0),
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.guestbook_entries (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_id      uuid references public.guests (id) on delete set null,
  name          text not null,
  message       text not null,
  is_hidden     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists guestbook_inv_idx on public.guestbook_entries (invitation_id, created_at desc);

-- Statistik kunjungan per link tamu (dipakai dashboard "siapa yang sudah buka").
create table if not exists public.invitation_visits (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_id      uuid references public.guests (id) on delete set null,
  referrer      text,
  user_agent    text,
  created_at    timestamptz not null default now()
);
create index if not exists visits_inv_idx on public.invitation_visits (invitation_id, created_at desc);

-- =====================================================================
-- FASE COMING SOON — tabel dibuat sejak awal, UI/logic menyusul.
-- =====================================================================

create table if not exists public.checklists (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  task_name  text not null,
  category   text,
  due_date   date,
  status     checklist_status not null default 'todo',
  assignee_user_id uuid references public.users (id) on delete set null,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists checklists_wedding_idx on public.checklists (wedding_id, due_date);

create table if not exists public.vendors (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings (id) on delete cascade,
  name         text not null,
  category     text,
  contact      text,
  status       vendor_status not null default 'shortlist',
  price_quote  bigint,
  dp_amount    bigint,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists vendors_wedding_idx on public.vendors (wedding_id);

create table if not exists public.budget_allocations (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid not null references public.weddings (id) on delete cascade,
  category         text not null,
  allocated_amount bigint not null default 0,
  created_at       timestamptz not null default now(),
  unique (wedding_id, category)
);

create table if not exists public.budget_expenses (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings (id) on delete cascade,
  category     text not null,
  amount       bigint not null default 0,
  note         text,
  expense_date date not null default current_date,
  vendor_id    uuid references public.vendors (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_wedding_idx on public.budget_expenses (wedding_id, expense_date desc);

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings (id) on delete cascade,
  user_id     uuid references public.users (id) on delete set null,
  action_type text not null,
  description text,
  meta_json   jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists activity_logs_wedding_idx on public.activity_logs (wedding_id, created_at desc);

-- ------------------------------------------------------- updated_at trg
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weddings_touch on public.weddings;
create trigger weddings_touch before update on public.weddings
  for each row execute function public.touch_updated_at();

drop trigger if exists invitations_touch on public.invitations;
create trigger invitations_touch before update on public.invitations
  for each row execute function public.touch_updated_at();

drop trigger if exists rsvps_touch on public.rsvps;
create trigger rsvps_touch before update on public.rsvps
  for each row execute function public.touch_updated_at();

-- Owner otomatis jadi member 'owner' saat wedding dibuat.
create or replace function public.handle_new_wedding()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role)
  values (new.id, new.owner_user_id, 'owner')
  on conflict (wedding_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_wedding_created on public.weddings;
create trigger on_wedding_created
  after insert on public.weddings
  for each row execute function public.handle_new_wedding();
