'use client';

import { useEffect, useState } from 'react';
import type { Dict } from '@/lib/i18n';
import { formatDate, formatTime } from '@/lib/format';
import type { Invitation, InvitationMedia, LoveStoryItem } from '@/lib/types/database';

export function SectionShell({
  title,
  children,
  tone = 'cream',
}: {
  title?: string;
  children: React.ReactNode;
  tone?: 'cream' | 'white';
}) {
  return (
    <section className={tone === 'white' ? 'bg-white px-6 py-16' : 'px-6 py-16'}>
      <div className="reveal mx-auto max-w-2xl text-center">
        {title && (
          <>
            <h2 className="font-display text-3xl tracking-wide theme-text">{title}</h2>
            <div className="theme-bg mx-auto mt-4 h-px w-16 opacity-40" />
          </>
        )}
        <div className={title ? 'mt-8' : ''}>{children}</div>
      </div>
    </section>
  );
}

export function HeroSection({
  invitation,
  dict,
  coverImage,
}: {
  invitation: Invitation;
  dict: Dict;
  coverImage: string | null;
}) {
  const eventDate = invitation.akad_datetime ?? invitation.resepsi_datetime;

  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {coverImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}
      <div className={coverImage ? 'relative text-white' : 'relative text-ink'}>
        <p className="text-[11px] uppercase tracking-[0.35em] opacity-80">{dict.theWedding}</p>
        <h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">
          {invitation.groom_nickname}
          <span className="mx-3 opacity-70">&amp;</span>
          {invitation.bride_nickname}
        </h1>
        {eventDate && (
          <p className="mt-4 text-sm tracking-wide opacity-90">
            {formatDate(eventDate, invitation.language)}
          </p>
        )}
        <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed opacity-90">{dict.weInvite}</p>
      </div>
    </section>
  );
}

function Person({
  label,
  nickname,
  fullName,
  childOrder,
  father,
  mother,
  parentPrefix,
}: {
  label: string;
  nickname: string | null;
  fullName: string | null;
  childOrder: string | null;
  father: string | null;
  mother: string | null;
  parentPrefix: string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted">{label}</p>
      <h3 className="mt-3 font-display text-3xl theme-text">{fullName || nickname}</h3>
      {childOrder && <p className="mt-2 text-sm text-muted">{childOrder}</p>}
      {(father || mother) && (
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {parentPrefix}
          <br />
          {[father, mother].filter(Boolean).join(' & ')}
        </p>
      )}
    </div>
  );
}

export function CoupleSection({ invitation, dict }: { invitation: Invitation; dict: Dict }) {
  return (
    <SectionShell tone="white">
      {invitation.quote_text && (
        <p className="mb-12 text-sm italic leading-relaxed text-muted">
          &ldquo;{invitation.quote_text}&rdquo;
        </p>
      )}
      <div className="space-y-12">
        <Person
          label={dict.groom}
          nickname={invitation.groom_nickname}
          fullName={invitation.groom_full_name}
          childOrder={invitation.groom_child_order}
          father={invitation.groom_father}
          mother={invitation.groom_mother}
          parentPrefix={dict.sonOf}
        />
        <p className="font-display text-4xl theme-text opacity-50">&amp;</p>
        <Person
          label={dict.bride}
          nickname={invitation.bride_nickname}
          fullName={invitation.bride_full_name}
          childOrder={invitation.bride_child_order}
          father={invitation.bride_father}
          mother={invitation.bride_mother}
          parentPrefix={dict.daughterOf}
        />
      </div>
    </SectionShell>
  );
}

function useCountdown(target: string | null) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target || now === null) return null;

  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    passed: false,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownSection({ invitation, dict }: { invitation: Invitation; dict: Dict }) {
  const target = invitation.akad_datetime ?? invitation.resepsi_datetime;
  const countdown = useCountdown(target);

  if (!target) return null;

  const cells = countdown
    ? [
        { label: dict.days, value: countdown.days },
        { label: dict.hours, value: countdown.hours },
        { label: dict.minutes, value: countdown.minutes },
        { label: dict.seconds, value: countdown.seconds },
      ]
    : [];

  return (
    <SectionShell title={dict.countdown}>
      {countdown?.passed ? (
        <p className="text-sm text-muted">{dict.happened}</p>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {cells.map((cell) => (
            <div key={cell.label} className="rounded-2xl border border-line bg-white py-5">
              <p className="font-display text-3xl theme-text tabular-nums">
                {/* Render awal disamakan dengan server (—) untuk hindari hydration mismatch. */}
                {countdown ? String(cell.value).padStart(2, '0') : '—'}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{cell.label}</p>
            </div>
          ))}
          {!countdown &&
            [dict.days, dict.hours, dict.minutes, dict.seconds].map((label) => (
              <div key={label} className="rounded-2xl border border-line bg-white py-5">
                <p className="font-display text-3xl theme-text">—</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{label}</p>
              </div>
            ))}
        </div>
      )}
    </SectionShell>
  );
}

function EventCard({
  title,
  datetime,
  location,
  address,
  mapsUrl,
  dict,
  language,
}: {
  title: string;
  datetime: string | null;
  location: string | null;
  address: string | null;
  mapsUrl: string | null;
  dict: Dict;
  language: 'id' | 'en';
}) {
  if (!datetime && !location) return null;

  return (
    <article className="rounded-2xl border border-line bg-white p-7">
      <h3 className="font-display text-2xl theme-text">{title}</h3>
      {datetime && (
        <>
          <p className="mt-3 text-sm font-medium">{formatDate(datetime, language)}</p>
          <p className="text-sm text-muted">{formatTime(datetime, language)}</p>
        </>
      )}
      {location && <p className="mt-4 text-sm font-medium">{location}</p>}
      {address && <p className="mt-1 text-sm leading-relaxed text-muted">{address}</p>}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="theme-border theme-text mt-5 inline-block rounded-full border px-5 py-2 text-xs tracking-wide transition hover:opacity-75"
        >
          {dict.viewMap}
        </a>
      )}
    </article>
  );
}

export function EventsSection({ invitation, dict }: { invitation: Invitation; dict: Dict }) {
  return (
    <SectionShell title={dict.events} tone="white">
      <div className="space-y-5">
        <EventCard
          title={dict.akad}
          datetime={invitation.akad_datetime}
          location={invitation.akad_location}
          address={invitation.akad_address}
          mapsUrl={invitation.akad_maps_url}
          dict={dict}
          language={invitation.language}
        />
        <EventCard
          title={dict.resepsi}
          datetime={invitation.resepsi_datetime}
          location={invitation.resepsi_location}
          address={invitation.resepsi_address}
          mapsUrl={invitation.resepsi_maps_url}
          dict={dict}
          language={invitation.language}
        />
      </div>
    </SectionShell>
  );
}

export function GallerySection({ media, dict }: { media: InvitationMedia[]; dict: Dict }) {
  const [lightbox, setLightbox] = useState<InvitationMedia | null>(null);
  if (!media.length) return null;

  return (
    <>
      <section className="px-6 py-16">
        <div className="reveal mx-auto max-w-3xl">
          <h2 className="text-center font-display text-3xl tracking-wide theme-text">
            {dict.gallery}
          </h2>
          <div className="theme-bg mx-auto mt-4 h-px w-16 opacity-40" />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {media.map((item) =>
              item.type === 'video' ? (
                <video
                  key={item.id}
                  src={item.url}
                  controls
                  muted
                  playsInline
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightbox(item)}
                  className="overflow-hidden rounded-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.caption ?? ''}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition hover:scale-105"
                  />
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.caption ?? ''}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            className="absolute right-5 top-5 text-3xl leading-none text-white"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export function LoveStorySection({ invitation, dict }: { invitation: Invitation; dict: Dict }) {
  const items: LoveStoryItem[] = Array.isArray(invitation.love_story_json)
    ? invitation.love_story_json
    : [];
  if (!items.length) return null;

  return (
    <SectionShell title={dict.loveStory} tone="white">
      <ol className="theme-border space-y-8 border-l pl-6 text-left">
        {items.map((item, index) => (
          <li key={index} className="relative">
            <span className="theme-bg absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full" />
            {item.date && (
              <p className="text-xs uppercase tracking-wider text-muted">
                {formatDate(item.date, invitation.language)}
              </p>
            )}
            <h3 className="mt-1 font-display text-xl theme-text">{item.title}</h3>
            {item.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.description}</p>
            )}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function ClosingSection({ invitation, dict }: { invitation: Invitation; dict: Dict }) {
  return (
    <SectionShell title={dict.closing}>
      <p className="text-sm leading-relaxed text-muted">
        {invitation.closing_text || dict.closingDefault}
      </p>
      <p className="mt-8 text-xs uppercase tracking-[0.25em] text-muted">{dict.withLove}</p>
      <p className="mt-3 font-display text-4xl theme-text">
        {invitation.groom_nickname}
        <span className="mx-2 opacity-60">&amp;</span>
        {invitation.bride_nickname}
      </p>
    </SectionShell>
  );
}
