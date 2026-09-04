import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatShortDate } from '@/lib/format';
import { demoWeddings, isDemoMode } from '@/lib/demo/data';
import type { Wedding } from '@/lib/types/database';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

type WeddingRow = Wedding & {
  invitations: Array<{ slug: string; is_published: boolean; view_count: number }> | null;
};

async function loadWeddings(): Promise<WeddingRow[]> {
  if (isDemoMode) return demoWeddings;

  const supabase = createClient();
  const { data } = await supabase
    .from('weddings')
    .select('*, invitations(slug, is_published, view_count)')
    .order('created_at', { ascending: false });

  return (data ?? []) as WeddingRow[];
}

export default async function DashboardHome() {
  const weddings = await loadWeddings();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Undangan Anda</h1>
          <p className="mt-1 text-sm text-muted">
            Setiap undangan berdiri di atas satu &ldquo;wedding project&rdquo; — nantinya planner
            dan budget ikut menempel ke sini.
          </p>
        </div>
        <Link href="/dashboard/new" className="btn-primary">
          + Buat undangan
        </Link>
      </div>

      {weddings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <p className="font-display text-2xl text-brand-600">Belum ada undangan</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Mulai dari memilih template, lalu isi data mempelai dan acara lewat wizard.
          </p>
          <Link href="/dashboard/new" className="btn-primary mt-6">
            Buat undangan pertama
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weddings.map((wedding) => {
            const invitation = wedding.invitations?.[0];
            return (
              <Link
                key={wedding.id}
                href={`/dashboard/${wedding.id}`}
                className="card transition hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl leading-snug">
                    {wedding.groom_name} &amp; {wedding.bride_name}
                  </h2>
                  <span
                    className={
                      invitation?.is_published
                        ? 'badge bg-emerald-50 text-emerald-700'
                        : 'badge bg-amber-50 text-amber-700'
                    }
                  >
                    {invitation?.is_published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {wedding.wedding_date ? formatShortDate(wedding.wedding_date) : 'Tanggal belum diisi'}
                </p>
                {invitation && (
                  <p className="mt-3 truncate text-xs text-muted">
                    /u/{invitation.slug} · {invitation.view_count} kunjungan
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
