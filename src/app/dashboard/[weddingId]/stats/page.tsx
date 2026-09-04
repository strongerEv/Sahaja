import { createClient } from '@/lib/supabase/server';
import { formatDateTime } from '@/lib/format';
import type { Guest } from '@/lib/types/database';

export const metadata = { title: 'Statistik kunjungan' };
export const dynamic = 'force-dynamic';

export default async function StatsPage({ params }: { params: { weddingId: string } }) {
  const supabase = createClient();

  const { data: invitation } = await supabase
    .from('invitations')
    .select('id, view_count, published_at')
    .eq('wedding_id', params.weddingId)
    .maybeSingle();

  const [{ data: guests }, { data: visits }] = await Promise.all([
    supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', params.weddingId)
      .order('opened_at', { ascending: false, nullsFirst: false }),
    invitation
      ? supabase
          .from('invitation_visits')
          .select('id, created_at, guest_id')
          .eq('invitation_id', invitation.id)
          .order('created_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as Array<{ id: string; created_at: string; guest_id: string | null }> }),
  ]);

  const guestList = (guests ?? []) as Guest[];
  const opened = guestList.filter((g) => g.is_opened);
  const notOpened = guestList.filter((g) => !g.is_opened);
  const anonymousVisits = (visits ?? []).filter((v) => !v.guest_id).length;

  // Kunjungan per hari (7 hari terakhir) untuk grafik batang sederhana.
  const buckets = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }
  for (const visit of visits ?? []) {
    const key = visit.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const series = Array.from(buckets.entries());
  const peak = Math.max(1, ...series.map(([, count]) => count));

  const stats = [
    { label: 'Total kunjungan', value: invitation?.view_count ?? 0 },
    { label: 'Tamu yang sudah buka', value: opened.length },
    { label: 'Tamu belum buka', value: notOpened.length },
    { label: 'Kunjungan tanpa link tamu', value: anonymousVisits },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 font-display text-3xl text-brand-600">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="font-display text-2xl">Kunjungan 7 hari terakhir</h2>
        <div className="mt-6 flex h-40 items-end gap-3">
          {series.map(([day, count]) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs text-muted">{count}</span>
              <div
                className="w-full rounded-t bg-brand-400"
                style={{ height: `${Math.round((count / peak) * 100)}%`, minHeight: 2 }}
                title={`${count} kunjungan pada ${day}`}
              />
              <span className="text-[10px] text-muted">{day.slice(5)}</span>
            </div>
          ))}
        </div>
        {!invitation?.published_at && (
          <p className="mt-4 text-xs text-muted">
            Undangan belum dipublikasikan — statistik baru terisi setelah tamu bisa mengaksesnya.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="font-display text-2xl">Siapa yang sudah membuka</h2>
        <p className="mt-1 text-sm text-muted">
          Diurutkan dari yang paling baru membuka undangan.
        </p>
        {guestList.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Belum ada tamu terdaftar.</p>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2.5 pr-3">Nama</th>
                  <th className="py-2.5 pr-3">Kategori</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Jumlah buka</th>
                  <th className="py-2.5">Pertama dibuka</th>
                </tr>
              </thead>
              <tbody>
                {guestList.map((guest) => (
                  <tr key={guest.id} className="border-b border-line/60">
                    <td className="py-3 pr-3 font-medium">{guest.name}</td>
                    <td className="py-3 pr-3 text-muted">{guest.category}</td>
                    <td className="py-3 pr-3">
                      {guest.is_opened ? (
                        <span className="badge bg-emerald-50 text-emerald-700">Sudah dibuka</span>
                      ) : (
                        <span className="badge bg-cream text-muted">Belum</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">{guest.open_count}</td>
                    <td className="py-3 text-xs text-muted">
                      {guest.opened_at ? formatDateTime(guest.opened_at) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
