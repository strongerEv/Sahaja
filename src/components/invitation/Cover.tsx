'use client';

import type { Dict } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import type { Invitation } from '@/lib/types/database';

export default function Cover({
  invitation,
  dict,
  guestName,
  coverImage,
  onOpen,
}: {
  invitation: Invitation;
  dict: Dict;
  guestName: string | null;
  coverImage: string | null;
  onOpen: () => void;
}) {
  const eventDate = invitation.akad_datetime ?? invitation.resepsi_datetime;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {coverImage && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-ink bg-cover bg-center"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div aria-hidden className="absolute inset-0 bg-black/45" />
        </>
      )}

      <div className={coverImage ? 'relative text-white' : 'relative text-ink'}>
        <p className="text-[11px] uppercase tracking-[0.35em] opacity-80">{dict.theWedding}</p>

        <h1 className="mt-6 font-display text-5xl leading-tight sm:text-6xl">
          {invitation.groom_nickname}
          <span className="mx-3 opacity-70">&amp;</span>
          {invitation.bride_nickname}
        </h1>

        {eventDate && (
          <p className="mt-4 text-sm tracking-wide opacity-90">{formatDate(eventDate, invitation.language)}</p>
        )}

        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.2em] opacity-75">{dict.dearGuest}</p>
          <p className="mt-2 font-display text-2xl">{guestName ?? dict.dearGuestFallback}</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="theme-bg mt-10 rounded-full px-8 py-3 text-sm font-medium tracking-wide text-white shadow-lg transition hover:opacity-90"
        >
          {dict.openInvitation}
        </button>
      </div>
    </section>
  );
}
