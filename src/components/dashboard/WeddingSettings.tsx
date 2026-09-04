'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteWedding, updateWedding } from '@/lib/actions/wedding';
import type { Wedding, WeddingMemberRole } from '@/lib/types/database';

const ROLE_LABEL: Record<WeddingMemberRole, string> = {
  owner: 'Pengantin (owner)',
  partner: 'Pasangan',
  family: 'Keluarga',
  planner: 'Wedding Organizer',
  vendor: 'Vendor',
};

export default function WeddingSettings({
  wedding,
  members,
}: {
  wedding: Wedding;
  members: Array<{
    id: string;
    role: WeddingMemberRole;
    user_id: string;
    users: { name: string | null; email: string | null } | null;
  }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateWedding(wedding.id, formData);
      setFeedback(
        result?.error
          ? { type: 'err', text: result.error }
          : { type: 'ok', text: result?.message ?? 'Tersimpan.' },
      );
      if (!result?.error) router.refresh();
    });
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

      <form onSubmit={onSubmit} className="card space-y-4">
        <h2 className="font-display text-2xl">Data wedding</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="groom_name">Nama mempelai pria</label>
            <input id="groom_name" name="groom_name" className="input" defaultValue={wedding.groom_name} required />
          </div>
          <div>
            <label className="label" htmlFor="bride_name">Nama mempelai wanita</label>
            <input id="bride_name" name="bride_name" className="input" defaultValue={wedding.bride_name} required />
          </div>
          <div>
            <label className="label" htmlFor="wedding_date">Tanggal pernikahan</label>
            <input
              id="wedding_date"
              name="wedding_date"
              type="date"
              className="input"
              defaultValue={wedding.wedding_date ?? ''}
            />
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" name="status" className="input" defaultValue={wedding.status}>
              <option value="draft">Draft</option>
              <option value="active">Aktif</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Menyimpan…' : 'Simpan perubahan'}
        </button>
      </form>

      <div className="card">
        <h2 className="font-display text-2xl">Tim &amp; akses</h2>
        <p className="mt-1 text-sm text-muted">
          Saat ini baru pemilik yang punya akses. Mengundang pasangan, keluarga, dan wedding
          organizer dengan hak akses berbeda menyusul di fase kolaborasi.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{member.users?.name ?? 'Tanpa nama'}</p>
                <p className="text-xs text-muted">{member.users?.email ?? member.user_id}</p>
              </div>
              <span className="badge bg-brand-50 text-brand-700">{ROLE_LABEL[member.role]}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-ghost mt-4" disabled>
          + Undang anggota (segera hadir)
        </button>
      </div>

      <div className="card border-red-200">
        <h2 className="font-display text-2xl text-red-700">Hapus wedding</h2>
        <p className="mt-1 text-sm text-muted">
          Menghapus wedding ini akan menghapus undangan, daftar tamu, RSVP, dan semua ucapan yang
          terkait. Tindakan ini tidak bisa dibatalkan.
        </p>
        <button
          type="button"
          className="btn-ghost mt-4 border-red-200 text-red-700 hover:bg-red-50"
          disabled={pending}
          onClick={() => {
            const answer = prompt(
              `Ketik "HAPUS" untuk mengonfirmasi penghapusan ${wedding.groom_name} & ${wedding.bride_name}.`,
            );
            if (answer === 'HAPUS') {
              startTransition(async () => {
                const result = await deleteWedding(wedding.id);
                if (result?.error) setFeedback({ type: 'err', text: result.error });
              });
            }
          }}
        >
          Hapus permanen
        </button>
      </div>
    </div>
  );
}
