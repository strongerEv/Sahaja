'use client';

import { useState } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import { DEMO_NOTICE, isDemoMode } from '@/lib/demo/flag';
import type { Dict } from '@/lib/i18n';
import type { GuestbookEntry } from '@/lib/types/database';
import { formatDateTime } from '@/lib/format';
import { SectionShell } from './Sections';

export default function GuestbookSection({
  dict,
  invitationSlug,
  guestSlug,
  guestName,
  initialEntries,
  disabled,
}: {
  dict: Dict;
  invitationSlug: string;
  guestSlug: string | null;
  guestName: string | null;
  initialEntries: GuestbookEntry[];
  disabled: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [name, setName] = useState(guestName ?? '');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError(dict.required);
      return;
    }
    if (disabled) return;

    setError(null);
    setStatus('sending');

    if (!isDemoMode) {
      const supabase = createPublicClient();
      const { error: rpcError } = await supabase.rpc('submit_guestbook_entry', {
        p_invitation_slug: invitationSlug,
        p_name: name.trim(),
        p_message: message.trim(),
        p_guest_slug: guestSlug,
      });

      if (rpcError) {
        setError(rpcError.message || dict.error);
        setStatus('idle');
        return;
      }
    }

    // Tampilkan ucapan sendiri langsung tanpa perlu reload.
    setEntries((prev) => [
      {
        id: `local-${Date.now()}`,
        invitation_id: '',
        guest_id: null,
        name: name.trim(),
        message: message.trim(),
        is_hidden: false,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setMessage('');
    setStatus('done');
  }

  return (
    <SectionShell title={dict.guestbook}>
      <form onSubmit={submit} className="space-y-3 text-left">
        <div>
          <label className="label" htmlFor="gb_name">
            {dict.yourName}
          </label>
          <input
            id="gb_name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="gb_message">
            {dict.yourMessage}
          </label>
          <textarea
            id="gb_message"
            rows={4}
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            required
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
        {status === 'done' && (
          <div className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            <p>{dict.guestbookThanks}</p>
            {isDemoMode && <p className="mt-1 text-xs text-emerald-700/80">{DEMO_NOTICE}</p>}
          </div>
        )}

        <button
          type="submit"
          className="theme-bg w-full rounded-full px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          disabled={status === 'sending' || disabled}
        >
          {status === 'sending' ? '…' : dict.sendMessage}
        </button>
      </form>

      <div className="mt-10 space-y-3 text-left">
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted">{dict.noMessages}</p>
        ) : (
          <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{entry.name}</p>
                  <p className="text-[11px] text-muted">{formatDateTime(entry.created_at)}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {entry.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionShell>
  );
}
