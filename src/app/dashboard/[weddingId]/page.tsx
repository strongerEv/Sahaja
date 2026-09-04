import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CopyButton from '@/components/CopyButton';
import { invitationUrl } from '@/lib/utils';
import { formatShortDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function WeddingOverview({ params }: { params: { weddingId: string } }) {
  const supabase = createClient();
  const weddingId = params.weddingId;

  const [{ data: invitation }, { count: guestCount }, { data: rsvpRows }] = await Promise.all([
    supabase
      .from('invitations')
      .select('id, slug, is_published, view_count, akad_datetime, resepsi_datetime, template_id')
      .eq('wedding_id', weddingId)
      .maybeSingle(),
    supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', weddingId),
    supabase
      .from('guests')
      .select('id, is_opened, rsvps(attending, guest_count)')
      .eq('wedding_id', weddingId),
  ]);

  const guests = rsvpRows ?? [];
  const attending = guests.filter((g) => {
    const rsvp = Array.isArray(g.rsvps) ? g.rsvps[0] : g.rsvps;
    return rsvp?.attending === true;
  });
  const declined = guests.filter((g) => {
    const rsvp = Array.isArray(g.rsvps) ? g.rsvps[0] : g.rsvps;
    return rsvp?.attending === false;
  });
  const headcount = attending.reduce((sum, g) => {
    const rsvp = Array.isArray(g.rsvps) ? g.rsvps[0] : g.rsvps;
    return sum + (rsvp?.guest_count ?? 0);
  }, 0);
  const opened = guests.filter((g) => g.is_opened).length;

  const stats = [
    { label: 'Total tamu', value: guestCount ?? 0 },
    { label: 'Sudah buka undangan', value: opened },
    { label: 'Konfirmasi hadir', value: attending.length },
    { label: 'Total orang hadir', value: headcount },
    { label: 'Tidak hadir', value: declined.length },
    { label: 'Kunjungan halaman', value: invitation?.view_count ?? 0 },
  ];

  const checklist = [
    { done: Boolean(invitation?.template_id), label: 'Pilih template desain' },
    {
      done: Boolean(invitation?.akad_datetime || invitation?.resepsi_datetime),
      label: 'Isi jadwal akad / resepsi',
    },
    { done: (guestCount ?? 0) > 0, label: 'Tambahkan daftar tamu' },
    { done: Boolean(invitation?.is_published), label: 'Publikasikan undangan' },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 font-display text-4xl text-brand-600">{stat.value}</p>
          </div>
        ))}
      </section>

      {invitation && (
        <section className="card">
          <h2 className="font-display text-2xl">Link undangan</h2>
          <p className="mt-1 text-sm text-muted">
            {invitation.is_published
              ? 'Undangan sudah live. Sebar link personal per tamu dari halaman Daftar Tamu.'
              : 'Undangan masih draft — tamu belum bisa membukanya. Publikasikan dulu setelah data lengkap.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-xl bg-cream px-3.5 py-2.5 text-sm">
              {invitationUrl(invitation.slug)}
            </code>
            <CopyButton value={invitationUrl(invitation.slug)} />
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-display text-2xl">Langkah berikutnya</h2>
          <ul className="mt-4 space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    item.done
                      ? 'flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white'
                      : 'h-5 w-5 rounded-full border border-line'
                  }
                >
                  {item.done ? '✓' : ''}
                </span>
                <span className={item.done ? 'text-muted line-through' : ''}>{item.label}</span>
              </li>
            ))}
          </ul>
          <Link href={`/dashboard/${weddingId}/builder`} className="btn-primary btn-sm mt-5">
            Buka builder
          </Link>
        </div>

        <div className="card bg-brand-50/50">
          <h2 className="font-display text-2xl">Segera hadir</h2>
          <p className="mt-1 text-sm text-muted">
            Modul lanjutan yang akan menempel ke wedding project yang sama.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Wedding Planner — checklist &amp; vendor tracker</span>
              <span className="badge bg-white text-brand-600">soon</span>
            </li>
            <li className="flex justify-between">
              <span>Budget Tracker — alokasi vs realisasi</span>
              <span className="badge bg-white text-brand-600">soon</span>
            </li>
            <li className="flex justify-between">
              <span>Kolaborasi multi-role</span>
              <span className="badge bg-white text-brand-600">soon</span>
            </li>
          </ul>
        </div>
      </section>

      <p className="text-xs text-muted">
        Terakhir diperbarui {formatShortDate(new Date().toISOString())}.
      </p>
    </div>
  );
}
