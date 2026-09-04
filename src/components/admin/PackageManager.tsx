'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { savePackage } from '@/lib/actions/admin';
import { formatIDR } from '@/lib/format';
import type { Package } from '@/lib/types/database';

export default function PackageManager({ packages }: { packages: Package[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Package | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const active = editing;
  const showForm = creating || Boolean(editing);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await savePackage(active?.id ?? null, formData);
      setFeedback(
        result?.error
          ? { type: 'err', text: result.error }
          : { type: 'ok', text: result?.message ?? 'Tersimpan.' },
      );
      if (!result?.error) {
        setEditing(null);
        setCreating(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <p
          className={
            feedback.type === 'ok'
              ? 'rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700'
              : 'rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700'
          }
        >
          {feedback.text}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl">Paket harga</h1>
          <p className="mt-1 text-sm text-muted">
            Struktur paket sudah aktif; pembayaran otomatis menyusul di fase monetisasi.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          + Paket baru
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="card space-y-4" key={active?.id ?? 'new'}>
          <h2 className="font-display text-xl">{active ? `Edit: ${active.name}` : 'Paket baru'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="code">Kode</label>
              <input id="code" name="code" className="input" defaultValue={active?.code ?? ''} placeholder="premium" required />
            </div>
            <div>
              <label className="label" htmlFor="name">Nama</label>
              <input id="name" name="name" className="input" defaultValue={active?.name ?? ''} required />
            </div>
            <div>
              <label className="label" htmlFor="price_idr">Harga (Rp)</label>
              <input id="price_idr" name="price_idr" type="number" min={0} className="input" defaultValue={active?.price_idr ?? 0} />
            </div>
            <div>
              <label className="label" htmlFor="max_guests">Batas tamu</label>
              <input id="max_guests" name="max_guests" type="number" min={0} className="input" defaultValue={active?.max_guests ?? ''} placeholder="kosong = tanpa batas" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="features">Fitur (satu per baris)</label>
            <textarea
              id="features"
              name="features"
              rows={5}
              className="input"
              defaultValue={(active?.features_json ?? []).join('\n')}
            />
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="has_watermark" defaultChecked={active?.has_watermark ?? true} className="accent-brand-500" />
              Ada watermark Sahaja
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="custom_domain" defaultChecked={active?.custom_domain ?? false} className="accent-brand-500" />
              Boleh custom domain
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_active" defaultChecked={active?.is_active ?? true} className="accent-brand-500" />
              Aktif
            </label>
          </div>
          <div className="flex gap-2 border-t border-line pt-4">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-2xl">{pkg.name}</h3>
              {!pkg.is_active && <span className="badge bg-cream text-muted">Nonaktif</span>}
            </div>
            <p className="mt-1 text-xl font-semibold text-brand-600">
              {pkg.price_idr === 0 ? 'Gratis' : formatIDR(pkg.price_idr)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Batas tamu: {pkg.max_guests ?? 'tanpa batas'}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {(pkg.features_json ?? []).map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <button
              type="button"
              className="btn-ghost btn-sm mt-4"
              onClick={() => {
                setCreating(false);
                setEditing(pkg);
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
