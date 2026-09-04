'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteGuestbookEntry, toggleGuestbookVisibility } from '@/lib/actions/guest';
import { exportToExcel, exportToPdf } from '@/lib/export';
import { formatDateTime } from '@/lib/format';
import type { GuestbookEntry } from '@/lib/types/database';

export default function GuestbookModeration({
  weddingId,
  entries,
}: {
  weddingId: string;
  entries: GuestbookEntry[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'semua' | 'tampil' | 'disembunyikan'>('semua');

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (filter === 'tampil') return !entry.is_hidden;
        if (filter === 'disembunyikan') return entry.is_hidden;
        return true;
      }),
    [entries, filter],
  );

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Ucapan &amp; doa</h2>
            <p className="mt-1 text-sm text-muted">
              {entries.length} ucapan masuk · {entries.filter((e) => e.is_hidden).length}{' '}
              disembunyikan dari halaman publik.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="input max-w-[190px]"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="semua">Semua</option>
              <option value="tampil">Ditampilkan</option>
              <option value="disembunyikan">Disembunyikan</option>
            </select>
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={!filtered.length}
              onClick={() =>
                exportToExcel({
                  sheetName: 'Ucapan',
                  rows: filtered.map((e) => ({
                    Nama: e.name,
                    Ucapan: e.message,
                    Status: e.is_hidden ? 'Disembunyikan' : 'Ditampilkan',
                    Waktu: formatDateTime(e.created_at),
                  })),
                  fileName: 'buku-tamu',
                })
              }
            >
              Export Excel
            </button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={!filtered.length}
              onClick={() =>
                exportToPdf({
                  title: 'Buku Tamu Digital',
                  subtitle: `${filtered.length} ucapan · diekspor dari Sahaja`,
                  columns: ['Nama', 'Ucapan', 'Waktu'],
                  rows: filtered.map((e) => [e.name, e.message, formatDateTime(e.created_at)]),
                  fileName: 'buku-tamu',
                })
              }
            >
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card text-sm text-muted">Belum ada ucapan yang masuk.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((entry) => (
            <li
              key={entry.id}
              className={
                entry.is_hidden ? 'card border-dashed bg-cream/50 opacity-70' : 'card'
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{entry.name}</p>
                  <p className="text-xs text-muted">{formatDateTime(entry.created_at)}</p>
                </div>
                {entry.is_hidden && (
                  <span className="badge bg-amber-50 text-amber-700">Disembunyikan</span>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {entry.message}
              </p>
              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => toggleGuestbookVisibility(weddingId, entry.id, !entry.is_hidden))
                  }
                >
                  {entry.is_hidden ? 'Tampilkan' : 'Sembunyikan'}
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm text-red-600"
                  disabled={pending}
                  onClick={() => {
                    if (confirm('Hapus ucapan ini secara permanen?')) {
                      run(() => deleteGuestbookEntry(weddingId, entry.id));
                    }
                  }}
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
