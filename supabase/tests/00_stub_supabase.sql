-- =====================================================================
-- Tiruan minimal objek bawaan Supabase (auth, storage, role) supaya
-- migrasi bisa diuji di Postgres biasa tanpa perlu koneksi ke Supabase.
-- JANGAN dijalankan di project Supabase sungguhan.
-- =====================================================================

do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

-- Versi uji auth.uid(): membaca setting sesi, meniru klaim JWT.
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid
$$;

create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text,
  public boolean default false
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
  language sql immutable as $$ select string_to_array(name, '/') $$;

-- Helper assert supaya kegagalan test langsung menghentikan eksekusi.
create or replace function public.assert(condition boolean, label text)
returns void language plpgsql as $$
begin
  if condition is not true then
    raise exception 'FAIL: %', label;
  end if;
  raise notice 'pass  %', label;
end;
$$;
