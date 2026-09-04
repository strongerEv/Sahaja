import Link from 'next/link';
import { isDemoMode } from '@/lib/demo/data';

export const metadata = { title: 'Mode demo' };

const STEPS = [
  {
    title: 'Buat project Supabase',
    body: 'Daftar gratis di supabase.com, lalu buat satu project baru. Region Singapore paling dekat untuk pengguna Indonesia.',
  },
  {
    title: 'Jalankan migrasi',
    body: 'Buka SQL Editor di dashboard Supabase, lalu jalankan berkas di folder supabase/migrations secara berurutan: 0001 sampai 0005.',
  },
  {
    title: 'Isi environment variable di Vercel',
    body: 'Project Settings → Environment Variables. Tambahkan NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan NEXT_PUBLIC_SITE_URL (URL deployment Anda).',
  },
  {
    title: 'Deploy ulang',
    body: 'Setelah variabel terisi, jalankan redeploy. Mode demo mati sendiri dan aplikasi langsung memakai database sungguhan.',
  },
];

export default function DemoInfoPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Kembali ke beranda
      </Link>

      <h1 className="mt-4 font-display text-4xl">
        {isDemoMode ? 'Aplikasi sedang berjalan dalam mode demo' : 'Mode demo tidak aktif'}
      </h1>

      {isDemoMode ? (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Kredensial Supabase belum terpasang, jadi seluruh halaman diisi data contoh. Anda bisa
          menjelajahi builder, dashboard, dan halaman undangan seperti biasa — hanya saja tidak ada
          yang tersimpan, dan tombol simpan akan memberi tahu hal itu.
        </p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Kredensial Supabase sudah terpasang. Aplikasi memakai database sungguhan, dan data contoh
          tidak lagi ditampilkan.
        </p>
      )}

      {isDemoMode && (
        <>
          <h2 className="mt-10 font-display text-2xl">Yang bisa dicoba sekarang</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              •{' '}
              <Link href="/u/rizky-ayu?to=k7m2xq9p" className="text-brand-600 underline">
                Halaman undangan dengan link personal tamu
              </Link>{' '}
              — nama tamu muncul otomatis di sampul.
            </li>
            <li>
              •{' '}
              <Link href="/dashboard" className="text-brand-600 underline">
                Dashboard
              </Link>{' '}
              — rekap RSVP, daftar tamu, statistik kunjungan, moderasi ucapan.
            </li>
            <li>
              •{' '}
              <Link href="/dashboard/demo-wedding/builder" className="text-brand-600 underline">
                Builder undangan
              </Link>{' '}
              — sembilan langkah dari template sampai publikasi.
            </li>
            <li>
              •{' '}
              <Link href="/admin" className="text-brand-600 underline">
                Admin platform
              </Link>{' '}
              — manajemen pengguna, template, dan paket harga.
            </li>
          </ul>

          <h2 className="mt-10 font-display text-2xl">Mengaktifkan penyimpanan</h2>
          <ol className="mt-4 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="card">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-xs text-muted">
            Langkah lengkapnya juga ada di README repositori. Aplikasi ini tidak membutuhkan
            service-role key — cukup URL project dan anon key.
          </p>
        </>
      )}
    </main>
  );
}
