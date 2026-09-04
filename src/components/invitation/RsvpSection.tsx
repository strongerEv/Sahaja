'use client';

import { useState } from 'react';
import { createPublicClient } from '@/lib/supabase/public';
import type { Dict } from '@/lib/i18n';
import { SectionShell } from './Sections';
import { cn } from '@/lib/utils';

export default function RsvpSection({
  dict,
  invitationSlug,
  guestSlug,
  guestName,
  disabled,
}: {
  dict: Dict;
  invitationSlug: string;
  guestSlug: string | null;
  guestName: string | null;
  disabled: boolean;
}) {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  // RSVP terikat ke tamu tertentu, jadi butuh link personal.
  if (!guestSlug || !guestName) {
    return (
      <SectionShell title={dict.rsvp}>
        <p className="text-sm text-muted">{dict.rsvpNeedLink}</p>
      </SectionShell>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (attending === null) {
      setError(dict.required);
      return;
    }
    if (disabled) return;

    setError(null);
    setStatus('sending');

    const supabase = createPublicClient();
    const { error: rpcError } = await supabase.rpc('submit_rsvp', {
      p_invitation_slug: invitationSlug,
      p_guest_slug: guestSlug,
      p_attending: attending,
      p_guest_count: attending ? count : 0,
      p_note: note || null,
    });

    if (rpcError) {
      setError(rpcError.message || dict.error);
      setStatus('idle');
      return;
    }
    setStatus('done');
  }

  return (
    <SectionShell title={dict.rsvp} tone="white">
      <p className="mb-6 text-sm leading-relaxed text-muted">{dict.rsvpIntro}</p>

      {status === 'done' ? (
        <p className="rounded-2xl bg-emerald-50 px-5 py-6 text-sm text-emerald-800">
          {dict.rsvpThanks}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4 text-left">
          <p className="text-center text-sm">
            <span className="text-muted">{dict.dearGuest} </span>
            <span className="font-medium">{guestName}</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAttending(true)}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm transition',
                attending === true
                  ? 'theme-bg theme-border text-white'
                  : 'border-line bg-white hover:border-brand-300',
              )}
            >
              {dict.attending}
            </button>
            <button
              type="button"
              onClick={() => setAttending(false)}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm transition',
                attending === false
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-white hover:border-brand-300',
              )}
            >
              {dict.notAttending}
            </button>
          </div>

          {attending === true && (
            <div>
              <label className="label" htmlFor="guest_count">
                {dict.guestCount}
              </label>
              <select
                id="guest_count"
                className="input"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label" htmlFor="rsvp_note">
              {dict.rsvpNote}
            </label>
            <textarea
              id="rsvp_note"
              rows={3}
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>

          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            className="theme-bg w-full rounded-full px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            disabled={status === 'sending' || disabled}
          >
            {status === 'sending' ? '…' : dict.sendRsvp}
          </button>

          {disabled && (
            <p className="text-center text-xs text-muted">{dict.draftBanner}</p>
          )}
        </form>
      )}
    </SectionShell>
  );
}
