'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  addGuest,
  deleteGuest,
  importGuests,
  regenerateGuestSlug,
} from '@/lib/actions/guest';
import { exportToExcel, exportToPdf, readGuestFile } from '@/lib/export';
import CopyButton from '@/components/CopyButton';
import { invitationUrl } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import type { Guest } from '@/lib/types/database';

export default function GuestManager({
  weddingId,
  guests,
  invitationSlug,
}: {
  weddingId: string;
  guests: Guest[];
  invitationSlug: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('semua');

  const categories = useMemo(
    () => Array.from(new Set(guests.map((g) => g.category))).sort(),
    [guests],
  );

  const filtered = useMemo(
    () =>
      guests.filter((guest) => {
        const matchCategory = category === 'semua' || guest.category === category;
        const matchSearch = guest.name.toLowerCase().includes(search.toLowerCase().trim());
        return matchCategory && matchSearch;
      }),
    [guests, search, category],
  );

  function run(fn: () => Promise<{ error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      setFeedback(
        result?.error
          ? { type: 'err', text: result.error }
          : { type: 'ok', text: result?.message ?? 'Berhasil.' },
      );
      if (!result?.error) router.refresh();
    });
  }

  function onAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(async () => {
      const result = await addGuest(weddingId, formData);
      if (!result?.error) formRef.current?.reset();
      return result;
    });
  }

  async function onImport(file: File) {
    setFeedback(null);
    try {
      const rows = await readGuestFile(file);
      if (!rows.length) {
        setFeedback({
          type: 'err',
          text: 'Tidak menemukan kolom "nama" di file. Pastikan baris pertama berisi judul kolom.',
        });
        return;
      }
      run(() => importGuests(weddingId, rows));
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Gagal membaca file.',
      });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function exportPdf() {
    exportToPdf({
      title: 'Daftar Tamu',
      subtitle: `${filtered.length} tamu · diekspor dari Sahaja`,
      columns: ['Nama', 'Kategori', 'Telepon', 'Link undangan', 'Dibuka'],
      rows: filtered.map((g) => [
        g.name,
        g.category,
        g.phone ?? '-',
        invitationUrl(invitationSlug, g.unique_slug),
        g.is_opened ? 'Ya' : 'Belum',
      ]),
      fileName: 'daftar-tamu',
    });
  }

  function exportExcel() {
    exportToExcel({
      sheetName: 'Daftar Tamu',
      rows: filtered.map((g) => ({
        Nama: g.name,
        Kategori: g.category,
        Telepon: g.phone ?? '',
        'Link Undangan': invitationUrl(invitationSlug, g.unique_slug),
        Dibuka: g.is_opened ? 'Ya' : 'Belum',
        'Waktu Dibuka': g.opened_at ? formatDateTime(g.opened_at) : '',
      })),
      fileName: 'daftar-tamu',
    });
  }

  /** Semua link personal sekaligus — enak untuk ditempel ke broadcast WhatsApp. */
  function copyAllLinks() {
    const text = filtered
      .map((g) => `${g.name}\t${invitationUrl(invitationSlug, g.unique_slug)}`)
      .join('\n');
    void navigator.clipboard.writeText(text);
    setFeedback({ type: 'ok', text: `${filtered.length} link disalin ke clipboard.` });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          role="status"
          className={
            feedback.type === 'ok'
              ? 'rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700'
              : 'rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700'
          }
        >
          {feedback.text}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <form ref={formRef} onSubmit={onAdd} className="card">
          <h2 className="font-display text-2xl">Tambah tamu</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="name">Nama</label>
              <input id="name" name="name" className="input" placeholder="Budi Santoso" required />
            </div>
            <div>
              <label className="label" htmlFor="category">Kategori</label>
              <input id="category" name="category" className="input" placeholder="keluarga" list="kategori-list" defaultValue="umum" />
              <datalist id="kategori-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="label" htmlFor="phone">Telepon (opsional)</label>
              <input id="phone" name="phone" className="input" placeholder="0812…" />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4" disabled={pending}>
            {pending ? 'Menyimpan…' : 'Tambah tamu'}
          </button>
        </form>

        <div className="card">
          <h2 className="font-display text-2xl">Import massal</h2>
          <p className="mt-1 text-sm text-muted">
            Unggah Excel/CSV dengan kolom <code>nama</code>, <code>kategori</code>,{' '}
            <code>telepon</code>. Link unik dibuat otomatis untuk tiap tamu.
          </p>
          <button
            type="button"
            className="btn-ghost mt-4 w-full"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
          >
            Pilih file Excel/CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => e.target.files?.[0] && void onImport(e.target.files[0])}
          />
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">
            {guests.length} tamu
            {filtered.length !== guests.length && (
              <span className="ml-2 text-sm font-normal text-muted">
                ({filtered.length} ditampilkan)
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={copyAllLinks} disabled={!filtered.length}>
              Salin semua link
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={exportExcel} disabled={!filtered.length}>
              Export Excel
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={exportPdf} disabled={!filtered.length}>
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <input
            className="input max-w-xs"
            placeholder="Cari nama tamu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="semua">Semua kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Belum ada tamu yang cocok.</p>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2.5 pr-3">Nama</th>
                  <th className="py-2.5 pr-3">Kategori</th>
                  <th className="py-2.5 pr-3">Status buka</th>
                  <th className="py-2.5 pr-3">Link personal</th>
                  <th className="py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guest) => {
                  const link = invitationUrl(invitationSlug, guest.unique_slug);
                  return (
                    <tr key={guest.id} className="border-b border-line/60">
                      <td className="py-3 pr-3 font-medium">{guest.name}</td>
                      <td className="py-3 pr-3 text-muted">{guest.category}</td>
                      <td className="py-3 pr-3">
                        {guest.is_opened ? (
                          <span className="badge bg-emerald-50 text-emerald-700">
                            Dibuka {guest.open_count}×
                          </span>
                        ) : (
                          <span className="badge bg-cream text-muted">Belum dibuka</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <code className="max-w-[220px] truncate text-xs text-muted">{link}</code>
                          <CopyButton value={link} label="Salin" className="btn-ghost btn-sm" />
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          onClick={() => run(() => regenerateGuestSlug(weddingId, guest.id))}
                          disabled={pending}
                          title="Buat ulang link kalau link lama terlanjur tersebar"
                        >
                          Ganti link
                        </button>
                        <button
                          type="button"
                          className="btn-ghost btn-sm ml-1 text-red-600"
                          onClick={() => {
                            if (confirm(`Hapus ${guest.name} dari daftar tamu?`)) {
                              run(() => deleteGuest(weddingId, guest.id));
                            }
                          }}
                          disabled={pending}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
