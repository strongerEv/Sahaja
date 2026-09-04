import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import { formatIDR } from '@/lib/format';
import { demoPackages, demoTemplates, isDemoMode } from '@/lib/demo/data';
import DemoBanner from '@/components/DemoBanner';
import type { Package, Template } from '@/lib/types/database';

export const revalidate = 3600;

const FEATURES = [
  {
    title: 'Builder step-by-step',
    body: 'Pilih template, isi data mempelai & acara, unggah galeri, atur musik. Tiap langkah bisa disimpan dan dilanjutkan nanti.',
  },
  {
    title: 'Link personal per tamu',
    body: 'Setiap tamu dapat link unik. Nama mereka muncul otomatis di sampul undangan, dan Anda tahu siapa yang sudah membukanya.',
  },
  {
    title: 'RSVP & buku tamu',
    body: 'Konfirmasi kehadiran beserta jumlah tamu dan catatan, plus kolom ucapan & doa yang bisa Anda moderasi.',
  },
  {
    title: 'Amplop digital',
    body: 'Tampilkan rekening, e-wallet, atau QRIS dengan tombol salin nomor — tamu tidak perlu mengetik ulang.',
  },
  {
    title: 'Rekap & export',
    body: 'Statistik kunjungan, rekap RSVP per kategori tamu, dan export daftar tamu ke PDF atau Excel.',
  },
  {
    title: 'Siap berkembang',
    body: 'Wedding planner, budget tracker, dan kolaborasi multi-role sedang disiapkan di atas data yang sama.',
  },
];

async function loadContent() {
  if (isDemoMode) {
    return { templates: demoTemplates, packages: demoPackages };
  }

  const supabase = createPublicClient();
  const [{ data: templates }, { data: packages }] = await Promise.all([
    supabase.from('templates').select('*').eq('is_active', true).limit(6),
    supabase.from('packages').select('*').eq('is_active', true).order('price_idr'),
  ]);

  return {
    templates: (templates ?? []) as Template[],
    packages: (packages ?? []) as Package[],
  };
}

export default async function LandingPage() {
  const { templates, packages } = await loadContent();

  return (
    <main>
      {isDemoMode && <DemoBanner />}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-display text-2xl tracking-[0.2em] text-brand-600">
            SAHAJA
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost btn-sm">
              Masuk
            </Link>
            <Link href="/register" className="btn-primary btn-sm">
              Buat undangan
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-brand-500">Undangan digital</p>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl leading-tight text-ink sm:text-6xl">
          Undangan pernikahan yang terasa personal, tanpa ribet
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
          Rancang undangan, sebar link personal ke tiap tamu, dan pantau siapa yang hadir —
          semuanya dari satu dashboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn-primary">
            Mulai gratis
          </Link>
          <Link href="#template" className="btn-ghost">
            Lihat template
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="section-title text-center">Semua yang Anda butuhkan</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-cream/60 p-6">
                <h3 className="font-display text-xl text-brand-700">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="template" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="section-title text-center">Pilihan template</h2>
        <p className="mt-2 text-center text-sm text-muted">
          Elegant, floral, minimalis, islami, adat, sampai modern — warna dan font bisa diubah.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <article key={t.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              {t.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.thumbnail_url}
                  alt={t.name}
                  className="h-52 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-52 w-full bg-brand-100" />
              )}
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl">{t.name}</h3>
                  {t.is_premium && (
                    <span className="badge bg-brand-100 text-brand-700">Premium</span>
                  )}
                </div>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted">{t.category}</p>
                <p className="mt-2 text-sm text-muted">{t.description}</p>
              </div>
            </article>
          ))}
          {templates.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              Template belum tersedia. Jalankan migrasi & seed Supabase terlebih dahulu.
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-line bg-white py-16">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="section-title text-center">Paket</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {packages.map((p) => (
              <div
                key={p.id}
                className={
                  p.code === 'basic'
                    ? 'rounded-2xl border-2 border-brand-400 bg-cream/70 p-6'
                    : 'rounded-2xl border border-line p-6'
                }
              >
                <h3 className="font-display text-2xl">{p.name}</h3>
                <p className="mt-1 text-2xl font-semibold text-brand-600">
                  {p.price_idr === 0 ? 'Gratis' : formatIDR(p.price_idr)}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {(p.features_json ?? []).map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-brand-400">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            Pembayaran online menyusul di fase berikutnya. Saat ini semua akun bisa mencoba
            builder secara penuh.
          </p>
        </div>
      </section>

      <footer className="border-t border-line py-10 text-center text-sm text-muted">
        <p className="font-display text-xl tracking-[0.2em] text-brand-600">SAHAJA</p>
        <p className="mt-2">Undangan digital untuk hari yang sekali seumur hidup.</p>
      </footer>
    </main>
  );
}
