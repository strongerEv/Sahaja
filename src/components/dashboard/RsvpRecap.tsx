'use client';

import { useMemo, useState } from 'react';
import { exportToExcel, exportToPdf } from '@/lib/export';
import { formatDateTime } from '@/lib/format';
import type { GuestRsvpRow } from '@/app/dashboard/[weddingId]/rsvp/page';
import type { Rsvp } from '@/lib/types/database';

type Status = 'hadir' | 'tidak' | 'belum';

function rsvpOf(row: GuestRsvpRow): Rsvp | null {
  const value = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;
  return value ?? null;
}

function statusOf(row: GuestRsvpRow): Status {
  const rsvp = rsvpOf(row);
  if (!rsvp) return 'belum';
  return rsvp.attending ? 'hadir' : 'tidak';
}

const STATUS_LABEL: Record<Status, string> = {
  hadir: 'Hadir',
  tidak: 'Tidak hadir',
  belum: 'Belum respon',
};

const STATUS_CLASS: Record<Status, string> = {
  hadir: 'badge bg-emerald-50 text-emerald-700',
  tidak: 'badge bg-red-50 text-red-700',
  belum: 'badge bg-cream text-muted',
};

export default function RsvpRecap({ rows }: { rows: GuestRsvpRow[] }) {
  const [status, setStatus] = useState<'semua' | Status>('semua');
  const [category, setCategory] = useState('semua');

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category))).sort(),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchStatus = status === 'semua' || statusOf(row) === status;
        const matchCategory = category === 'semua' || row.category === category;
        return matchStatus && matchCategory;
      }),
    [rows, status, category],
  );

  const summary = useMemo(() => {
    const hadir = rows.filter((r) => statusOf(r) === 'hadir');
    const tidak = rows.filter((r) => statusOf(r) === 'tidak');
    const belum = rows.filter((r) => statusOf(r) === 'belum');
    const headcount = hadir.reduce((sum, r) => sum + (rsvpOf(r)?.guest_count ?? 0), 0);
    return [
      { label: 'Total tamu diundang', value: rows.length },
      { label: 'Konfirmasi hadir', value: hadir.length },
      { label: 'Estimasi orang datang', value: headcount },
      { label: 'Tidak hadir', value: tidak.length },
      { label: 'Belum respon', value: belum.length },
    ];
  }, [rows]);

  /** Rekap per kategori tamu — berguna untuk mengatur kuota per sesi. */
  const byCategory = useMemo(() => {
    const map = new Map<string, { hadir: number; tidak: number; belum: number; orang: number }>();
    for (const row of rows) {
      const entry = map.get(row.category) ?? { hadir: 0, tidak: 0, belum: 0, orang: 0 };
      const state = statusOf(row);
      entry[state] += 1;
      if (state === 'hadir') entry.orang += rsvpOf(row)?.guest_count ?? 0;
      map.set(row.category, entry);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  function tableRows() {
    return filtered.map((row) => {
      const rsvp = rsvpOf(row);
      return {
        Nama: row.name,
        Kategori: row.category,
        Status: STATUS_LABEL[statusOf(row)],
        'Jumlah Orang': rsvp?.guest_count ?? 0,
        Catatan: rsvp?.note ?? '',
        'Waktu Konfirmasi': rsvp ? formatDateTime(rsvp.created_at) : '',
      };
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((item) => (
          <div key={item.label} className="card">
            <p className="text-sm text-muted">{item.label}</p>
            <p className="mt-1 font-display text-3xl text-brand-600">{item.value}</p>
          </div>
        ))}
      </section>

      {byCategory.length > 0 && (
        <section className="card">
          <h2 className="font-display text-2xl">Rekap per kategori</h2>
          <div className="mt-4 -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2.5 pr-3">Kategori</th>
                  <th className="py-2.5 pr-3">Hadir</th>
                  <th className="py-2.5 pr-3">Tidak hadir</th>
                  <th className="py-2.5 pr-3">Belum respon</th>
                  <th className="py-2.5">Estimasi orang</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map(([name, entry]) => (
                  <tr key={name} className="border-b border-line/60">
                    <td className="py-2.5 pr-3 font-medium capitalize">{name}</td>
                    <td className="py-2.5 pr-3 text-emerald-700">{entry.hadir}</td>
                    <td className="py-2.5 pr-3 text-red-700">{entry.tidak}</td>
                    <td className="py-2.5 pr-3 text-muted">{entry.belum}</td>
                    <td className="py-2.5 font-medium">{entry.orang}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Detail RSVP</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost btn-sm"
              disabled={!filtered.length}
              onClick={() =>
                exportToExcel({ sheetName: 'RSVP', rows: tableRows(), fileName: 'rekap-rsvp' })
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
                  title: 'Rekap RSVP',
                  subtitle: `${filtered.length} baris · diekspor dari Sahaja`,
                  columns: ['Nama', 'Kategori', 'Status', 'Jumlah', 'Catatan'],
                  rows: filtered.map((row) => {
                    const rsvp = rsvpOf(row);
                    return [
                      row.name,
                      row.category,
                      STATUS_LABEL[statusOf(row)],
                      rsvp?.guest_count ?? 0,
                      rsvp?.note ?? '-',
                    ];
                  }),
                  fileName: 'rekap-rsvp',
                })
              }
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            className="input max-w-[200px]"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'semua' | Status)}
          >
            <option value="semua">Semua status</option>
            <option value="hadir">Hadir</option>
            <option value="tidak">Tidak hadir</option>
            <option value="belum">Belum respon</option>
          </select>
          <select
            className="input max-w-[200px]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="semua">Semua kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Belum ada data yang cocok.</p>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2.5 pr-3">Nama</th>
                  <th className="py-2.5 pr-3">Kategori</th>
                  <th className="py-2.5 pr-3">Status</th>
                  <th className="py-2.5 pr-3">Jumlah</th>
                  <th className="py-2.5 pr-3">Catatan</th>
                  <th className="py-2.5">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const rsvp = rsvpOf(row);
                  const state = statusOf(row);
                  return (
                    <tr key={row.id} className="border-b border-line/60">
                      <td className="py-3 pr-3 font-medium">{row.name}</td>
                      <td className="py-3 pr-3 text-muted">{row.category}</td>
                      <td className="py-3 pr-3">
                        <span className={STATUS_CLASS[state]}>{STATUS_LABEL[state]}</span>
                      </td>
                      <td className="py-3 pr-3">{rsvp?.guest_count ?? '-'}</td>
                      <td className="py-3 pr-3 max-w-[260px] text-muted">{rsvp?.note ?? '-'}</td>
                      <td className="py-3 text-xs text-muted">
                        {rsvp ? formatDateTime(rsvp.created_at) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
