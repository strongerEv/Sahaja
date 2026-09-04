'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { togglePublish } from '@/lib/actions/invitation';
import CopyButton from '@/components/CopyButton';
import { invitationUrl } from '@/lib/utils';
import type { Invitation } from '@/lib/types/database';

export default function StepPublish({
  weddingId,
  invitation,
}: {
  weddingId: string;
  invitation: Invitation;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const url = invitationUrl(invitation.slug);

  const readiness = [
    { ok: Boolean(invitation.template_id), label: 'Template dipilih' },
    {
      ok: Boolean(invitation.groom_nickname && invitation.bride_nickname),
      label: 'Nama panggilan kedua mempelai terisi',
    },
    {
      ok: Boolean(invitation.akad_datetime || invitation.resepsi_datetime),
      label: 'Minimal satu jadwal acara terisi',
    },
  ];
  const blocking = readiness.filter((item) => !item.ok);

  function toggle(publish: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await togglePublish(weddingId, invitation.id, publish);
      if (result?.error) setMessage({ type: 'err', text: result.error });
      else {
        setMessage({ type: 'ok', text: result?.message ?? 'Tersimpan.' });
        router.refresh();
      }
    });
  }

  return (
    <div className="card space-y-5">
      <header>
        <h2 className="font-display text-2xl">Pratinjau &amp; publikasi</h2>
        <p className="mt-1 text-sm text-muted">
          Selama masih draft, undangan hanya bisa dibuka lewat mode pratinjau oleh Anda.
        </p>
      </header>

      <ul className="space-y-2 text-sm">
        {readiness.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span
              className={
                item.ok
                  ? 'flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white'
                  : 'flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] text-white'
              }
            >
              {item.ok ? '✓' : '!'}
            </span>
            <span className={item.ok ? 'text-muted' : ''}>{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl bg-cream p-4">
        <p className="text-sm font-medium">Link undangan</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate text-sm">{url}</code>
          <CopyButton value={url} />
        </div>
        <p className="hint mt-2">
          Link personal per tamu (dengan nama otomatis) dibuat di menu Daftar Tamu.
        </p>
      </div>

      {message && (
        <p
          className={
            message.type === 'ok'
              ? 'rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700'
              : 'rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700'
          }
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Link href={`/u/${invitation.slug}?preview=1`} target="_blank" className="btn-ghost">
          Buka pratinjau ↗
        </Link>
        {invitation.is_published ? (
          <button type="button" className="btn-ghost" onClick={() => toggle(false)} disabled={pending}>
            {pending ? 'Memproses…' : 'Kembalikan ke draft'}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={() => toggle(true)}
            disabled={pending || blocking.length > 0}
          >
            {pending ? 'Memproses…' : 'Publikasikan undangan'}
          </button>
        )}
      </div>

      {blocking.length > 0 && !invitation.is_published && (
        <p className="text-xs text-amber-700">
          Lengkapi {blocking.length} poin di atas sebelum publikasi.
        </p>
      )}
    </div>
  );
}
