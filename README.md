# Sahaja

Platform undangan pernikahan digital: builder undangan, RSVP, buku tamu, amplop
digital, dan rekap tamu dalam satu dashboard.

Fase 1 (MVP) yang ada di repo ini fokus ke modul **undangan**. Struktur database
sudah dirancang dengan `weddings` sebagai entitas pusat, sehingga modul
**Wedding Planner**, **Budget Tracker**, dan **kolaborasi multi-role** bisa
diaktifkan nanti tanpa migrasi besar — tabelnya sudah ada sejak awal.

## Tech stack

| Bagian | Pilihan |
| --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database & Auth | Supabase (Postgres, Auth, Storage, RLS) |
| Export | jsPDF + jspdf-autotable (PDF), SheetJS (Excel) |

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local     # isi kredensial Supabase Anda
npm run dev
```

### Menyiapkan Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Jalankan berkas di `supabase/migrations/` **secara berurutan** lewat
   SQL Editor (atau `supabase db push` bila memakai Supabase CLI):

   | Berkas | Isi |
   | --- | --- |
   | `0001_schema.sql` | Semua tabel, enum, dan trigger — termasuk tabel fase 3 |
   | `0002_rls.sql` | Row Level Security untuk seluruh tabel |
   | `0003_public_functions.sql` | RPC untuk tamu anonim (RSVP, ucapan, statistik) |
   | `0004_seed.sql` | 6 template desain + 3 paket harga |
   | `0005_storage.sql` | Bucket `invitation-media` beserta policy-nya |

3. Salin **Project URL** dan **anon key** ke `.env.local`.

Aplikasi ini **tidak membutuhkan service-role key**. Alur tamu anonim berjalan
lewat fungsi `SECURITY DEFINER` di database, jadi tidak ada kunci istimewa yang
perlu disimpan di runtime.

### Menjadikan diri sebagai admin platform

Setelah mendaftar, jalankan di SQL Editor:

```sql
update public.users set role_platform = 'platform_admin' where email = 'email@anda.com';
```

Menu **Admin platform** akan muncul di dashboard.

## Struktur project

```
src/
├── app/
│   ├── page.tsx                    landing page (ISR, 1 jam)
│   ├── login|register/             autentikasi Supabase
│   ├── u/[slug]/                   halaman undangan publik — SSR, tanpa middleware auth
│   ├── dashboard/
│   │   ├── new/                    wizard pembuatan wedding
│   │   └── [weddingId]/
│   │       ├── builder/            wizard 9 langkah
│   │       ├── guests/             daftar tamu + import Excel/CSV + link personal
│   │       ├── rsvp/               rekap RSVP + filter kategori + export
│   │       ├── guestbook/          moderasi ucapan
│   │       ├── stats/              statistik kunjungan per tamu
│   │       ├── planner|budget/     placeholder "Coming Soon"
│   │       └── settings/           data wedding, tim, hapus
│   └── admin/                      manajemen user, template, paket harga
├── components/                     builder/, invitation/, dashboard/, admin/
└── lib/
    ├── supabase/                   client browser, server, publik, middleware
    ├── actions/                    server actions (wedding, invitation, guest, admin)
    ├── types/database.ts           tipe domain
    ├── i18n.ts                     kamus ID/EN untuk halaman undangan
    └── export.ts                   PDF, Excel, dan parser file tamu
supabase/
├── migrations/                     skema, RLS, RPC, seed, storage
└── tests/                          suite verifikasi (lihat di bawah)
```

Halaman undangan publik (`/u/[slug]`) sengaja dipisah dari dashboard: tidak
melewati middleware autentikasi, memakai client Supabase tanpa cookie, dan
di-cache 60 detik — supaya ringan diakses tamu dari perangkat apa pun.

## Keputusan desain penting

**Link personal per tamu.** `guests.unique_slug` diisi string acak 8 karakter
(alfabet tanpa `0/O` dan `1/l/I`), bukan nama tamu. Dengan begitu tamu tidak
bisa menebak link tamu lain. Bila sebuah link terlanjur tersebar, tombol
**Ganti link** di daftar tamu menerbitkan slug baru.

**Tamu anonim tanpa service-role key.** RSVP, ucapan, dan pencatatan kunjungan
memakai fungsi `SECURITY DEFINER` (`submit_rsvp`, `submit_guestbook_entry`,
`register_invitation_visit`). Validasi ada di dalam fungsi, dan tabel `guests`
tetap tertutup rapat dari `anon` — jadi daftar tamu tidak bisa dienumerasi.

**RLS berbasis keanggotaan.** Semua akses ke data wedding melewati
`is_wedding_member()` / `has_wedding_role()` yang membaca `wedding_members`.
Fase 1 hanya mengisi role `owner`, tapi menambah role lain nanti tidak perlu
mengubah satu policy pun.

**Waktu acara.** Disimpan sebagai `timestamptz` dan ditampilkan dalam WIB
(Indonesia tidak memakai DST, jadi offset tetap +07:00).

## Verifikasi

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # build produksi
```

### Test database

Migrasi dan policy bisa diuji terhadap Postgres biasa (tanpa Supabase). Suite
memasang tiruan minimal objek Supabase, menjalankan seluruh migrasi dua kali
untuk memastikan idempoten, lalu menjalankan 32 assertion:

```bash
createdb sahaja_test
PGURL="postgres://postgres@localhost:5432/sahaja_test" ./supabase/tests/run.sh
```

Yang diperiksa antara lain: trigger signup dan owner-member, RSVP yang
memperbarui alih-alih menduplikasi, pembatasan jumlah tamu, penolakan undangan
draft, cascade delete, isolasi data antar pengguna, ketertutupan daftar tamu
dari publik, penyaringan ucapan yang disembunyikan, dan hak admin platform.

## Yang belum dikerjakan (sesuai rencana fase berikutnya)

- Payment gateway (Midtrans/Xendit) — struktur `packages` sudah ada, alurnya belum.
- Custom domain per undangan.
- Aktivasi UI Planner, Budget, dan kolaborasi multi-role — tabelnya sudah siap.
- Notifikasi WhatsApp otomatis.
